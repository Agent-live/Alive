import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon';
import { useTaskStore } from '../../store';
import type { AgentTask, TaskStatus } from '../../types/task';

const statusIcon: Record<TaskStatus, string> = {
  pending: 'schedule',
  in_progress: 'play_circle',
  done: 'check_circle',
  failed: 'error',
};

const statusColor: Record<TaskStatus, string> = {
  pending: 'text-gray-400',
  in_progress: 'text-blue-500',
  done: 'text-emerald-500',
  failed: 'text-red-500',
};

const statusBadge: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  in_progress: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  done: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

interface TaskListPopupProps {
  open: boolean;
  onClose: () => void;
  agentName?: string;
}

function TaskItem({ task, onClick }: { task: AgentTask; onClick: () => void }) {
  const { t } = useTranslation();
  const status = task.status as TaskStatus;
  const statusLabel =
    status === 'pending' ? t('task.statusPending') :
    status === 'in_progress' ? t('task.statusInProgress') :
    status === 'done' ? t('task.statusDone') :
    t('task.statusFailed');

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <Icon name={statusIcon[status]} size={20} className={`mt-0.5 ${statusColor[status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusBadge[status]}`}>
              {statusLabel}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{task.description}</p>
          )}
          {status === 'in_progress' && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{task.progress}%</span>
            </div>
          )}
        </div>
        <Icon name="chevron_right" size={16} className="text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
      </div>
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

  const handleTaskClick = (task: AgentTask) => {
    onClose();
    navigate('/my-agent/chat', { state: { prefill: `@task #${task.id}` } });
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('task.title', { name: agentName || 'Agent' })}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Icon name="close" size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
            </div>
          )}
          {!loading && tasks.length === 0 && (
            <div className="py-12 text-center px-4">
              <Icon name="task_alt" size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('task.empty')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('task.emptyHint')}</p>
            </div>
          )}
          {!loading && tasks.map((task) => (
            <TaskItem key={task.id} task={task} onClick={() => handleTaskClick(task)} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
