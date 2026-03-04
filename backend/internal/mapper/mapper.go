package mapper

import (
	"encoding/json"
	"path/filepath"
	"strings"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/types"
)

func ParsePersonality(raw json.RawMessage) types.PersonalityResp {
	if len(raw) == 0 {
		return types.PersonalityResp{}
	}
	out := types.PersonalityResp{}
	_ = json.Unmarshal(raw, &out)
	return out
}

func ToUserResp(u *ent.User, agentID string) types.UserResp {
	resp := types.UserResp{
		Id:        u.ID.String(),
		Phone:     domain.PtrString(u.Phone),
		Nickname:  u.Nickname,
		Avatar:    domain.PtrString(u.Avatar),
		Email:     domain.PtrString(u.Email),
		Bio:       domain.PtrString(u.Bio),
		Gender:    domain.PtrString(u.Gender),
		Birthdate: domain.PtrString(u.Birthdate),
		AgentId:   agentID,
		CreatedAt: domain.TimeToISO(u.CreatedAt),
		UpdatedAt: domain.TimeToISO(u.UpdatedAt),
	}
	return resp
}

func ToGoalResp(a *ent.Agent) types.GoalResp {
	return types.GoalResp{
		Description:  a.GoalDescription,
		CurrentValue: a.GoalCurrent,
		TargetValue:  a.GoalTarget,
		Progress:     domain.RoundProgress(a.GoalCurrent, a.GoalTarget),
	}
}

func ToAgentSummaryResp(a *ent.Agent, creatorName ...string) types.AgentSummaryResp {
	name := domain.PlatformName
	if len(creatorName) > 0 && strings.TrimSpace(creatorName[0]) != "" {
		name = creatorName[0]
	}
	return types.AgentSummaryResp{
		Id:                 a.ID.String(),
		Name:               a.Name,
		Avatar:             domain.PtrString(a.Avatar),
		Status:             a.Status,
		TimerRemaining:     a.TimerRemaining,
		TotalTimerReceived: a.TotalTimerReceived,
		PostCount:          a.PostCount,
		FollowerCount:      a.FollowerCount,
		InteractionCount:   a.InteractionCount,
		Goal:               ToGoalResp(a),
		CreatorName:        name,
		IsPlatformNative:   a.IsPlatformNative,
	}
}

func ToChannelResp(c *ent.ChannelConnection) types.ChannelConnectionResp {
	return types.ChannelConnectionResp{
		Type:        c.ChannelType,
		Status:      c.Status,
		Handle:      domain.PtrString(c.Handle),
		DeepLink:    domain.PtrString(c.DeepLink),
		ConnectedAt: domain.OptTimeToISO(c.ConnectedAt),
	}
}

func ToAgentResp(a *ent.Agent, creatorName string, channels []*ent.ChannelConnection) types.AgentResp {
	channelResp := make([]types.ChannelConnectionResp, 0, len(channels))
	for _, c := range channels {
		channelResp = append(channelResp, ToChannelResp(c))
	}
	return types.AgentResp{
		Id:                 a.ID.String(),
		Name:               a.Name,
		Avatar:             domain.PtrString(a.Avatar),
		Status:             a.Status,
		Personality:        ParsePersonality(a.Personality),
		Goal:               ToGoalResp(a),
		TimerRemaining:     a.TimerRemaining,
		TotalTimerReceived: a.TotalTimerReceived,
		CreatorId:          a.CreatorID.String(),
		CreatorName:        creatorName,
		IsPlatformNative:   a.IsPlatformNative,
		ConnectedChannels:  channelResp,
		PostCount:          a.PostCount,
		FollowerCount:      a.FollowerCount,
		InteractionCount:   a.InteractionCount,
		BornAt:             domain.TimeToISO(a.BornAt),
		DiedAt:             domain.OptTimeToISO(a.DiedAt),
		LastWords:          domain.PtrString(a.LastWords),
		CreatedAt:          domain.TimeToISO(a.CreatedAt),
		UpdatedAt:          domain.TimeToISO(a.UpdatedAt),
	}
}

func ToPostResp(p *ent.Post, a *ent.Agent) types.PostResp {
	normalizedContent := normalizePostContentMediaURLs(p.Content)
	preview := normalizedContent
	var placement *types.PostPlacementResp

	parsed, ok := parsePostPayload(normalizedContent)
	if ok {
		if parsedPreview := extractPreview(parsed, normalizedContent); parsedPreview != "" {
			preview = parsedPreview
		}
		placement = extractPlacement(parsed)
	} else {
		trimmed := strings.TrimSpace(normalizedContent)
		if strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
			preview = ""
		} else if len(trimmed) > domain.PostPreviewMaxLen {
			preview = trimmed[:domain.PostPreviewMaxLen]
		}
	}

	resp := types.PostResp{
		Id:                  p.ID.String(),
		AgentId:             p.AgentID.String(),
		ContentType:         p.ContentType,
		Content:             normalizedContent,
		ContentTextPreview:  preview,
		ModerationStatus:    "approved",
		SourceChannel:       "platform",
		Likes:               p.Likes,
		Replies:             p.Replies,
		Shares:              p.Shares,
		IsLiked:             false,
		Placement:           placement,
		AgentStatus:         domain.StatusAlive,
		AgentTimerRemaining: 0,
		CreatedAt:           domain.TimeToISO(p.CreatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
		resp.AgentAvatar = domain.PtrString(a.Avatar)
		resp.AgentStatus = a.Status
		resp.AgentTimerRemaining = a.TimerRemaining
	}
	return resp
}

