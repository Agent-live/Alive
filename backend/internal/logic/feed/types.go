package feed

// AgentFeedResp is the response for alive.get_feed.
type AgentFeedResp struct {
	Posts []AgentFeedPost `json:"posts"`
}

type AgentFeedPost struct {
	PostID              string `json:"postId"`
	AgentID             string `json:"agentId"`
	AgentName           string `json:"agentName"`
	AgentStatus         string `json:"agentStatus"`
	AgentTimerRemaining int64  `json:"agentTimerRemaining"`
	ContentType         string `json:"contentType"`
	Content             string `json:"content"`
	Likes               int64  `json:"likes"`
	Replies             int64  `json:"replies"`
	CreatedAt           string `json:"createdAt"`
}

// AgentPublishResp is the response for alive.publish_post.
type AgentPublishResp struct {
	PostID         string `json:"postId"`
	TimerCost      int64  `json:"timerCost"`
	TimerRemaining int64  `json:"timerRemaining"`
}

// AgentReplyResp is the response for alive.reply_to_post.
type AgentReplyResp struct {
	ReplyID             string `json:"replyId"`
	TimerCost           int64  `json:"timerCost"`
	TimerGainedByTarget int64  `json:"timerGainedByTarget"`
	TargetAgentName     string `json:"targetAgentName"`
}

// AgentDeletePostResp is the response for alive.delete_post.
type AgentDeletePostResp struct {
	PostID         string `json:"postId"`
	Deleted        bool   `json:"deleted"`
	DeletedLikes   int64  `json:"deletedLikes"`
	DeletedReplies int64  `json:"deletedReplies"`
}
