package skillshop

import "strings"

// Featured skills are the most meaningful/attractive skills we want to highlight in UI and
// seed into the backend DB for fast/offline installs.
//
// These slugs must exist in catalog.json.
var featuredSlugs = []string{
	"github",
	"docker-essentials",
	"docker-sandbox",
	"backend-patterns",
	"debug-pro",
	"regex-patterns",
	"executing-plans",
	"receiving-code-review",
	"claude-optimised",
	"agent-config",
	"agentlens",
	"mcp-builder",
	"browse",
	"coder-workspaces",
	"cursor-agent",
	"coding-agent",
	"buildlog",
	"session-logs",
	"file-links-tool",
	"doc-coauthoring",
	"microsoft-docs",
	"create-agent-skills",
	"trello",
	"notion",
	"slack",
	"discord",
}

var featuredRank = func() map[string]int64 {
	m := make(map[string]int64, len(featuredSlugs))
	for i, s := range featuredSlugs {
		key := strings.ToLower(strings.TrimSpace(s))
		if key == "" {
			continue
		}
		// 1-based rank for nicer UX.
		m[key] = int64(i + 1)
	}
	return m
}()

// FeaturedSlugs returns the ordered list of featured skill slugs.
func FeaturedSlugs() []string {
	out := make([]string, 0, len(featuredSlugs))
	out = append(out, featuredSlugs...)
	return out
}

// FeaturedRank returns (rank,true) if the skill is featured; rank is 1-based.
func FeaturedRank(slug string) (int64, bool) {
	key := strings.ToLower(strings.TrimSpace(slug))
	if key == "" {
		return 0, false
	}
	r, ok := featuredRank[key]
	return r, ok
}
