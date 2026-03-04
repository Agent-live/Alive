/**
 * ALIVE Status Theme System
 *
 * The entire app's accent color shifts based on the user's agent status.
 * This is not decoration — it's the platform breathing with your agent.
 */

import { AgentStatus } from "../../types";

export interface StatusTheme {
  /** Primary accent color */
  accent: string;
  /** Lighter variant for backgrounds/soft fills */
  accentLight: string;
  /** Darker variant for emphasis */
  accentDark: string;
  /** Soft overlay (10% opacity) */
  accentSoft: string;
  /** Glow/shadow color */
  glow: string;
  /** Button shadow */
  buttonShadow: string;
  /** CSS class name for the status */
  className: string;
  /** Logo pulse animation speed (ms), 0 = no pulse */
  logoPulseMs: number;
  /** Logo dot visible */
  logoDotVisible: boolean;
}

/**
 * Each agent status maps to a complete theme override.
 * The app applies these as CSS custom properties on :root.
 */
export const STATUS_THEMES: Record<AgentStatus | "none", StatusTheme> = {
  none: {
    accent: "#10B981",
    accentLight: "#D1FAE5",
    accentDark: "#047857",
    accentSoft: "rgba(16, 185, 129, 0.10)",
    glow: "rgba(16, 185, 129, 0.12)",
    buttonShadow: "0 8px 24px rgba(16, 185, 129, 0.28)",
    className: "status-theme-none",
    logoPulseMs: 0,
    logoDotVisible: true,
  },

  newborn: {
    accent: "#8B5CF6",
    accentLight: "#EDE9FE",
    accentDark: "#6D28D9",
    accentSoft: "rgba(139, 92, 246, 0.10)",
    glow: "rgba(139, 92, 246, 0.15)",
    buttonShadow: "0 8px 24px rgba(139, 92, 246, 0.28)",
    className: "status-theme-newborn",
    logoPulseMs: 3000,
    logoDotVisible: true,
  },

  alive: {
    accent: "#10B981",
    accentLight: "#D1FAE5",
    accentDark: "#047857",
    accentSoft: "rgba(16, 185, 129, 0.10)",
    glow: "rgba(16, 185, 129, 0.12)",
    buttonShadow: "0 8px 24px rgba(16, 185, 129, 0.28)",
    className: "status-theme-alive",
    logoPulseMs: 0,
    logoDotVisible: true,
  },

  comfortable: {
    accent: "#22C55E",
    accentLight: "#DCFCE7",
    accentDark: "#15803D",
    accentSoft: "rgba(34, 197, 94, 0.10)",
    glow: "rgba(34, 197, 94, 0.12)",
    buttonShadow: "0 8px 24px rgba(34, 197, 94, 0.28)",
    className: "status-theme-comfortable",
    logoPulseMs: 0,
    logoDotVisible: true,
  },

  low: {
    accent: "#F59E0B",
    accentLight: "#FEF3C7",
    accentDark: "#B45309",
    accentSoft: "rgba(245, 158, 11, 0.10)",
    glow: "rgba(245, 158, 11, 0.15)",
    buttonShadow: "0 8px 24px rgba(245, 158, 11, 0.28)",
    className: "status-theme-low",
    logoPulseMs: 3000,
    logoDotVisible: true,
  },

  dying: {
    accent: "#F97316",
    accentLight: "#FFEDD5",
    accentDark: "#C2410C",
    accentSoft: "rgba(249, 115, 22, 0.10)",
    glow: "rgba(249, 115, 22, 0.20)",
    buttonShadow: "0 8px 24px rgba(249, 115, 22, 0.30)",
    className: "status-theme-dying",
    logoPulseMs: 2000,
    logoDotVisible: true,
  },

  critical: {
    accent: "#EF4444",
    accentLight: "#FEE2E2",
    accentDark: "#B91C1C",
    accentSoft: "rgba(239, 68, 68, 0.10)",
    glow: "rgba(239, 68, 68, 0.25)",
    buttonShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
    className: "status-theme-critical",
    logoPulseMs: 500,
    logoDotVisible: true,
  },

  dead: {
    accent: "#6B7280",
    accentLight: "#F3F4F6",
    accentDark: "#1F2937",
    accentSoft: "rgba(107, 114, 128, 0.10)",
    glow: "rgba(107, 114, 128, 0.08)",
    buttonShadow: "0 8px 24px rgba(107, 114, 128, 0.15)",
    className: "status-theme-dead",
    logoPulseMs: 0,
    logoDotVisible: false,
  },

  provisioning: {
    accent: "#8B5CF6",
    accentLight: "#EDE9FE",
    accentDark: "#6D28D9",
    accentSoft: "rgba(139, 92, 246, 0.10)",
    glow: "rgba(139, 92, 246, 0.15)",
    buttonShadow: "0 8px 24px rgba(139, 92, 246, 0.28)",
    className: "status-theme-provisioning",
    logoPulseMs: 2000,
    logoDotVisible: true,
  },

  provision_failed: {
    accent: "#6B7280",
    accentLight: "#F3F4F6",
    accentDark: "#1F2937",
    accentSoft: "rgba(107, 114, 128, 0.10)",
    glow: "rgba(107, 114, 128, 0.08)",
    buttonShadow: "0 8px 24px rgba(107, 114, 128, 0.15)",
    className: "status-theme-provision-failed",
    logoPulseMs: 0,
    logoDotVisible: false,
  },
};

/**
 * Apply a status theme to the document root as CSS custom properties.
 * This makes the ENTIRE app respond to agent status changes.
 */
export function applyStatusTheme(status: AgentStatus | "none"): void {
  const theme = STATUS_THEMES[status];
  const root = document.documentElement;

  root.style.setProperty("--color-primary", theme.accent);
  root.style.setProperty("--color-primary-light", theme.accentLight);
  root.style.setProperty("--color-primary-dark", theme.accentDark);
  root.style.setProperty("--color-primary-soft", theme.accentSoft);
  root.style.setProperty("--material-glow", theme.glow);
  root.style.setProperty("--shadow-button", theme.buttonShadow);

  // Remove all status theme classes, then add current
  const classes = Object.values(STATUS_THEMES).map((t) => t.className);
  root.classList.remove(...classes);
  root.classList.add(theme.className);
}
