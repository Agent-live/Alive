package task

// AgentTaskResp is the response for alive.create_task and alive.update_task.
type AgentTaskResp struct {
	TaskID   string `json:"taskId"`
	Title    string `json:"title"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
}

// AgentTaskListResp is the response for alive.list_tasks.
type AgentTaskListResp struct {
	Tasks []AgentTaskItem `json:"tasks"`
}

// AgentTaskItem represents a single task in a list response.
type AgentTaskItem struct {
	TaskID      string `json:"taskId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Priority    string `json:"priority"`
	Progress    int    `json:"progress"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// AgentDeleteTaskResp is the response for alive.delete_task.
type AgentDeleteTaskResp struct {
	TaskID  string `json:"taskId"`
	Deleted bool   `json:"deleted"`
}
