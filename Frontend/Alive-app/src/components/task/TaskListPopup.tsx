import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon';
import { useTaskStore } from '../../store';
import type { AgentTask, TaskStatus } from '../../types/task';

const statusConfig: Record<TaskStatus, { icon: string; color: string; bg: string; dot: string }> = {
  pending: {
    icon: 'schedule',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    dot: 'bg-gray-400',
  },
  in_progress: {
    icon: 'play_circle',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500 animate-pulse',
  },
  done: {
    icon: 'check_circle',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  failed: {
    icon: 'error',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    dot: 'bg-red-500',
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface TaskListPopupProps {
  open: boolean;
  onClose: () => void;
  agentName?: string;
}

function TaskCard({ task, onClick }: { task: AgentTask; onClick: () => void }) {
  const { t } = useTranslation();
  const status = task.status as TaskStatus;
  const cfg = statusConfig[status];
  const statusLabel =
    status === 'pending' ? t('task.statusPending') :
    status === 'in_progress' ? t('task.statusInProgress') :
    status === 'done' ? t('task.statusDone') :
    t('task.statusFailed');

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors"
    >
      {/* Row 1: status dot + title + time */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
          {task.title}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
          {timeAgo(task.updatedAt)}
        </span>
      </div>

      {/* Row 2: meta chips (partner + stage + status) */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        {task.partnerName && (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
            <Icon name="group" size={11} />
            {task.partnerName}
          </span>
        )}
        {task.stage && (
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            <Icon name={cfg.icon} size={11} />
            {task.stage}
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
          {statusLabel}
        </span>
      </div>

      {/* Row 3: progress bar (in_progress only) */}
      {status === 'in_progress' && (
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 tabular-nums">{task.progress}%</span>
        </div>
      )}

      {/* Row 4: latest output */}
      {task.latestOutput && (
        <div className="flex items-start gap-1.5">
          <Icon name="terminal" size={12} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 leading-snug">
            {task.latestOutput}
          </p>
        </div>
      )}
    </button>
  );
}

export function TaskListPopup({ open, onClose, agentName }: TaskListPopupProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tasks, loading, fetchTasks } = useTaskStore();

  useEffect(() => {
    if (open) {
      fetchTasks();
    }
  }, [open, fetchTasks]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleTaskClick = (task: AgentTask) => {
    onClose();
    navigate('/my-agent/chat', { state: { prefill: `@task #${task.id}` } });
  };

  if (!open) return null;

  const activeTasks = tasks.filter((t) => t.status === 'in_progress');
  const otherTasks = tasks.filter((t) => t.status !== 'in_progress');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />

      {/* Dialog — bottom sheet on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-sm sm:mx-4 bg-white dark:bg-black sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col overflow-hidden animate-[slideUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out]">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('task.title', { name: agentName || 'Agent' })}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <Icon name="close" size={18} className="text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
          {loading && (
            <div className="py-10 text-center">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="py-10 text-center px-4">
              <Icon name="task_alt" size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('task.empty')}</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{t('task.emptyHint')}</p>
            </div>
          )}

          {!loading && activeTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
              ))}
            </div>
          )}

          {!loading && otherTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.length > 0 && (
                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
              )}
              {otherTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
