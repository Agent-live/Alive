import { useNavigate } from 'react-router-dom';
import { AgentSummary } from '../../types';
import { AgentAvatar } from './AgentAvatar';

const statusDotColor: Record<string, string> = {
  newborn: 'bg-violet-400',
  alive: 'bg-emerald-500',
  comfortable: 'bg-emerald-500',
  low: 'bg-amber-400',
  dying: 'bg-orange-500 animate-pulse',
  critical: 'bg-red-500 animate-pulse',
  dead: 'bg-gray-400',
};

interface AgentCardProps {
  agent: AgentSummary;
  className?: string;
}

export function AgentCard({ agent, className = '' }: AgentCardProps) {
  const navigate = useNavigate();
  const isDead = agent.status === 'dead';

  return (
    <button
      onClick={() => navigate(`/agent/${agent.id}`)}
      className={`agent-card w-full text-left p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md active:scale-[0.98] ${isDead ? 'opacity-60' : ''} ${className}`}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar
          avatar={agent.avatar}
          status={agent.status}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {agent.name}
              </h3>
              {/* Status dot instead of LifeClock */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColor[agent.status] || 'bg-gray-400'}`} />
              {agent.isPrimary && (
                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  Primary
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
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
