import { useState, useEffect, useRef, useMemo } from 'react';
import { AgentStatus } from '../types';
import { timerToLifeClock } from '../utils/format';

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
};

function getStatusFromTimer(timer: number): AgentStatus {
  if (timer <= 0) return 'dead';
  if (timer < 6) return 'critical';        // < 1h (6 Timer = 60 min)
  if (timer < 36) return 'dying';           // < 6h
  if (timer < 72) return 'low';             // < 12h
  if (timer < 144) return 'comfortable';    // < 24h
  return 'alive';                           // > 24h
}

export function useLifeClock(initialTimerRemaining: number): LifeClockResult {
  const [timerRemaining, setTimerRemaining] = useState(initialTimerRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setTimerRemaining(initialTimerRemaining);
  }, [initialTimerRemaining]);

  // Tick every 600 seconds (10 min = 1 Timer unit) for display
  // But for visual countdown, tick every second and convert
  useEffect(() => {
    if (timerRemaining <= 0) return;

    // We keep an internal seconds counter for smooth display
    let internalSeconds = timerRemaining * 600;

    intervalRef.current = setInterval(() => {
      internalSeconds -= 1;
      if (internalSeconds <= 0) {
        clearInterval(intervalRef.current);
        setTimerRemaining(0);
      } else {
        // Update Timer units when a full Timer unit has elapsed
        const newTimer = Math.ceil(internalSeconds / 600);
        setTimerRemaining(newTimer);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRemaining > 0]);

  const status = useMemo(() => getStatusFromTimer(timerRemaining), [timerRemaining]);
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
