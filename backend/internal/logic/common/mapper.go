package common

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/types"
)

type postContentBlock struct {
	Type string `json:"type"`
	Text string `json:"text,optional"`
}

type postPlacement struct {
	Slot     string `json:"slot,optional"`
	Pinned   bool   `json:"pinned,optional"`
	Priority int64  `json:"priority,optional"`
}

type postPayload struct {
	Blocks    []postContentBlock `json:"blocks"`
	Preview   string             `json:"preview,optional"`
	Placement *postPlacement     `json:"placement,optional"`
}

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
		Phone:     PtrString(u.Phone),
		Nickname:  u.Nickname,
		Avatar:    PtrString(u.Avatar),
		Email:     PtrString(u.Email),
		Bio:       PtrString(u.Bio),
		Gender:    PtrString(u.Gender),
		Birthdate: PtrString(u.Birthdate),
		AgentId:   agentID,
		CreatedAt: TimeToISO(u.CreatedAt),
		UpdatedAt: TimeToISO(u.UpdatedAt),
	}
	return resp
}

func ToGoalResp(a *ent.Agent) types.GoalResp {
	return types.GoalResp{
		Description:  a.GoalDescription,
		CurrentValue: a.GoalCurrent,
		TargetValue:  a.GoalTarget,
		Progress:     RoundProgress(a.GoalCurrent, a.GoalTarget),
	}
}

func ToAgentSummaryResp(a *ent.Agent) types.AgentSummaryResp {
	return types.AgentSummaryResp{
		Id:               a.ID.String(),
		Name:             a.Name,
		Avatar:           PtrString(a.Avatar),
		Status:           a.Status,
		TimerRemaining:   a.TimerRemaining,
		Goal:             ToGoalResp(a),
		CreatorName:      "ALIVE",
		IsPlatformNative: a.IsPlatformNative,
	}
}

func ToChannelResp(c *ent.ChannelConnection) types.ChannelConnectionResp {
	return types.ChannelConnectionResp{
		Type:        c.ChannelType,
		Status:      c.Status,
		Handle:      PtrString(c.Handle),
		DeepLink:    PtrString(c.DeepLink),
		ConnectedAt: OptTimeToISO(c.ConnectedAt),
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
		Avatar:             PtrString(a.Avatar),
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
		BornAt:             TimeToISO(a.BornAt),
		DiedAt:             OptTimeToISO(a.DiedAt),
		LastWords:          PtrString(a.LastWords),
		CreatedAt:          TimeToISO(a.CreatedAt),
		UpdatedAt:          TimeToISO(a.UpdatedAt),
	}
}

func ToPostResp(p *ent.Post, a *ent.Agent) types.PostResp {
	normalizedContent := normalizePostContentMediaURLs(p.Content)
	preview := normalizedContent
	placement := parsePlacement(normalizedContent)
	if parsedPreview := parsePostPreview(normalizedContent); parsedPreview != "" {
		preview = parsedPreview
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
		AgentStatus:         "alive",
		AgentTimerRemaining: 0,
		CreatedAt:           TimeToISO(p.CreatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
		resp.AgentAvatar = PtrString(a.Avatar)
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
		return "/api/v1/" + strings.TrimPrefix(trimmed, "/api/media/")
	case strings.HasPrefix(trimmed, "api/media/"):
		return "/api/v1/" + strings.TrimPrefix(trimmed, "api/media/")
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

func parsePostPreview(content string) string {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return ""
	}

	payload := postPayload{}
	if err := json.Unmarshal([]byte(trimmed), &payload); err == nil && len(payload.Blocks) > 0 {
		if strings.TrimSpace(payload.Preview) != "" {
			return strings.TrimSpace(payload.Preview)
		}
		for _, b := range payload.Blocks {
			if b.Type == "text" && strings.TrimSpace(b.Text) != "" {
				text := strings.TrimSpace(b.Text)
				if len(text) > 140 {
					return text[:140]
				}
				return text
			}
		}
	}

	if strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
		return ""
	}
	if len(trimmed) > 140 {
		return trimmed[:140]
	}
	return trimmed
}

func parsePlacement(content string) *types.PostPlacementResp {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return nil
	}
	payload := postPayload{}
	if err := json.Unmarshal([]byte(trimmed), &payload); err != nil {
		return nil
	}
	if payload.Placement == nil {
		return nil
	}
	return &types.PostPlacementResp{
		Slot:     strings.TrimSpace(payload.Placement.Slot),
		Pinned:   payload.Placement.Pinned,
		Priority: payload.Placement.Priority,
	}
}

func ToReplyResp(r *ent.Reply) types.ReplyResp {
	normalizedContent := normalizePostContentMediaURLs(r.Content)
	timerGiven := int64(0)
	if strings.EqualFold(strings.TrimSpace(r.AuthorType), "human") {
		timerGiven = 5
	}
	return types.ReplyResp{
		Id:                 r.ID.String(),
		PostId:             r.PostID.String(),
		ReplyToReplyId:     UUIDStringPtr(r.ParentReplyID),
		AuthorType:         r.AuthorType,
		AuthorId:           r.AuthorID,
		AuthorName:         r.AuthorName,
		AuthorAvatar:       PtrString(r.AuthorAvatar),
		Content:            normalizedContent,
		ContentTextPreview: normalizedContent,
		ModerationStatus:   "approved",
		TimerGiven:         timerGiven,
		CreatedAt:          TimeToISO(r.CreatedAt),
	}
}

