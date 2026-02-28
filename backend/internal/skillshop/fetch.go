package skillshop

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

var httpClient = &http.Client{Timeout: 12 * time.Second}

func FetchSkillMarkdown(ctx context.Context, item *Item) (string, error) {
	if item == nil {
		return "", fmt.Errorf("skillshop: item is required")
	}

	// Prefer local checkout when available (faster + avoids GitHub rate limiting).
	if md, ok := fetchLocalMarkdown(item); ok {
		return md, nil
	}

	rawURL := resolveRawURL(item)
	if rawURL == "" {
		return "", fmt.Errorf("skillshop: cannot resolve raw url for %q", item.Slug)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "text/plain; charset=utf-8")
	req.Header.Set("User-Agent", "alive-skillshop/1.0")

	res, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		trimmed := strings.TrimSpace(string(body))
		if len(trimmed) > 400 {
			trimmed = trimmed[:400] + "…"
		}
		return "", fmt.Errorf("skillshop: fetch %q failed: status=%d body=%s", item.Slug, res.StatusCode, trimmed)
	}
	return string(body), nil
}

func fetchLocalMarkdown(item *Item) (string, bool) {
	root := LocalRepoRoot()
	if root == "" {
		return "", false
	}
	repoPath := strings.TrimSpace(item.RepoPath)
	if repoPath == "" {
		return "", false
	}
	full, ok := safeJoin(root, repoPath)
	if !ok {
		return "", false
	}
	b, err := os.ReadFile(full)
	if err != nil {
		return "", false
	}
	return string(b), true
}

func resolveRawURL(item *Item) string {
	// Prefer repoPath if present (more stable than pattern matching on URL).
	repoPath := strings.TrimSpace(item.RepoPath)
	if repoPath != "" {
		repoPath = strings.TrimPrefix(repoPath, "/")
		return "https://raw.githubusercontent.com/alive-agent/skills/main/" + repoPath
	}

	u := strings.TrimSpace(item.URL)
	needle := "https://github.com/alive-agent/skills/tree/main/"
	if strings.HasPrefix(u, needle) {
		return "https://raw.githubusercontent.com/alive-agent/skills/main/" + strings.TrimPrefix(u, needle)
	}
	return ""
}

func StripFrontmatter(md string) string {
	s := strings.TrimLeft(md, "\ufeff")
	lines := strings.Split(s, "\n")
	if len(lines) < 2 || strings.TrimSpace(lines[0]) != "---" {
		return strings.TrimSpace(s)
	}
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == "---" {
			return strings.TrimSpace(strings.Join(lines[i+1:], "\n"))
		}
	}
	return strings.TrimSpace(s)
}
