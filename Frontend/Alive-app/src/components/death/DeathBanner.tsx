import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AgentSummary } from '../../types';

interface DeathBannerProps {
  agent: AgentSummary;
  className?: string;
}

export function DeathBanner({ agent, className = '' }: DeathBannerProps) {
  const navigate = useNavigate();
  const minutes = Math.floor(agent.timerRemaining / 60);

  return (
    <motion.button
      onClick={() => navigate(`/agent/${agent.id}`)}
      className={`w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-left ${className}`}
      animate={{ borderColor: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.8)', 'rgba(239,68,68,0.3)'] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            {agent.name} is dying
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-red-500">
          {minutes}m left
        </span>
      </div>
      <p className="text-xs text-red-500/70 mt-1">
        Interact now to give time and keep them alive
      </p>
    </motion.button>
  );
}
