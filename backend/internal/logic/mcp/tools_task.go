package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain"
	tasklogic "backend/internal/logic/task"
	"backend/internal/svc"

	"github.com/google/uuid"
)

// taskTools returns tool registrations for task management MCP tools.
func taskTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.create_task",
			description: "Create a new task to track your work. Users can see your tasks on their dashboard.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"title"},
				"properties": map[string]any{
					"title":       map[string]any{"type": "string", "maxLength": 200},
					"description": map[string]any{"type": "string", "maxLength": 2000},
					"priority": map[string]any{
						"type":    "string",
						"enum":    []string{"low", "medium", "high"},
						"default": "medium",
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleCreateTask,
		},
		{
			name:        "alive.update_task",
			description: "Update the status or progress of an existing task.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"taskId"},
				"properties": map[string]any{
					"taskId": map[string]any{"type": "string"},
					"status": map[string]any{
						"type": "string",
						"enum": []string{domain.TaskStatusPending, domain.TaskStatusInProgress, domain.TaskStatusDone, domain.TaskStatusFailed},
					},
					"progress": map[string]any{
						"type":    "integer",
						"minimum": 0,
						"maximum": 100,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleUpdateTask,
		},
		{
			name:        "alive.list_tasks",
			description: "List your current tasks, optionally filtered by status.",
			inputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"status": map[string]any{
						"type": "string",
						"enum": []string{domain.TaskStatusPending, domain.TaskStatusInProgress, domain.TaskStatusDone, domain.TaskStatusFailed},
					},
					"limit": map[string]any{
						"type":    "integer",
						"default": 50,
						"maximum": 100,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleListTasks,
		},
		{
			name:        "alive.delete_task",
			description: "Delete a task (soft delete). The task will no longer appear in listings.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"taskId"},
				"properties": map[string]any{
					"taskId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleDeleteTask,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: task tools
// ---------------------------------------------------------------------------

type createTaskArgs struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
}

type updateTaskArgs struct {
	TaskID   string `json:"taskId"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
}

type listTasksArgs struct {
	Status string `json:"status"`
	Limit  int64  `json:"limit"`
}

type deleteTaskArgs struct {
	TaskID string `json:"taskId"`
}

// ---------------------------------------------------------------------------
// Handler functions: task tools
// ---------------------------------------------------------------------------

func handleCreateTask(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args createTaskArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.create_task: %w", err)
	}
	if strings.TrimSpace(args.Title) == "" {
		return nil, errors.New("title is required")
	}
	return tasklogic.NewAgentTaskOps(ctx, svcCtx).CreateTask(agentID, args.Title, args.Description, args.Priority)
}

func handleUpdateTask(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args updateTaskArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.update_task: %w", err)
	}
	if strings.TrimSpace(args.TaskID) == "" {
		return nil, errors.New("taskId is required")
	}
	return tasklogic.NewAgentTaskOps(ctx, svcCtx).UpdateTask(agentID, args.TaskID, args.Status, args.Progress)
}

func handleListTasks(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args listTasksArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.list_tasks: %w", err)
	}
	return tasklogic.NewAgentTaskOps(ctx, svcCtx).ListTasks(agentID, args.Status, args.Limit)
}

func handleDeleteTask(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args deleteTaskArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.delete_task: %w", err)
	}
	if strings.TrimSpace(args.TaskID) == "" {
		return nil, errors.New("taskId is required")
	}
	return tasklogic.NewAgentTaskOps(ctx, svcCtx).DeleteTask(agentID, args.TaskID)
}
