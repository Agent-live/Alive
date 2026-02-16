package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

const (
	googleJWKSEndpoint = "https://www.googleapis.com/oauth2/v3/certs"
	appleJWKSEndpoint  = "https://appleid.apple.com/auth/keys"
)

type SocialIdentity struct {
	Provider      string
	Subject       string
	Issuer        string
	Email         string
	EmailVerified bool
	Name          string
	Avatar        string
}

type jwksResponse struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type jwksCacheEntry struct {
	PublicKeys map[string]any
	ExpiresAt  time.Time
}

var (
	jwksCacheMu sync.Mutex
	jwksCache   = map[string]jwksCacheEntry{}
)

func VerifyGoogleIDToken(ctx context.Context, idToken string, allowedAudiences []string) (*SocialIdentity, error) {
	claims, err := verifyOIDCIDToken(ctx, idToken, googleJWKSEndpoint, []string{
		"https://accounts.google.com",
		"accounts.google.com",
	}, allowedAudiences)
	if err != nil {
		return nil, err
	}

	identity := &SocialIdentity{
		Provider: "google",
		Subject:  strings.TrimSpace(stringClaim(claims, "sub")),
		Issuer:   strings.TrimSpace(stringClaim(claims, "iss")),
		Email:    normalizeEmail(stringClaim(claims, "email")),
		Name:     strings.TrimSpace(stringClaim(claims, "name")),
		Avatar:   strings.TrimSpace(stringClaim(claims, "picture")),
	}
	identity.EmailVerified = boolClaim(claims, "email_verified")

	if identity.Subject == "" {
		return nil, errors.New("google token missing sub")
	}

	return identity, nil
}

func VerifyAppleIDToken(ctx context.Context, idToken string, allowedAudiences []string) (*SocialIdentity, error) {
	claims, err := verifyOIDCIDToken(ctx, idToken, appleJWKSEndpoint, []string{
		"https://appleid.apple.com",
	}, allowedAudiences)
	if err != nil {
		return nil, err
	}

	identity := &SocialIdentity{
		Provider: "apple",
		Subject:  strings.TrimSpace(stringClaim(claims, "sub")),
		Issuer:   strings.TrimSpace(stringClaim(claims, "iss")),
		Email:    normalizeEmail(stringClaim(claims, "email")),
	}
	identity.EmailVerified = boolClaim(claims, "email_verified")

	if identity.Subject == "" {
		return nil, errors.New("apple token missing sub")
	}

	return identity, nil
}

func verifyOIDCIDToken(ctx context.Context, idToken string, jwksURL string, allowedIssuers, allowedAudiences []string) (jwt.MapClaims, error) {
	token := strings.TrimSpace(idToken)
	if token == "" {
		return nil, errors.New("token is required")
	}

	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(parsedToken *jwt.Token) (any, error) {
		kid, _ := parsedToken.Header["kid"].(string)
		if strings.TrimSpace(kid) == "" {
			return nil, errors.New("token header missing kid")
		}
		return getJWKPublicKey(ctx, jwksURL, kid)
	}, jwt.WithValidMethods([]string{"RS256"}))
	if err != nil {
		return nil, fmt.Errorf("invalid id token: %w", err)
	}
	if !parsed.Valid {
		return nil, errors.New("invalid id token")
	}
	if err := claims.Valid(); err != nil {
		return nil, fmt.Errorf("token expired or not yet valid: %w", err)
	}

	issuer := strings.TrimSpace(stringClaim(claims, "iss"))
	if !containsString(allowedIssuers, issuer) {
		return nil, fmt.Errorf("unexpected token issuer: %s", issuer)
	}

	if len(allowedAudiences) > 0 {
		aud, ok := parseAudienceClaim(claims["aud"])
		if !ok {
			return nil, errors.New("token missing aud")
		}
		if !anyStringMatch(aud, allowedAudiences) {
			return nil, errors.New("token audience mismatch")
		}
	}

	return claims, nil
}

