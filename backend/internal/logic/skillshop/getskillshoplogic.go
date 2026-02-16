package skillshop

import (
	"context"
	"errors"
	"strings"

	"backend/ent/agentskill"
	"backend/internal/logic/common"
	"backend/internal/skillshop"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSkillShopLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSkillShopLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSkillShopLogic {
	return &GetSkillShopLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSkillShopLogic) GetSkillShop(req *types.SkillShopGetReq) (*types.SkillShopDetailResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		return nil, errors.New("slug is required")
	}

	catalog, err := skillshop.LoadCatalog()
	if err != nil {
		return nil, err
	}
	it, ok := catalog.GetBySlug(slug)
	if !ok {
		return nil, errors.New("skill not found")
	}

	var installed bool
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	// Best-effort: consider "installed" if user has any non-deleted skill with the same name.
	count, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(u.ID),
			agentskill.DeletedAtIsNil(),
			agentskill.NameEQ(it.Slug),
		).
		Count(l.ctx)
	if err == nil && count > 0 {
		installed = true
	}

	out := &types.SkillShopDetailResp{
		Slug:        it.Slug,
		Name:        it.Name,
		Description: it.Description,
		Category:    it.Category,
		Url:         it.URL,
		Bundled:     it.Bundled,
		Installed:   installed,
	}
	if rank, ok := skillshop.FeaturedRank(it.Slug); ok {
		out.Featured = true
		out.FeaturedRank = rank
	}

	if req.IncludeReadme {
		md, err := skillshop.FetchSkillMarkdown(l.ctx, it)
		if err != nil {
			return nil, err
		}
		out.Readme = skillshop.StripFrontmatter(md)
	}

	return out, nil
}
