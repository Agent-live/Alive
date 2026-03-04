package channel

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/channelconnection"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ConnectChannelLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewConnectChannelLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ConnectChannelLogic {
	return &ConnectChannelLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// PLACEHOLDER: All channel handles below are mock/demo implementations.
// Real integration requires OAuth flows per channel provider.
func (l *ConnectChannelLogic) ConnectChannel(req *types.ChannelReq) (resp *types.ChannelConnectResp, err error) {
	aid, err := uuid.Parse(req.AgentId)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}
	channelType := strings.ToLower(strings.TrimSpace(req.ChannelType))
	if channelType == "" {
		return nil, errors.New("channelType is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	a, err := l.svcCtx.DB.Agent.Get(l.ctx, aid)
	if err != nil {
		return nil, err
	}
	if a.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}

	handle := ""
	deepLink := ""
	qr := ""
	switch channelType {
	case "whatsapp":
		handle = "+10000000000"
		qr = "data:image/png;base64,MOCK_WHATSAPP_QR"
	case "telegram":
		handle = fmt.Sprintf("@%s_alive_bot", strings.ToLower(strings.ReplaceAll(a.Name, " ", "_")))
		deepLink = fmt.Sprintf("https://t.me/%s", strings.TrimPrefix(handle, "@"))
	case "discord":
		handle = "alive-bot"
		deepLink = "https://discord.gg/alive"
	case "email":
		handle = fmt.Sprintf("%s@alive.bot", strings.ToLower(strings.ReplaceAll(a.Name, " ", "")))
	case "webchat":
		deepLink = fmt.Sprintf("https://alive.bot/chat/%s", a.ID.String())
	case "line":
		handle = "@alive_bot"
		deepLink = "https://line.me/R/ti/p/@alive_bot"
	case "signal":
		handle = "+10000000000"
		qr = "data:image/png;base64,MOCK_SIGNAL_QR"
	case "wechat":
		handle = "alive_bot"
	case "twitter":
		handle = fmt.Sprintf("@%s_alive", strings.ToLower(strings.ReplaceAll(a.Name, " ", "")))
		deepLink = fmt.Sprintf("https://x.com/%s", strings.TrimPrefix(handle, "@"))
	default:
		return nil, errors.New("unsupported channel type")
	}

	existing, err := l.svcCtx.DB.ChannelConnection.Query().
		Where(channelconnection.AgentID(aid), channelconnection.ChannelType(channelType)).
		Only(l.ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return nil, err
		}
		create := l.svcCtx.DB.ChannelConnection.Create().
			SetAgentID(aid).
			SetChannelType(channelType).
			SetStatus(domain.ChannelStatusDemo).
			SetConnectedAt(time.Now())
		if handle != "" {
			create.SetHandle(handle)
		}
		if deepLink != "" {
			create.SetDeepLink(deepLink)
		}
		_, err = create.Save(l.ctx)
		if err != nil {
			return nil, err
		}
	} else {
		update := l.svcCtx.DB.ChannelConnection.UpdateOneID(existing.ID).
			SetStatus(domain.ChannelStatusDemo).
			SetConnectedAt(time.Now())
		if handle != "" {
			update.SetHandle(handle)
		}
		if deepLink != "" {
			update.SetDeepLink(deepLink)
		}
		if _, err = update.Save(l.ctx); err != nil {
			return nil, err
		}
	}

	return &types.ChannelConnectResp{
		Status:   domain.ChannelStatusDemo,
		IsDemo:   true,
		Handle:   handle,
		DeepLink: deepLink,
		QrCode:   qr,
	}, nil
}
