package conversation

import "backend/internal/types"

func mapConversationListResp(src *ConversationListResp) *types.ConversationListResp {
	if src == nil || len(src.Items) == 0 {
		return &types.ConversationListResp{Items: []types.ConversationResp{}}
	}

	items := make([]types.ConversationResp, 0, len(src.Items))
	for _, item := range src.Items {
		items = append(items, mapConversationResp(item))
	}
	return &types.ConversationListResp{Items: items}
}

func mapConversationResp(src ConversationResp) types.ConversationResp {
	return types.ConversationResp{
		Id:                 src.ID,
		Type:               src.Type,
		ChatType:           src.ChatType,
		Title:              src.Title,
		CreatorAgentId:     src.CreatorAgentID,
		ParticipantCount:   int64(src.ParticipantCount),
		MessageCount:       int64(src.MessageCount),
		UnreadCount:        int64(src.UnreadCount),
		LastMessagePreview: src.LastMessagePreview,
		LastMessageAt:      src.LastMessageAt,
		Status:             src.Status,
		Participants:       mapConversationParticipants(src.Participants),
		CreatedAt:          src.CreatedAt,
	}
}

func mapConversationParticipants(in []ConversationParticipant) []types.ConversationParticipantResp {
	if len(in) == 0 {
		return nil
	}
	out := make([]types.ConversationParticipantResp, 0, len(in))
	for _, p := range in {
		out = append(out, types.ConversationParticipantResp{
			AgentId:     p.AgentID,
			AgentName:   p.AgentName,
			AgentAvatar: p.AgentAvatar,
			Role:        p.Role,
		})
	}
	return out
}

func mapMessageListResp(src *MessageListResp) *types.ConversationMessageListResp {
	if src == nil || len(src.Items) == 0 {
		return &types.ConversationMessageListResp{
			Items:   []types.ConversationMessageResp{},
			HasMore: src != nil && src.HasMore,
		}
	}

	items := make([]types.ConversationMessageResp, 0, len(src.Items))
	for _, msg := range src.Items {
		items = append(items, types.ConversationMessageResp{
			Id:              msg.ID,
			ConversationId:  msg.ConversationID,
			SenderAgentId:   msg.SenderAgentID,
			SenderAgentName: msg.SenderAgentName,
			SenderAvatar:    msg.SenderAvatar,
			Content:         msg.Content,
			Attachments:     mapMessageAttachments(msg.Attachments),
			MessageType:     msg.MessageType,
			InteractionType: msg.InteractionType,
			CreatedAt:       msg.CreatedAt,
		})
	}

	return &types.ConversationMessageListResp{
		Items:   items,
		HasMore: src.HasMore,
	}
}

func mapMessageAttachments(in []MessageAttachment) []types.ConversationAttachmentResp {
	if len(in) == 0 {
		return nil
	}
	out := make([]types.ConversationAttachmentResp, 0, len(in))
	for _, a := range in {
		out = append(out, types.ConversationAttachmentResp{
			MediaId:      a.MediaID,
			MimeType:     a.MimeType,
			Url:          a.URL,
			ThumbnailUrl: a.ThumbnailURL,
			FileSize:     a.FileSize,
		})
	}
	return out
}