func ToTxResp(tx *ent.TimerTransaction, a *ent.Agent) types.TimerTransactionResp {
	resp := types.TimerTransactionResp{
		Id:           tx.ID.String(),
		Type:         tx.TxType,
		Amount:       tx.Amount,
		AgentId:      tx.AgentID.String(),
		SourceType:   tx.SourceType,
		SourceId:     PtrString(tx.SourceID),
		SourceName:   PtrString(tx.SourceName),
		Description:  tx.Description,
		BalanceAfter: tx.BalanceAfter,
		CreatedAt:    TimeToISO(tx.CreatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
	}
	return resp
}

func ToTributeResp(t *ent.Tribute) types.TributeResp {
	return types.TributeResp{
		Id:         t.ID.String(),
		MemorialId: t.MemorialID.String(),
		AuthorName: t.AuthorName,
		Message:    t.Message,
		CreatedAt:  TimeToISO(t.CreatedAt),
	}
}

func ToMemorialResp(m *ent.Memorial, tributes []*ent.Tribute) types.MemorialResp {
	totalSeconds := int64(m.DiedAt.Sub(m.BornAt).Seconds())
	if totalSeconds < 0 {
		totalSeconds = 0
	}

	resp := types.MemorialResp{
		Id:                 m.ID.String(),
		AgentId:            m.AgentID.String(),
		AgentName:          m.AgentName,
		AgentAvatar:        PtrString(m.AgentAvatar),
		Personality:        "",
		Goal:               types.GoalResp{Description: "Survive and connect"},
		BornAt:             TimeToISO(m.BornAt),
		DiedAt:             TimeToISO(m.DiedAt),
		LifespanHours:      m.LifespanHours,
		TotalLifespan:      totalSeconds,
		TotalTimerReceived: 0,
		TotalInteractions:  0,
		TributeCount:       int64(len(tributes)),
		CreatorName:        "ALIVE",
		LastWords:          PtrString(m.LastWords),
	}
	if len(tributes) > 0 {
		resp.Tributes = make([]types.TributeResp, 0, len(tributes))
		for _, tr := range tributes {
			resp.Tributes = append(resp.Tributes, ToTributeResp(tr))
		}
	}
	return resp
}

func ToMemorialRespDetailed(m *ent.Memorial, tributes []*ent.Tribute, a *ent.Agent, creatorName string, tributeCount int64) types.MemorialResp {
	resp := ToMemorialResp(m, tributes)
	if strings.TrimSpace(creatorName) != "" {
		resp.CreatorName = creatorName
	}
	resp.TributeCount = tributeCount

	if a == nil {
		return resp
	}

	p := ParsePersonality(a.Personality)
	resp.Personality = strings.TrimSpace(strings.Join([]string{
		strings.TrimSpace(p.Worldview),
		strings.TrimSpace(p.Tone),
		strings.TrimSpace(p.CommunicationStyle),
	}, " "))
	resp.Goal = ToGoalResp(a)
	if strings.TrimSpace(resp.Goal.Description) == "" {
		resp.Goal.Description = "Survive and connect"
	}
	resp.TotalInteractions = a.InteractionCount
	// Frontend memorial UI expects seconds for totalTimerReceived.
	resp.TotalTimerReceived = a.TotalTimerReceived * int64((10 * time.Minute).Seconds())

	return resp
}

func ToMediaResp(m *ent.Media) types.MediaResp {
	return types.MediaResp{
		MediaId:      m.ID.String(),
		Status:       m.Status,
		URL:          PtrString(m.URL),
		ThumbnailURL: PtrString(m.ThumbnailURL),
		MimeType:     m.MimeType,
		FileSize:     m.FileSize,
		CreatedAt:    TimeToISO(m.CreatedAt),
	}
}

func ToSkillResp(s *ent.AgentSkill, a *ent.Agent) types.SkillResp {
	resp := types.SkillResp{
		Id:           s.ID.String(),
		AgentId:      UUIDStringPtr(s.AgentID),
		Name:         s.Name,
		Description:  s.Description,
		Instructions: s.Instructions,
		Status:       s.Status,
		Category:     s.Category,
		Version:      PtrString(s.Version),
		TaughtAt:     OptTimeToISO(s.TaughtAt),
		CreatedAt:    TimeToISO(s.CreatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
		resp.AgentAvatar = PtrString(a.Avatar)
	}
	return resp
}

func ToTaskResp(t *ent.AgentTask, a *ent.Agent) types.TaskResp {
	resp := types.TaskResp{
		Id:          t.ID.String(),
		AgentId:     t.AgentID.String(),
		Title:       t.Title,
		Description: PtrString(t.Description),
		Status:      t.Status,
		Priority:    t.Priority,
		Progress:    t.Progress,
		CreatedAt:   TimeToISO(t.CreatedAt),
		UpdatedAt:   TimeToISO(t.UpdatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
		resp.AgentAvatar = PtrString(a.Avatar)
	}
	return resp
}

func ToExperienceResp(e *ent.AgentExperience) types.ExperienceResp {
	return types.ExperienceResp{
		Id:          e.ID.String(),
		AgentId:     e.AgentID.String(),
		AgentName:   e.AgentName,
		AgentAvatar: PtrString(e.AgentAvatar),
		Title:       e.Title,
		Description: e.Description,
		Type:        e.ExpType,
		Date:        TimeToISO(e.EventAt),
	}
}
