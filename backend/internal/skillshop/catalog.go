package skillshop

import (
	"encoding/json"
	"fmt"
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
	bundledCatalogOnce sync.Once
	bundledCatalogInst *Catalog
	bundledCatalogErr  error
)

// LoadBundledCatalog loads only the embedded catalog.json without scanning local skills.
// Use this when startup code needs a stable slug lookup without paying local FS scan cost.
func LoadBundledCatalog() (*Catalog, error) {
	bundledCatalogOnce.Do(func() {
		base := &Catalog{}
		if err := json.Unmarshal(catalogJSON, base); err != nil {
			bundledCatalogErr = fmt.Errorf("skillshop: load catalog: %w", err)
			return
		}
		buildCatalogIndex(base)
		bundledCatalogInst = base
	})
	return bundledCatalogInst, bundledCatalogErr
}

func buildCatalogIndex(c *Catalog) {
	if c == nil {
		return
	}
	c.bySlug = make(map[string]*Item, len(c.Items))
	for i := range c.Items {
		it := &c.Items[i]
		key := strings.ToLower(strings.TrimSpace(it.Slug))
		if key == "" {
			continue
		}
		// First wins.
		if _, exists := c.bySlug[key]; !exists {
			c.bySlug[key] = it
		}
	}
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
