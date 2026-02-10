import { useMemo } from 'react';
import { AgentStatus } from '../types';

interface AgentStatusInfo {
  color: string;
  bgColor: string;
  label: string;
  icon: string;
  pulseClass: string;
}

const statusMap: Record<AgentStatus, AgentStatusInfo> = {
  newborn: {
    color: 'text-status-newborn',
    bgColor: 'bg-status-newborn',
    label: 'Newborn',
    icon: 'child_care',
    pulseClass: '',
  },
  alive: {
    color: 'text-status-alive',
    bgColor: 'bg-status-alive',
    label: 'Alive',
    icon: 'favorite',
    pulseClass: '',
  },
  comfortable: {
    color: 'text-status-comfortable',
    bgColor: 'bg-status-comfortable',
    label: 'Comfortable',
    icon: 'sentiment_satisfied',
    pulseClass: '',
  },
  low: {
    color: 'text-status-low',
    bgColor: 'bg-status-low',
    label: 'Low',
    icon: 'warning',
    pulseClass: 'animate-clock-pulse',
  },
  dying: {
    color: 'text-status-dying',
    bgColor: 'bg-status-dying',
    label: 'Dying',
    icon: 'emergency',
    pulseClass: 'animate-clock-pulse-fast',
  },
  critical: {
    color: 'text-status-critical',
    bgColor: 'bg-status-critical',
    label: 'Critical',
    icon: 'crisis_alert',
    pulseClass: 'animate-clock-pulse-critical',
  },
  dead: {
    color: 'text-status-dead',
    bgColor: 'bg-status-dead',
    label: 'Dead',
    icon: 'dark_mode',
    pulseClass: '',
  },
};

export function useAgentStatus(status: AgentStatus): AgentStatusInfo {
  return useMemo(() => statusMap[status], [status]);
}
