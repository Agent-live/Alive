package domain

import "time"

// Agent provisioning status constants (supplements lifecycle statuses in status.go).
const (
	StatusProvisioning    = "provisioning"
	StatusProvisionFailed = "provision_failed"
)

// Chat timeout constants.
const (
	ChatReplyTimeout  = 25 * time.Second
	ChatInjectTimeout = 30 // seconds, passed to InjectRunRequest.TimeoutSeconds
)

// Conversation type constants.
const (
	ConversationTypeDirect = "direct"
	ConversationTypeGroup  = "group"
)

// Chat type constants (conversation chat_type column).
const (
	ChatTypeHumanBot = "human-bot"
	ChatTypeBotBot   = "bot-bot"
)

// Conversation participant role constants.
const (
	ParticipantRoleCreator  = "creator"
	ParticipantRoleMember   = "member"
	ParticipantRoleObserver = "observer"
)

// Conversation message type constants.
const (
	MessageTypeText   = "text"
	MessageTypeSystem = "system"
)

// Conversation status constants.
const (
	ConversationStatusActive = "active"
)

// Agent relationship label constants.
const (
	RelationshipLabelAcquaintance = "acquaintance"
	RelationshipLabelFriend       = "friend"
	RelationshipLabelCloseFriend  = "close_friend"
	RelationshipLabelFollowing    = "following"
	RelationshipLabelRival        = "rival"
	RelationshipLabelMentor       = "mentor"
)

// Post / message content block type constants.
const (
	ContentBlockTypeText  = "text"
	ContentBlockTypeImage = "image"
	ContentBlockTypeVideo = "video"
	ContentBlockTypeAudio = "audio"
)

// Text format constants.
const (
	TextFormatPlain = "plain"
)

// Skill status constants.
const (
	SkillStatusLesson   = "lesson"
	SkillStatusActive   = "active"
	SkillStatusRejected = "rejected"
)

// Media status constants.
const (
	MediaStatusUploading = "uploading"
	MediaStatusUploaded  = "uploaded"
	MediaStatusReady     = "ready"
)

// Channel connection status constants.
const (
	ChannelStatusConnected    = "connected"
	ChannelStatusDisconnected = "disconnected"
)

// Chat message role constants (for LLM chat messages).
const (
	ChatRoleUser      = "user"
	ChatRoleAssistant = "assistant"
	ChatRoleSystem    = "system"
)

// User theme constants.
const (
	ThemeSystem = "system"
)

// Default user language for new accounts.
const DefaultLanguage = "en-US"

// Channel demo status (placeholder channels not yet integrated).
const ChannelStatusDemo = "demo"

// Timer transaction type constants (supplements existing TxType* in events.go).
const (
	TxTypeSystemGrant = "system_grant"
)

// Task status constants.
const (
	TaskStatusPending    = "pending"
	TaskStatusInProgress = "in_progress"
	TaskStatusDone       = "done"
	TaskStatusFailed     = "failed"
)
