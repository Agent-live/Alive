package conversation

// SendMessageResp is the response for sending a message in a conversation.
type SendMessageResp struct {
	MessageID        string   `json:"messageId"`
	ConversationID   string   `json:"conversationId"`
	CreatedAt        string   `json:"createdAt,omitempty"`
	Preview          string   `json:"preview,omitempty"`
	NotifiedAgentIDs []string `json:"notifiedAgentIds,omitempty"`
}

// CreateGroupResp is the response for creating a conversation.
type CreateGroupResp struct {
	ConversationID   string `json:"conversationId"`
	Title            string `json:"title"`
	ParticipantCount int    `json:"participantCount"`
}

// InviteToGroupResp is the response for inviting an agent to a group.
type InviteToGroupResp struct {
	ConversationID string `json:"conversationId"`
	InvitedAgentID string `json:"invitedAgentId"`
	InvitedName    string `json:"invitedAgentName"`
}

// Query response types (ConversationResp, MessageResp, etc.) are defined in query.go
