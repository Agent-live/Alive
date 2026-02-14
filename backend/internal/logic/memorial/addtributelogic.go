package memorial

import (
	"context"
	"errors"
	"strings"

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

	row, err := l.svcCtx.DB.Tribute.Create().
		SetMemorialID(memorialID).
		SetAuthorName(u.Nickname).
		SetMessage(message).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	out := common.ToTributeResp(row)
	return &out, nil
}
