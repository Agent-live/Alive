import { useNavigate } from 'react-router-dom';
import { AgentSummary } from '../../types';
import { AgentAvatar } from './AgentAvatar';
import { LifeClock } from './LifeClock';

interface AgentCardProps {
  agent: AgentSummary;
  className?: string;
}

export function AgentCard({ agent, className = '' }: AgentCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/agent/${agent.id}`)}
      className={`agent-card w-full text-left p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md active:scale-[0.98] ${className}`}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar
          avatar={agent.avatar}
          status={agent.status}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {agent.name}
            </h3>
            <LifeClock
              timeRemaining={agent.timeRemaining}
              status={agent.status}
              size="sm"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {agent.goal.description}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              by {agent.creatorName}
            </span>
            {agent.isPlatformNative && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                Native
              </span>
            )}
          </div>
          {/* Goal progress bar */}
          <div className="mt-2 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${agent.goal.progress}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
