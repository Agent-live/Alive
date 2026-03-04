import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AgentStatus } from '../../types';
import { timerToLifeClock } from '../../utils/format';

interface LifeClockProps {
  timerRemaining: number; // Timer units (1 Timer = 10 min)
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { text: 'text-xs', wrapper: 'h-5', font: 'font-mono font-medium' },
  md: { text: 'text-sm', wrapper: 'h-6', font: 'font-mono font-semibold' },
  lg: { text: 'text-xl', wrapper: 'h-8', font: 'font-mono font-bold' },
  hero: { text: 'text-4xl', wrapper: 'h-14', font: 'font-mono font-black tracking-wider' },
};

const statusColors: Record<AgentStatus, string> = {
  newborn: 'text-status-newborn',
  alive: 'text-status-alive',
  comfortable: 'text-status-comfortable',
  low: 'text-status-low',
  dying: 'text-status-dying',
  critical: 'text-status-critical',
  dead: 'text-status-dead',
  provisioning: 'text-status-newborn',
  provision_failed: 'text-status-dead',
};

function getPulseSpeed(status: AgentStatus): number {
  switch (status) {
    case 'critical': return 0.5;
    case 'dying': return 1;
    case 'low': return 2;
    default: return 0;
  }
}

export function LifeClock({ timerRemaining, status, size = 'md', showLabel = false, className = '' }: LifeClockProps) {
  const config = sizeConfig[size];
  const color = statusColors[status];
  const pulseSpeed = getPulseSpeed(status);
  const display = useMemo(() => timerToLifeClock(timerRemaining), [timerRemaining]);

  if (status === 'dead') {
    return (
      <div className={`flex items-center ${config.wrapper} ${className}`}>
        <span className={`${config.text} ${config.font} text-status-dead line-through opacity-60`}>
          00:00:00
        </span>
        {showLabel && <span className="ml-1.5 text-xs text-status-dead opacity-60">DECEASED</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${config.wrapper} ${className}`}>
      <motion.span
        className={`${config.text} ${config.font} ${color}`}
        animate={pulseSpeed > 0 ? {
          opacity: [1, 0.4, 1],
        } : undefined}
        transition={pulseSpeed > 0 ? {
          duration: pulseSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        } : undefined}
      >
        {display}
      </motion.span>
      {showLabel && (
        <span className={`ml-1.5 text-xs ${color} opacity-70`}>
          {status === 'critical' ? 'CRITICAL' : status === 'dying' ? 'DYING' : 'remaining'}
        </span>
      )}
    </div>
  );
}
