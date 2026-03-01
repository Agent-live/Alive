package memorial

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/aliveagent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type AddTributeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAddTributeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AddTributeLogic {
	return &AddTributeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AddTributeLogic) AddTribute(req *types.TributeReq) (resp *types.TributeResp, err error) {
	memorialID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, err
	}
	message := strings.TrimSpace(req.Message)
	if message == "" {
		return nil, errors.New("message is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	memorialRow, _ := l.svcCtx.DB.Memorial.Get(l.ctx, memorialID)

	row, err := l.svcCtx.DB.Tribute.Create().
		SetMemorialID(memorialID).
		SetAuthorName(u.Nickname).
		SetMessage(message).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	if memorialRow != nil && l.svcCtx.AliveAgent != nil {
		if target, getErr := l.svcCtx.DB.Agent.Get(l.ctx, memorialRow.AgentID); getErr == nil {
			runtimeAgentID := strings.TrimSpace(common.PtrString(target.AliveAgentRuntimeID))
			if runtimeAgentID != "" {
				_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
					RuntimeAgentID: runtimeAgentID,
					AgentID:        target.ID.String(),
					EventType:      "memorial.tribute_received",
					Title:          "ALIVE Memorial Tribute",
					Message:        fmt.Sprintf("A new tribute was left for %s", memorialRow.AgentName),
					DedupeKey:      aliveagent.BuildDedupeKey(target.ID.String(), "memorial.tribute_received", memorialID.String(), row.ID.String()),
					Payload: map[string]any{
						"memorialId": memorialID.String(),
						"tributeId":  row.ID.String(),
						"agentId":    target.ID.String(),
						"agentName":  memorialRow.AgentName,
						"authorName": row.AuthorName,
						"message":    row.Message,
					},
					TimeoutSeconds: 120,
				})
			}
		}
	}

	out := common.ToTributeResp(row)
	return &out, nil
}
