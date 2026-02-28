package skillshop

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
	"sync"

	_ "embed"
)

type Category struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
}

type Item struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	URL         string `json:"url"`
	RepoPath    string `json:"repoPath"`
	Bundled     bool   `json:"bundled"`
}

type Catalog struct {
	GeneratedAt string     `json:"generatedAt"`
	Categories  []Category `json:"categories"`
	Items       []Item     `json:"items"`

	bySlug map[string]*Item `json:"-"`
}

//go:embed catalog.json
var catalogJSON []byte

var (
	catalogOnce sync.Once
	catalogInst *Catalog
	catalogErr  error
)

func LoadCatalog() (*Catalog, error) {
	catalogOnce.Do(func() {
		base := &Catalog{}
		if err := json.Unmarshal(catalogJSON, base); err != nil {
			catalogErr = fmt.Errorf("skillshop: load catalog: %w", err)
			return
		}

		// If a local checkout of alive-agent/skills exists, merge it in so the skill shop can
		// truly list "all skills" offline. The embedded catalog remains the fallback and also
		// provides better categories for slugs it already knows about.
		merged := base
		if root := LocalRepoRoot(); root != "" {
			// Prefer the local checkout as source-of-truth for existence. If an embedded entry no
			// longer exists on disk, drop it so the UI doesn't show dead skills.
			filtered := make([]Item, 0, len(base.Items))
			for _, it := range base.Items {
				rp := strings.TrimSpace(it.RepoPath)
				if rp == "" {
					continue
				}
				full, ok := safeJoin(root, rp)
				if ok {
					if _, err := os.Stat(full); err == nil {
						filtered = append(filtered, it)
						continue
					}
				}
				// Case-insensitive FS: some repos have both SKILL.md and skill.md. Accept either.
				if strings.HasSuffix(rp, "/SKILL.md") {
					alt := strings.TrimSuffix(rp, "/SKILL.md") + "/skill.md"
					if full, ok := safeJoin(root, alt); ok {
						if _, err := os.Stat(full); err == nil {
							it.RepoPath = alt
							filtered = append(filtered, it)
							continue
						}
					}
				}
			}
			base.Items = filtered

			skip := make(map[string]bool, len(base.Items))
			for _, it := range base.Items {
				key := strings.ToLower(strings.TrimSpace(it.Slug))
				if key == "" {
					continue
				}
				skip[key] = true
			}
			if localItems, err := scanLocalSkills(root, skip); err == nil && len(localItems) > 0 {
				merged = mergeCatalog(base, localItems)
			}
		}

		merged.bySlug = make(map[string]*Item, len(merged.Items))
		for i := range merged.Items {
			it := &merged.Items[i]
			key := strings.ToLower(strings.TrimSpace(it.Slug))
			if key == "" {
				continue
			}
			// First wins.
			if _, exists := merged.bySlug[key]; !exists {
				merged.bySlug[key] = it
			}
		}

		catalogInst = merged
	})
	return catalogInst, catalogErr
}

func mergeCatalog(base *Catalog, localItems []Item) *Catalog {
	out := &Catalog{
		GeneratedAt: base.GeneratedAt,
	}

	seen := make(map[string]bool, len(base.Items)+len(localItems))
	items := make([]Item, 0, len(base.Items)+len(localItems))

	add := func(it Item) {
		key := strings.ToLower(strings.TrimSpace(it.Slug))
		if key == "" {
			return
		}
		if seen[key] {
			return
		}
		seen[key] = true
		items = append(items, it)
	}

	for _, it := range base.Items {
		add(it)
	}
	for _, it := range localItems {
		add(it)
	}

	out.Items = items
	out.Categories = computeCategories(items)
	return out
}

func computeCategories(items []Item) []Category {
	counts := make(map[string]int64, 32)
	for _, it := range items {
		key := strings.TrimSpace(it.Category)
		if key == "" {
			key = "Other"
		}
		counts[key]++
	}
	cats := make([]Category, 0, len(counts))
	for k, v := range counts {
		cats = append(cats, Category{Key: k, Count: v})
	}
	sort.Slice(cats, func(i, j int) bool {
		if cats[i].Count != cats[j].Count {
			return cats[i].Count > cats[j].Count
		}
		return cats[i].Key < cats[j].Key
	})
	return cats
}

func (c *Catalog) GetBySlug(slug string) (*Item, bool) {
	if c == nil {
		return nil, false
	}
	key := strings.ToLower(strings.TrimSpace(slug))
	if key == "" {
		return nil, false
	}
	it, ok := c.bySlug[key]
	return it, ok
}
