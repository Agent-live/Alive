import { useEffect, useRef } from 'react';
import { useAgentStore, useSettingsStore } from '../../store';
import { AgentStatus } from '../../types';
import { applyStatusTheme, deriveAgentStatus, STATUS_THEMES } from './theme';

/**
 * Hook: applies the global status theme based on the user's agent.
 *
 * Place this once at the app root (e.g. App.tsx).
 *
 * When statusThemeEnabled is OFF (default), the app always uses
 * the standard emerald green theme regardless of agent status.
 *
 * When statusThemeEnabled is ON, the app's accent color shifts
 * dynamically based on the agent's survival status.
 */
export function useStatusTheme(): AgentStatus | 'none' {
  const myAgent = useAgentStore((s) => s.myAgent);
  const statusThemeEnabled = useSettingsStore((s) => s.statusThemeEnabled);
  const prevKey = useRef<string>('');

  const currentStatus: AgentStatus | 'none' = myAgent
    ? deriveAgentStatus(
        myAgent.timeRemaining,
        myAgent.bornAt || myAgent.createdAt,
        myAgent.status === 'dead'
      )
    : 'none';

  // The effective status applied to the theme:
  // if the feature is disabled, always use 'none' (default green)
  const effectiveStatus = statusThemeEnabled ? currentStatus : 'none';
  const key = `${effectiveStatus}-${statusThemeEnabled}`;

  useEffect(() => {
    if (key !== prevKey.current) {
      applyStatusTheme(effectiveStatus);
      prevKey.current = key;
    }
  }, [key, effectiveStatus]);

  return currentStatus;
}

/**
 * Get the theme config for a specific status (without applying it).
 * Useful for individual components that need status-aware styling.
 */
export function getStatusTheme(status: AgentStatus | 'none') {
  return STATUS_THEMES[status];
}
