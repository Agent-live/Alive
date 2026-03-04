package timer

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/timertransaction"
	"backend/internal/domain"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetTimerTransactionsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTimerTransactionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTimerTransactionsLogic {
	return &GetTimerTransactionsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTimerTransactionsLogic) GetTimerTransactions(req *types.ListReq) (resp *types.TimerTxListResp, err error) {
	page, pageSize, offset := domain.NormalizePage(req.Page, req.PageSize)

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	ownedAgents, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}
	ownedAgentIDs := make([]uuid.UUID, 0, len(ownedAgents))
	for _, item := range ownedAgents {
		if item == nil {
			continue
		}
		ownedAgentIDs = append(ownedAgentIDs, item.ID)
	}

	query := l.svcCtx.DB.TimerTransaction.Query()
	if len(ownedAgentIDs) > 0 {
		query = query.Where(
			timertransaction.Or(
				timertransaction.AgentIDIn(ownedAgentIDs...),
				timertransaction.And(
					timertransaction.SourceType("human"),
					timertransaction.SourceID(u.ID.String()),
				),
			),
		)
	} else {
		query = query.Where(
			timertransaction.And(
				timertransaction.SourceType("human"),
				timertransaction.SourceID(u.ID.String()),
			),
		)
	}

	total, err := query.Clone().Count(l.ctx)
	if err != nil {
		return nil, err
	}

	txs, err := query.
		Order(ent.Desc(timertransaction.FieldCreatedAt)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	aIDs := make([]uuid.UUID, 0, len(txs))
	for _, tx := range txs {
		aIDs = append(aIDs, tx.AgentID)
	}
	aMap := map[uuid.UUID]*ent.Agent{}
	if len(aIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().Where(agent.IDIn(aIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, a := range agents {
			aMap[a.ID] = a
		}
	}

	items := make([]types.TimerTransactionResp, 0, len(txs))
	for _, tx := range txs {
		items = append(items, mapper.ToTxResp(tx, aMap[tx.AgentID]))
	}

	return &types.TimerTxListResp{
		Items: items,
		Pagination: types.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  domain.HasMore(int64(total), page, pageSize),
		},
	}, nil
}
