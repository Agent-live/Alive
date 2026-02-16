package feed

import (
	"context"

	"backend/ent"
	"backend/ent/reply"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPostRepliesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetPostRepliesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPostRepliesLogic {
	return &GetPostRepliesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPostRepliesLogic) GetPostReplies(req *types.PostIdReq) (resp *types.ReplyListResp, err error) {
	postID, err := parsePostUUID(req.Id)
	if err != nil {
		return nil, err
	}
	page, pageSize, offset := common.NormalizePage(req.Page, req.PageSize)

	total, err := l.svcCtx.DB.Reply.Query().Where(reply.PostID(postID)).Count(l.ctx)
	if err != nil {
		return nil, err
	}

	replies, err := l.svcCtx.DB.Reply.Query().
		Where(reply.PostID(postID)).
		Order(ent.Asc(reply.FieldCreatedAt)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]types.ReplyResp, 0, len(replies))
	for _, r := range replies {
		items = append(items, common.ToReplyResp(r))
	}

	return &types.ReplyListResp{
		Items: items,
		Pagination: types.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  common.HasMore(int64(total), page, pageSize),
		},
	}, nil
}
