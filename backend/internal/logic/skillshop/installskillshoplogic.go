package skillshop

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/ent/user"
	"backend/internal/logic/common"
	skilllogic "backend/internal/logic/skill"
	"backend/internal/skillshop"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type InstallSkillShopLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewInstallSkillShopLogic(ctx context.Context, svcCtx *svc.ServiceContext) *InstallSkillShopLogic {
	return &InstallSkillShopLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

const skillShopFeaturedUserEmail = "skillshop@alive.local"

func (l *InstallSkillShopLogic) InstallSkillShop(req *types.SkillShopInstallReq) (*types.SkillShopInstallResp, error) {
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
	item, ok := catalog.GetBySlug(slug)
	if !ok {
		return nil, errors.New("skill not found")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Find or create a lesson template skill for this catalog entry.
	template, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(u.ID),
			agentskill.DeletedAtIsNil(),
			agentskill.NameEQ(item.Slug),
			agentskill.StatusEQ("lesson"),
		).
		First(l.ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	if template == nil {
		// Prefer DB-backed featured templates when available (no network, deterministic content).
		instructions := ""
		if _, ok := skillshop.FeaturedRank(item.Slug); ok {
			sysUser, err := l.svcCtx.DB.User.Query().Where(user.EmailEQ(skillShopFeaturedUserEmail)).Only(l.ctx)
			if err != nil && !ent.IsNotFound(err) {
				return nil, err
			}
			if sysUser != nil {
				sysSkill, err := l.svcCtx.DB.AgentSkill.Query().
					Where(
						agentskill.OwnerUserID(sysUser.ID),
						agentskill.DeletedAtIsNil(),
						agentskill.StatusEQ("lesson"),
						agentskill.NameEQ(item.Slug),
					).
					First(l.ctx)
				if err != nil && !ent.IsNotFound(err) {
					return nil, err
				}
				if sysSkill != nil {
					instructions = strings.TrimSpace(sysSkill.Instructions)
				}
			}
		}

		if instructions == "" {
			md, err := skillshop.FetchSkillMarkdown(l.ctx, item)
			if err != nil {
				return nil, err
			}
			instructions = skillshop.StripFrontmatter(md)
			if instructions == "" {
				return nil, errors.New("skill content is empty")
			}
		}

		template, err = l.svcCtx.DB.AgentSkill.Create().
			SetOwnerUserID(u.ID).
			SetName(item.Slug).
			SetDescription(strings.TrimSpace(item.Description)).
			SetInstructions(instructions).
			SetStatus("lesson").
			SetCategory(skillshop.MapShopCategoryToInternal(item.Category)).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	templateResp := common.ToSkillResp(template, nil)
	out := &types.SkillShopInstallResp{Template: templateResp}

	agentID := strings.TrimSpace(req.AgentId)
	if agentID != "" {
		teachOut, err := skilllogic.NewTeachSkillLogic(l.ctx, l.svcCtx).TeachSkill(&types.SkillTeachReq{
			Id:      template.ID.String(),
			AgentId: agentID,
		})
		if err != nil {
			return nil, err
		}
		out.Active = teachOut
	}

	return out, nil
}
