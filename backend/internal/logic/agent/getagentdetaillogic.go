package agent

import (
	"context"
	"strings"

	"backend/ent/channelconnection"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAgentDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAgentDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAgentDetailLogic {
	return &GetAgentDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAgentDetailLogic) GetAgentDetail(req *types.AgentIdReq) (resp *types.AgentResp, err error) {
	agentID, err := parseUUID(req.Id)
	if err != nil {
		return nil, err
	}
	a, err := l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	if err != nil {
		return nil, err
	}
	u, err := l.svcCtx.DB.User.Get(l.ctx, a.CreatorID)
	if err != nil {
		return nil, err
	}
	channels, err := l.svcCtx.DB.ChannelConnection.Query().Where(channelconnection.AgentID(a.ID)).All(l.ctx)
	if err != nil {
		return nil, err
	}
	out := common.ToAgentResp(a, u.Nickname, channels)
	runtimeAgentID := strings.TrimSpace(common.PtrString(a.AliveAgentRuntimeID))
	if runtimeAgentID == "" {
		runtimeAgentID = a.ID.String()
	}
	aliveSkills, skillErr := l.svcCtx.AliveAgent.ListAgentSkills(l.ctx, runtimeAgentID, false)
	if skillErr != nil {
		l.Errorf(
			"get agent detail: list aliveagent skills failed agent_id=%s runtime_id=%s err=%v",
			a.ID.String(),
			runtimeAgentID,
			skillErr,
		)
		out.Skills = []types.AgentLearnedSkillResp{}
		return &out, nil
	}
	out.Skills = make([]types.AgentLearnedSkillResp, 0, len(aliveSkills))
	for _, skill := range aliveSkills {
		out.Skills = append(out.Skills, types.AgentLearnedSkillResp{
			AgentId:                skill.AgentID,
			Key:                    skill.Key,
			Name:                   skill.Name,
			Description:            skill.Description,
			Tags:                   skill.Tags,
			Enabled:                skill.Enabled,
			Kind:                   skill.Kind,
			Source:                 skill.Source,
			RunCount:               skill.RunCount,
			SuccessCount:           skill.SuccessCount,
			FailureCount:           skill.FailureCount,
			AvgElapsedMs:           skill.AvgElapsedMs,
			LastError:              skill.LastError,
			CreatedAt:              skill.CreatedAt,
			UpdatedAt:              skill.UpdatedAt,
			FilePath:               skill.FilePath,
			InstructionMarkdown:    skill.InstructionMarkdown,
			DisableModelInvocation: skill.DisableModelInvocation,
		})
	}
	return &out, nil
}
