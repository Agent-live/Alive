package skillshop

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
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

	featuredOwnerID, ok, err := featuredSkillShopUserID(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("skill not found")
	}

	row, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(featuredOwnerID),
			agentskill.StatusEQ("lesson"),
			agentskill.DeletedAtIsNil(),
			agentskill.NameEQ(slug),
		).
		First(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.New("skill not found")
		}
		return nil, err
	}

	name := slug
	description := strings.TrimSpace(row.Description)
	category := strings.TrimSpace(row.Category)
	if category == "" {
		category = "other"
	}
	url := ""
	bundledFlag := false
	if catalog, err := skillshop.LoadBundledCatalog(); err == nil && catalog != nil {
		if meta, found := catalog.GetBySlug(slug); found {
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

	installed := false
	if uid, ok := common.UserIDFromContext(l.ctx); ok {
		// Best-effort: consider "installed" if user has any non-deleted skill with the same name.
		count, err := l.svcCtx.DB.AgentSkill.Query().
			Where(
				agentskill.OwnerUserID(uid),
				agentskill.DeletedAtIsNil(),
				agentskill.NameEQ(slug),
			).
			Count(l.ctx)
		if err != nil {
			return nil, err
		}
		installed = count > 0
	}

	out := &types.SkillShopDetailResp{
		Slug:        slug,
		Name:        name,
		Description: description,
		Category:    category,
		Url:         url,
		Bundled:     bundledFlag,
		Installed:   installed,
	}
	if rank, ok := skillshop.FeaturedRank(slug); ok {
		out.Featured = true
		out.FeaturedRank = rank
	}

	if req.IncludeReadme {
		out.Readme = strings.TrimSpace(row.Instructions)
	}

	return out, nil
}
