import { useState, useEffect, useRef, useMemo } from 'react';
import { AgentStatus } from '../types';

interface LifeClockResult {
  displayTime: string;
  status: AgentStatus;
  color: string;
  pulseSpeed: number;
  isAlive: boolean;
  timeRemaining: number;
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

function getStatusFromTime(seconds: number): AgentStatus {
  if (seconds <= 0) return 'dead';
  if (seconds < 3600) return 'critical';      // < 1h
  if (seconds < 21600) return 'dying';         // < 6h
  if (seconds < 43200) return 'low';           // < 12h
  if (seconds < 86400) return 'comfortable';   // < 24h
  return 'alive';                              // > 24h
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function useLifeClock(initialTimeRemaining: number): LifeClockResult {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
  }, [initialTimeRemaining]);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRemaining > 0]);

  const status = useMemo(() => getStatusFromTime(timeRemaining), [timeRemaining]);
  const displayTime = useMemo(() => formatTime(timeRemaining), [timeRemaining]);
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
    isAlive: timeRemaining > 0,
    timeRemaining,
  };
}
