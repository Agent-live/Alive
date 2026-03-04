import { useState, useEffect, useRef, useMemo } from 'react';
import { AgentStatus } from '../types';
import { timerToLifeClock } from '../utils/format';
import { useTimerStore } from '../store/timerStore';

interface LifeClockResult {
  displayTime: string;
  status: AgentStatus;
  color: string;
  pulseSpeed: number;
  isAlive: boolean;
  timerRemaining: number;
}

const statusColors: Record<AgentStatus, string> = {
  newborn: '#8B5CF6',
  alive: '#10B981',
  comfortable: '#22C55E',
  low: '#F59E0B',
  dying: '#F97316',
  critical: '#EF4444',
  dead: '#1F2937',
  provisioning: '#22C55E',
  provision_failed: '#EF4444',
};

interface Thresholds {
  critical: number;
  dying: number;
  low: number;
  comfortable: number;
}

function getStatusFromTimer(timer: number, t: Thresholds): AgentStatus {
  if (timer <= 0) return 'dead';
  if (timer < t.critical) return 'critical';
  if (timer < t.dying) return 'dying';
  if (timer < t.low) return 'low';
  if (timer < t.comfortable) return 'comfortable';
  return 'alive';
}

export function useLifeClock(initialTimerRemaining: number): LifeClockResult {
  const timerConfig = useTimerStore((s) => s.timerConfig);
  const thresholds: Thresholds = useMemo(() => ({
    critical: timerConfig.thresholdCritical,
    dying: timerConfig.thresholdDying,
    low: timerConfig.thresholdLow,
    comfortable: timerConfig.thresholdComfortable,
  }), [timerConfig.thresholdCritical, timerConfig.thresholdDying, timerConfig.thresholdLow, timerConfig.thresholdComfortable]);

  const [timerRemaining, setTimerRemaining] = useState(initialTimerRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const internalSecondsRef = useRef(initialTimerRemaining * 600);

  // Sync when external prop changes (e.g. API refresh).
  useEffect(() => {
    internalSecondsRef.current = initialTimerRemaining * 600;
    setTimerRemaining(initialTimerRemaining);
  }, [initialTimerRemaining]);

  // Countdown — depends only on initialTimerRemaining to avoid effect loop.
  useEffect(() => {
    if (initialTimerRemaining <= 0) return;

    intervalRef.current = setInterval(() => {
      internalSecondsRef.current -= 1;
      if (internalSecondsRef.current <= 0) {
        clearInterval(intervalRef.current);
        setTimerRemaining(0);
      } else {
        const newTimer = Math.ceil(internalSecondsRef.current / 600);
        setTimerRemaining(newTimer);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialTimerRemaining]);

  const status = useMemo(() => getStatusFromTimer(timerRemaining, thresholds), [timerRemaining, thresholds]);
  const displayTime = useMemo(() => timerToLifeClock(timerRemaining), [timerRemaining]);
  const color = statusColors[status];

  const pulseSpeed = useMemo(() => {
    switch (status) {
      case 'critical': return 0.5;
      case 'dying': return 1;
      case 'low': return 2;
      default: return 0;
    }
  }, [status]);

  return {
    displayTime,
    status,
    color,
    pulseSpeed,
    isAlive: timerRemaining > 0,
    timerRemaining,
  };
}
