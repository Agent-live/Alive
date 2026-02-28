package skillshop

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/internal/logic/common"
	skilllogic "backend/internal/logic/skill"
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

func (l *InstallSkillShopLogic) InstallSkillShop(req *types.SkillShopInstallReq) (*types.SkillShopInstallResp, error) {
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

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Find or create a lesson template skill for this catalog entry.
	template, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(u.ID),
			agentskill.DeletedAtIsNil(),
			agentskill.NameEQ(slug),
			agentskill.StatusEQ("lesson"),
		).
		First(l.ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	if template == nil {
		sourceTemplate, err := l.svcCtx.DB.AgentSkill.Query().
			Where(
				agentskill.OwnerUserID(featuredOwnerID),
				agentskill.DeletedAtIsNil(),
				agentskill.StatusEQ("lesson"),
				agentskill.NameEQ(slug),
			).
			First(l.ctx)
		if err != nil {
			if ent.IsNotFound(err) {
				return nil, errors.New("skill template not found in database")
			}
			return nil, err
		}
		if strings.TrimSpace(sourceTemplate.Instructions) == "" {
			return nil, errors.New("skill content is empty")
		}

		template, err = l.svcCtx.DB.AgentSkill.Create().
			SetOwnerUserID(u.ID).
			SetName(sourceTemplate.Name).
			SetDescription(sourceTemplate.Description).
			SetInstructions(sourceTemplate.Instructions).
			SetStatus("lesson").
			SetCategory(sourceTemplate.Category).
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
