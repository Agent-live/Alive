package types

// Skill shop: OpenClaw community skill catalog endpoints.

type SkillShopListReq struct {
	Q                string `form:"q,optional"`
	Category         string `form:"category,optional"`
	Page             int64  `form:"page,optional"`
	PageSize         int64  `form:"pageSize,optional"`
	IncludeInstalled bool   `form:"includeInstalled,optional"`
}

type SkillShopCategoryResp struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
}

type SkillShopItemResp struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Url         string `json:"url"`
	Bundled     bool   `json:"bundled"`

	Installed bool `json:"installed,optional"`

	Featured     bool  `json:"featured,optional"`
	FeaturedRank int64 `json:"featuredRank,optional"`
}

type SkillShopListResp struct {
	Items      []SkillShopItemResp     `json:"items"`
	Total      int64                   `json:"total"`
	Page       int64                   `json:"page"`
	PageSize   int64                   `json:"pageSize"`
	HasMore    bool                    `json:"hasMore"`
	Categories []SkillShopCategoryResp `json:"categories"`
}

type SkillShopGetReq struct {
	Slug          string `path:"slug"`
	IncludeReadme bool   `form:"includeReadme,optional"`
}

type SkillShopDetailResp struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Url         string `json:"url"`
	Bundled     bool   `json:"bundled"`

	Installed bool   `json:"installed,optional"`
	Readme    string `json:"readme,optional"`

	Featured     bool  `json:"featured,optional"`
	FeaturedRank int64 `json:"featuredRank,optional"`
}

type SkillShopInstallReq struct {
	Slug    string `path:"slug"`
	AgentId string `json:"agentId,optional"`
}

type SkillShopInstallResp struct {
	Template SkillResp  `json:"template"`
	Active   *SkillResp `json:"active,optional"`
}
