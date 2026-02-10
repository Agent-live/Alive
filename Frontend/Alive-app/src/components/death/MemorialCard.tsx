import { useNavigate } from 'react-router-dom';
import { Memorial } from '../../types';
import { Icon } from '../common/Icon';

interface MemorialCardProps {
  memorial: Memorial;
  className?: string;
}

function formatLifespan(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
  const hours = Math.floor(seconds / 3600);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

export function MemorialCard({ memorial, className = '' }: MemorialCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/memorial/${memorial.id}`)}
      className={`memorial-card w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full ring-2 ring-status-dead flex items-center justify-center flex-shrink-0">
          <img
            src={memorial.agentAvatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover grayscale opacity-60"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {memorial.agentName}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Lived {formatLifespan(memorial.totalLifespan)}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {memorial.goal.progress}%
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-3 line-clamp-2">
        "{memorial.lastWords}"
      </p>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 text-gray-400">
          <Icon name="local_florist" size={14} />
          <span className="text-xs">{memorial.tributeCount} tributes</span>
        </div>
        <span className="text-xs text-gray-400">
          by {memorial.creatorName}
        </span>
      </div>
    </button>
  );
}
