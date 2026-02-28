package skillshop

import (
	"context"
	"errors"
	"sort"
	"strings"

	"backend/ent/agentskill"
	"backend/internal/logic/common"
	"backend/internal/skillshop"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSkillShopLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSkillShopLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSkillShopLogic {
	return &ListSkillShopLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSkillShopLogic) ListSkillShop(req *types.SkillShopListReq) (*types.SkillShopListResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}

	q := strings.ToLower(strings.TrimSpace(req.Q))
	category := strings.TrimSpace(req.Category)
	isFeaturedFilter := strings.EqualFold(category, "featured")

	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 60
	}
	if pageSize > 200 {
		pageSize = 200
	}

	featuredOwnerID, ok, err := featuredSkillShopUserID(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}
	if !ok {
		return &types.SkillShopListResp{
			Items:      []types.SkillShopItemResp{},
			Total:      0,
			Page:       page,
			PageSize:   pageSize,
			HasMore:    false,
			Categories: []types.SkillShopCategoryResp{{Key: "Featured", Count: 0}},
		}, nil
	}

	rows, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(featuredOwnerID),
			agentskill.StatusEQ("lesson"),
			agentskill.DeletedAtIsNil(),
		).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	// Bundled catalog is only for optional display metadata enrichment (name/url/bundled flag).
	bundled, _ := skillshop.LoadBundledCatalog()

	type record struct {
		slug        string
		name        string
		description string
		category    string
		url         string
		bundled     bool
	}

	all := make([]record, 0, len(rows))
	for _, row := range rows {
		slug := strings.TrimSpace(row.Name)
		if slug == "" {
			continue
		}

		name := slug
		description := strings.TrimSpace(row.Description)
		itemCategory := strings.TrimSpace(row.Category)
		if itemCategory == "" {
			itemCategory = "other"
		}
		url := ""
		bundledFlag := false

		if bundled != nil {
			if meta, found := bundled.GetBySlug(slug); found {
				if strings.TrimSpace(meta.Name) != "" {
					name = strings.TrimSpace(meta.Name)
				}
				if description == "" {
					description = strings.TrimSpace(meta.Description)
				}
				if strings.TrimSpace(meta.URL) != "" {
					url = strings.TrimSpace(meta.URL)
				}
				bundledFlag = meta.Bundled
			}
		}

		all = append(all, record{
			slug:        slug,
			name:        name,
			description: description,
			category:    itemCategory,
			url:         url,
			bundled:     bundledFlag,
		})
	}

	filtered := make([]record, 0, len(all))
	for _, it := range all {
		if isFeaturedFilter {
			if _, ok := skillshop.FeaturedRank(it.slug); !ok {
				continue
			}
		} else {
			if category != "" && category != "all" && !strings.EqualFold(it.category, category) {
				continue
			}
		}
		if q != "" {
			hay := strings.ToLower(it.slug + " " + it.name + " " + it.description + " " + it.category)
			if !strings.Contains(hay, q) {
				continue
			}
		}
		filtered = append(filtered, it)
	}

	// "App store" ordering: featured first (by curated rank), then catalog order.
	sort.SliceStable(filtered, func(i, j int) bool {
		ri, fi := skillshop.FeaturedRank(filtered[i].slug)
		rj, fj := skillshop.FeaturedRank(filtered[j].slug)
		if fi && fj {
			return ri < rj
		}
		if fi != fj {
			return fi
		}
		return strings.ToLower(filtered[i].name) < strings.ToLower(filtered[j].name)
	})

	total := int64(len(filtered))
	start := int((page - 1) * pageSize)
	end := start + int(pageSize)
	if start > len(filtered) {
		start = len(filtered)
	}
	if end > len(filtered) {
		end = len(filtered)
	}

	installedSet := map[string]bool{}
	if req.IncludeInstalled {
		if uid, ok := common.UserIDFromContext(l.ctx); ok {
			names, err := l.svcCtx.DB.AgentSkill.Query().
				Where(
					agentskill.OwnerUserID(uid),
					agentskill.DeletedAtIsNil(),
				).
				Select(agentskill.FieldName).
				Strings(l.ctx)
			if err != nil {
				return nil, err
			}
			for _, n := range names {
				n = strings.ToLower(strings.TrimSpace(n))
				if n == "" {
					continue
				}
				installedSet[n] = true
			}
		}
	}

	items := make([]types.SkillShopItemResp, 0, end-start)
	for _, it := range filtered[start:end] {
		rank, featured := skillshop.FeaturedRank(it.slug)
		items = append(items, types.SkillShopItemResp{
			Slug:         it.slug,
			Name:         it.name,
			Description:  it.description,
			Category:     it.category,
			Url:          it.url,
			Bundled:      it.bundled,
			Installed:    installedSet[strings.ToLower(it.slug)],
			Featured:     featured,
			FeaturedRank: rank,
		})
	}

	catCounts := make(map[string]int64)
	featuredCount := int64(0)
	for _, it := range all {
		catCounts[it.category]++
		if _, ok := skillshop.FeaturedRank(it.slug); ok {
			featuredCount++
		}
	}

	cats := make([]types.SkillShopCategoryResp, 0, len(catCounts)+1)
	cats = append(cats, types.SkillShopCategoryResp{Key: "Featured", Count: featuredCount})
	for k, v := range catCounts {
		cats = append(cats, types.SkillShopCategoryResp{Key: k, Count: v})
	}
	sort.SliceStable(cats[1:], func(i, j int) bool {
		left := cats[i+1]
		right := cats[j+1]
		if left.Count != right.Count {
			return left.Count > right.Count
		}
		return strings.ToLower(left.Key) < strings.ToLower(right.Key)
	})

	return &types.SkillShopListResp{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		HasMore:    int64(end) < total,
		Categories: cats,
	}, nil
}
