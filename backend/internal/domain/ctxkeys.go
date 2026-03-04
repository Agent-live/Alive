package domain

// contextKey is a typed context key to avoid collisions with plain-string keys.
type contextKey struct{ name string }

// CtxKeyUID is the context key used by go-zero JWT middleware for user identity.
// go-zero stores JWT claims as string-keyed context values; our JWT uses "uid".
//
// NOTE: go-zero uses plain string keys (not typed), so we keep the raw string
// constant for compatibility with the go-zero JWT middleware. Use CtxKeyUIDRaw
// when reading from go-zero JWT context, and CtxKeyUID for typed context usage.
var CtxKeyUID = &contextKey{"uid"}

// CtxKeyUIDRaw is the plain string key that go-zero JWT middleware actually uses.
// Use this with ctx.Value() when reading JWT claims set by go-zero.
const CtxKeyUIDRaw = "uid"
