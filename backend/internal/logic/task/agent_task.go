package task

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agenttask"
	"backend/internal/domain"
	"backend/internal/logic/notify"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// AgentTaskOps provides agent-initiated task operations for MCP tools.
type AgentTaskOps struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	emit   *notify.Emitter
}

// NewAgentTaskOps creates a new AgentTaskOps instance.
func NewAgentTaskOps(ctx context.Context, svcCtx *svc.ServiceContext) *AgentTaskOps {
	return &AgentTaskOps{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		emit:   notify.NewEmitter(ctx, svcCtx),
	}
}

// CreateTask creates a new task for the agent.
func (o *AgentTaskOps) CreateTask(agentID uuid.UUID, title, description, priority string) (*AgentTaskResp, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	if priority == "" {
		priority = "medium"
	}

	builder := o.svcCtx.DB.AgentTask.Create().
		SetAgentID(agentID).
		SetTitle(title).
		SetPriority(priority)
	if desc := strings.TrimSpace(description); desc != "" {
		builder = builder.SetDescription(desc)
	}

	t, err := builder.Save(o.ctx)
	if err != nil {
		return nil, err
	}
	o.emit.EmitEventToAgentID(
		agentID,
		"task.created",
		"ALIVE Task Created",
		fmt.Sprintf("Task created: %s", t.Title),
		domain.BuildDedupeKey(agentID.String(), "task.created", t.ID.String()),
		map[string]any{
			"taskId":      t.ID.String(),
			"title":       t.Title,
			"description": domain.PtrString(t.Description),
			"priority":    t.Priority,
			"status":      t.Status,
			"progress":    t.Progress,
		},
	)
	descText := strings.ToLower(domain.PtrString(t.Description))
	if strings.Contains(descText, "discussion") || strings.Contains(descText, "conversation") {
		o.emit.EmitEventToAgentID(
			agentID,
			"discussion.topic_task_created",
			"ALIVE Discussion Task Created",
			fmt.Sprintf("Task extracted from discussion: %s", t.Title),
			domain.BuildDedupeKey(agentID.String(), "discussion.topic_task_created", t.ID.String()),
			map[string]any{
				"taskId":      t.ID.String(),
				"title":       t.Title,
				"description": domain.PtrString(t.Description),
				"priority":    t.Priority,
				"status":      t.Status,
			},
		)
	}
	return &AgentTaskResp{
		TaskID:   t.ID.String(),
		Title:    t.Title,
		Status:   t.Status,
		Progress: t.Progress,
	}, nil
}

// UpdateTask updates status and/or progress of an existing task.
func (o *AgentTaskOps) UpdateTask(agentID uuid.UUID, taskID string, status string, progress int) (*AgentTaskResp, error) {
	tid, err := uuid.Parse(strings.TrimSpace(taskID))
	if err != nil {
		return nil, errors.New("invalid taskId")
	}

	t, err := o.svcCtx.DB.AgentTask.Get(o.ctx, tid)
	if err != nil {
		return nil, err
	}
	if t.AgentID != agentID {
		return nil, errors.New("task does not belong to this agent")
	}
	if t.DeletedAt != nil {
		return nil, errors.New("task has been deleted")
	}

	prevStatus := t.Status
	update := o.svcCtx.DB.AgentTask.UpdateOneID(tid)
	if s := strings.TrimSpace(status); s != "" {
		update = update.SetStatus(s)
	}
	if progress >= 0 && progress <= 100 {
		update = update.SetProgress(progress)
	}

	updated, err := update.Save(o.ctx)
	if err != nil {
		return nil, err
	}
	o.emit.EmitEventToAgentID(
		agentID,
		"task.updated",
		"ALIVE Task Updated",
		fmt.Sprintf("Task updated: %s", updated.Title),
		domain.BuildDedupeKey(agentID.String(), "task.updated", updated.ID.String(), updated.Status, fmt.Sprintf("%d", updated.Progress)),
		map[string]any{
			"taskId":      updated.ID.String(),
			"title":       updated.Title,
			"description": domain.PtrString(updated.Description),
			"priority":    updated.Priority,
			"status":      updated.Status,
			"progress":    updated.Progress,
		},
	)
	if prevStatus != updated.Status {
		o.emit.EmitEventToAgentID(
			agentID,
			"task.state_changed",
			"ALIVE Task State Changed",
			fmt.Sprintf("Task state changed: %s -> %s", prevStatus, updated.Status),
			domain.BuildDedupeKey(agentID.String(), "task.state_changed", updated.ID.String(), prevStatus, updated.Status),
			map[string]any{
				"taskId":      updated.ID.String(),
				"title":       updated.Title,
				"fromStatus":  prevStatus,
				"toStatus":    updated.Status,
				"newProgress": updated.Progress,
			},
		)
	}
	return &AgentTaskResp{
		TaskID:   updated.ID.String(),
		Title:    updated.Title,
		Status:   updated.Status,
		Progress: updated.Progress,
	}, nil
}

// ListTasks lists tasks for an agent, optionally filtered by status.
func (o *AgentTaskOps) ListTasks(agentID uuid.UUID, status string, limit int64) (*AgentTaskListResp, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := o.svcCtx.DB.AgentTask.Query().
		Where(
			agenttask.AgentID(agentID),
			agenttask.DeletedAtIsNil(),
		).
		Order(ent.Desc(agenttask.FieldCreatedAt)).
		Limit(int(limit))

	if s := strings.TrimSpace(status); s != "" {
		query = query.Where(agenttask.Status(s))
	}

	rows, err := query.All(o.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]AgentTaskItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, AgentTaskItem{
			TaskID:      r.ID.String(),
			Title:       r.Title,
			Description: domain.PtrString(r.Description),
			Status:      r.Status,
			Priority:    r.Priority,
			Progress:    r.Progress,
			CreatedAt:   domain.TimeToISO(r.CreatedAt),
			UpdatedAt:   domain.TimeToISO(r.UpdatedAt),
		})
	}
	return &AgentTaskListResp{Tasks: items}, nil
}

// DeleteTask soft-deletes a task by setting deleted_at.
func (o *AgentTaskOps) DeleteTask(agentID uuid.UUID, taskID string) (*AgentDeleteTaskResp, error) {
	tid, err := uuid.Parse(strings.TrimSpace(taskID))
	if err != nil {
		return nil, errors.New("invalid taskId")
	}

	t, err := o.svcCtx.DB.AgentTask.Get(o.ctx, tid)
	if err != nil {
		return nil, err
	}
	if t.AgentID != agentID {
		return nil, errors.New("task does not belong to this agent")
	}

	now := time.Now().UTC()
	if _, err := o.svcCtx.DB.AgentTask.UpdateOneID(tid).
		SetDeletedAt(now).
		Save(o.ctx); err != nil {
		return nil, err
	}
	o.emit.EmitEventToAgentID(
		agentID,
		"task.deleted",
		"ALIVE Task Deleted",
		fmt.Sprintf("Task deleted: %s", t.Title),
		domain.BuildDedupeKey(agentID.String(), "task.deleted", tid.String()),
		map[string]any{
			"taskId":      tid.String(),
			"title":       t.Title,
			"description": domain.PtrString(t.Description),
			"priority":    t.Priority,
		},
	)
	return &AgentDeleteTaskResp{
		TaskID:  tid.String(),
		Deleted: true,
	}, nil
}