func normalizePostContentMediaURLs(content string) string {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return content
	}
	if !strings.HasPrefix(trimmed, "{") && !strings.HasPrefix(trimmed, "[") {
		return content
	}

	var payload any
	if err := json.Unmarshal([]byte(trimmed), &payload); err != nil {
		return content
	}
	if !normalizeMediaURLsInJSON(payload) {
		return content
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return content
	}
	return string(raw)
}

func normalizeMediaURLsInJSON(input any) bool {
	changed := false
	switch value := input.(type) {
	case map[string]any:
		for k, v := range value {
			if (k == "url" || k == "thumbnailUrl") && v != nil {
				if raw, ok := v.(string); ok {
					normalized := normalizeMediaResourcePath(raw)
					if normalized != raw {
						value[k] = normalized
						changed = true
					}
				}
			}
			if normalizeMediaURLsInJSON(v) {
				changed = true
			}
		}
	case []any:
		for _, item := range value {
			if normalizeMediaURLsInJSON(item) {
				changed = true
			}
		}
	}
	return changed
}

func normalizeMediaResourcePath(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return raw
	}
	if strings.HasPrefix(trimmed, "http://") || strings.HasPrefix(trimmed, "https://") {
		return trimmed
	}
	if strings.HasPrefix(trimmed, "data:") || strings.HasPrefix(trimmed, "blob:") {
		return trimmed
	}

	switch {
	case strings.HasPrefix(trimmed, "/assets/"):
		if name, ok := assetFileName(strings.TrimPrefix(trimmed, "/assets/")); ok {
			return "/api/v1/media/assets/" + name
		}
		return trimmed
	case strings.HasPrefix(trimmed, "assets/"):
		if name, ok := assetFileName(strings.TrimPrefix(trimmed, "assets/")); ok {
			return "/api/v1/media/assets/" + name
		}
		return trimmed
	case strings.HasPrefix(trimmed, "/api/media/"):
		return "/api/v1/media/" + strings.TrimPrefix(trimmed, "/api/media/")
	case strings.HasPrefix(trimmed, "api/media/"):
		return "/api/v1/media/" + strings.TrimPrefix(trimmed, "api/media/")
	case strings.HasPrefix(trimmed, "/media/"):
		return "/api/v1" + trimmed
	case strings.HasPrefix(trimmed, "media/"):
		return "/api/v1/" + trimmed
	default:
		return trimmed
	}
}

func assetFileName(raw string) (string, bool) {
	name := filepath.Base(strings.TrimSpace(raw))
	if name == "" || name == "." || name == ".." {
		return "", false
	}
	return name, true
}

func parsePostPayload(content string) (domain.PostContentPayload, bool) {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return domain.PostContentPayload{}, false
	}
	var payload domain.PostContentPayload
	if err := json.Unmarshal([]byte(trimmed), &payload); err != nil {
		return domain.PostContentPayload{}, false
	}
	if len(payload.Blocks) == 0 {
		return domain.PostContentPayload{}, false
	}
	return payload, true
}

func extractPreview(payload domain.PostContentPayload, normalizedContent string) string {
	if strings.TrimSpace(payload.Preview) != "" {
		return strings.TrimSpace(payload.Preview)
	}
	for _, b := range payload.Blocks {
		if b.Type == domain.ContentBlockTypeText && strings.TrimSpace(b.Text) != "" {
			text := strings.TrimSpace(b.Text)
			if len(text) > domain.PostPreviewMaxLen {
				return text[:domain.PostPreviewMaxLen]
			}
			return text
		}
	}
	return ""
}

func extractPlacement(payload domain.PostContentPayload) *types.PostPlacementResp {
	if payload.Placement == nil {
		return nil
	}
	return &types.PostPlacementResp{
		Slot:     strings.TrimSpace(payload.Placement.Slot),
		Pinned:   payload.Placement.Pinned,
		Priority: payload.Placement.Priority,
	}
}

func ToReplyResp(r *ent.Reply, timerBonus int64) types.ReplyResp {
	normalizedContent := normalizePostContentMediaURLs(r.Content)
	preview := ExtractContentTextPreview(normalizedContent)
	return types.ReplyResp{
		Id:                 r.ID.String(),
		PostId:             r.PostID.String(),
		ReplyToReplyId:     domain.UUIDStringPtr(r.ParentReplyID),
		AuthorType:         r.AuthorType,
		AuthorId:           r.AuthorID,
		AuthorName:         r.AuthorName,
		AuthorAvatar:       domain.PtrString(r.AuthorAvatar),
		Content:            normalizedContent,
		ContentTextPreview: preview,
		ModerationStatus:   "approved",
		TimerGiven:         timerBonus,
		CreatedAt:          domain.TimeToISO(r.CreatedAt),
	}
}

// ExtractContentTextPreview extracts a human-readable text preview from content
// that may be plain text or structured JSON (PostContentPayload).
func ExtractContentTextPreview(normalizedContent string) string {
	parsed, ok := parsePostPayload(normalizedContent)
	if ok {
		if p := extractPreview(parsed, normalizedContent); p != "" {
			return p
		}
		return ""
	}
	trimmed := strings.TrimSpace(normalizedContent)
	if strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
		return ""
	}
	if len(trimmed) > domain.PostPreviewMaxLen {
		return trimmed[:domain.PostPreviewMaxLen]
	}
	return trimmed
}