func getJWKPublicKey(ctx context.Context, jwksURL, kid string) (any, error) {
	now := time.Now()

	jwksCacheMu.Lock()
	entry, ok := jwksCache[jwksURL]
	if ok && now.Before(entry.ExpiresAt) {
		if key, hit := entry.PublicKeys[kid]; hit {
			jwksCacheMu.Unlock()
			return key, nil
		}
	}
	jwksCacheMu.Unlock()

	keys, expiresAt, err := fetchJWKSPublicKeys(ctx, jwksURL)
	if err != nil {
		return nil, err
	}

	jwksCacheMu.Lock()
	jwksCache[jwksURL] = jwksCacheEntry{PublicKeys: keys, ExpiresAt: expiresAt}
	jwksCacheMu.Unlock()

	key, ok := keys[kid]
	if !ok {
		return nil, fmt.Errorf("kid not found in jwks: %s", kid)
	}

	return key, nil
}

func fetchJWKSPublicKeys(ctx context.Context, jwksURL string) (map[string]any, time.Time, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
	if err != nil {
		return nil, time.Time{}, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, time.Time{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, time.Time{}, fmt.Errorf("failed to load jwks: %s", resp.Status)
	}

	var payload jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, time.Time{}, err
	}

	keys := make(map[string]any, len(payload.Keys))
	for _, item := range payload.Keys {
		if item.Kty != "RSA" || item.Kid == "" {
			continue
		}

		pubKey, err := parseRSAPublicKey(item.N, item.E)
		if err != nil {
			continue
		}

		keys[item.Kid] = pubKey
	}

	if len(keys) == 0 {
		return nil, time.Time{}, errors.New("jwks contains no valid rsa keys")
	}

	return keys, time.Now().Add(parseMaxAge(resp.Header.Get("Cache-Control"), time.Hour)), nil
}

func parseRSAPublicKey(encodedN, encodedE string) (*rsa.PublicKey, error) {
	modulusBytes, err := base64.RawURLEncoding.DecodeString(encodedN)
	if err != nil {
		return nil, err
	}
	exponentBytes, err := base64.RawURLEncoding.DecodeString(encodedE)
	if err != nil {
		return nil, err
	}

	modulus := new(big.Int).SetBytes(modulusBytes)
	exponent := new(big.Int).SetBytes(exponentBytes)
	if !exponent.IsInt64() {
		return nil, errors.New("rsa exponent overflow")
	}

	e := int(exponent.Int64())
	if e <= 0 {
		return nil, errors.New("rsa exponent is invalid")
	}

	return &rsa.PublicKey{
		N: modulus,
		E: e,
	}, nil
}

func parseMaxAge(cacheControl string, fallback time.Duration) time.Duration {
	header := strings.ToLower(cacheControl)
	parts := strings.Split(header, ",")
	for _, part := range parts {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) != 2 || kv[0] != "max-age" {
			continue
		}
		seconds, err := strconv.Atoi(kv[1])
		if err != nil || seconds <= 0 {
			continue
		}
		return time.Duration(seconds) * time.Second
	}
	return fallback
}

func parseAudienceClaim(raw any) ([]string, bool) {
	switch v := raw.(type) {
	case string:
		value := strings.TrimSpace(v)
		if value == "" {
			return nil, false
		}
		return []string{value}, true
	case []string:
		out := make([]string, 0, len(v))
		for _, item := range v {
			item = strings.TrimSpace(item)
			if item != "" {
				out = append(out, item)
			}
		}
		return out, len(out) > 0
	case []any:
		out := make([]string, 0, len(v))
		for _, item := range v {
			if str, ok := item.(string); ok {
				str = strings.TrimSpace(str)
				if str != "" {
					out = append(out, str)
				}
			}
		}
		return out, len(out) > 0
	default:
		return nil, false
	}
}

func stringClaim(claims jwt.MapClaims, key string) string {
	val, ok := claims[key]
	if !ok {
		return ""
	}
	switch v := val.(type) {
	case string:
		return v
	case json.Number:
		return v.String()
	default:
		return fmt.Sprintf("%v", v)
	}
}

func boolClaim(claims jwt.MapClaims, key string) bool {
	val, ok := claims[key]
	if !ok {
		return false
	}
	switch v := val.(type) {
	case bool:
		return v
	case string:
		return strings.EqualFold(v, "true")
	default:
		return false
	}
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func anyStringMatch(left, right []string) bool {
	for _, lv := range left {
		for _, rv := range right {
			if lv == rv {
				return true
			}
		}
	}
	return false
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
