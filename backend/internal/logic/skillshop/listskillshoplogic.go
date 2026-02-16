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
	catalog, err := skillshop.LoadCatalog()
	if err != nil {
		return nil, err
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

	filtered := make([]skillshop.Item, 0, len(catalog.Items))
	for _, it := range catalog.Items {
		if isFeaturedFilter {
			if _, ok := skillshop.FeaturedRank(it.Slug); !ok {
				continue
			}
		} else {
			if category != "" && category != "all" && !strings.EqualFold(it.Category, category) {
				continue
			}
		}
		if q != "" {
			hay := strings.ToLower(it.Slug + " " + it.Name + " " + it.Description + " " + it.Category)
			if !strings.Contains(hay, q) {
				continue
			}
		}
		filtered = append(filtered, it)
	}

	// "App store" ordering: featured first (by curated rank), then catalog order.
	sort.SliceStable(filtered, func(i, j int) bool {
		ri, fi := skillshop.FeaturedRank(filtered[i].Slug)
		rj, fj := skillshop.FeaturedRank(filtered[j].Slug)
		if fi && fj {
			return ri < rj
		}
		if fi != fj {
			return fi
		}
		return false
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
		u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
		if err != nil {
			return nil, err
		}
		names, err := l.svcCtx.DB.AgentSkill.Query().
			Where(
				agentskill.OwnerUserID(u.ID),
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

	items := make([]types.SkillShopItemResp, 0, end-start)
	for _, it := range filtered[start:end] {
		rank, featured := skillshop.FeaturedRank(it.Slug)
		items = append(items, types.SkillShopItemResp{
			Slug:         it.Slug,
			Name:         it.Name,
			Description:  it.Description,
			Category:     it.Category,
			Url:          it.URL,
			Bundled:      it.Bundled,
			Installed:    installedSet[strings.ToLower(it.Slug)],
			Featured:     featured,
			FeaturedRank: rank,
		})
	}

	featuredCount := int64(0)
	for _, slug := range skillshop.FeaturedSlugs() {
		if _, ok := catalog.GetBySlug(slug); ok {
			featuredCount++
		}
	}

	cats := make([]types.SkillShopCategoryResp, 0, len(catalog.Categories)+1)
	cats = append(cats, types.SkillShopCategoryResp{Key: "Featured", Count: featuredCount})
	for _, c := range catalog.Categories {
		cats = append(cats, types.SkillShopCategoryResp{Key: c.Key, Count: c.Count})
	}

	return &types.SkillShopListResp{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		HasMore:    int64(end) < total,
		Categories: cats,
	}, nil
}
