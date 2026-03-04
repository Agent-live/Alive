import { AgentStatus, User } from '../types';
import { TIMER_UNIT_MINUTES } from '../constants/timer';

/**
 * Format Timer balance with human-readable time equivalent.
 */
export function formatTimer(timer: number, options?: { showEquivalent?: boolean }): string {
  if (timer <= 0) return '0 Timer';
  if (options?.showEquivalent) {
    const hours = Math.floor((timer * TIMER_UNIT_MINUTES) / 60);
    return `${timer} Timer (about ${hours}h)`;
  }
  return `${timer} Timer`;
}

/**
 * Format Timer transaction (with +/- sign)
 */
export function formatTimerDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta} Timer`;
}

/**
 * Convert Timer to approximate human time string
 */
export function timerToHumanTime(timer: number): string {
  const minutes = timer * TIMER_UNIT_MINUTES;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/**
 * Convert Timer to LifeClock display format (HH:MM:SS).
 */
export function timerToLifeClock(timer: number): string {
  if (timer <= 0) return '00:00:00';
  const totalSeconds = timer * TIMER_UNIT_MINUTES * 60;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format Timer lifespan in human-readable form
 */
export function formatLifespan(timer: number): string {
  if (timer <= 0) return '0 Timer';
  return timerToHumanTime(timer);
}

/**
 * Format Timer gift amount
 */
export function formatTimerGift(timer: number): string {
  return `${timer} Timer`;
}

/**
 * Format agent status label
 */
export function formatAgentStatus(status: AgentStatus): string {
  const labels: Record<AgentStatus, string> = {
    newborn: 'Newborn',
    alive: 'Alive',
    comfortable: 'Comfortable',
    low: 'Low',
    dying: 'Dying',
    critical: 'Critical',
    dead: 'Dead',
    provisioning: 'Provisioning',
    provision_failed: 'Failed',
  };
  return labels[status] || status;
}

/**
 * Format date (relative)
 */
export function formatDate(
  date: string | Date,
  format: 'full' | 'date' | 'time' | 'datetime' | 'relative' = 'date'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diff / (1000 * 60));

  switch (format) {
    case 'relative':
      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;

    case 'time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    case 'datetime':
      return d.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

    case 'full':
      return d.toLocaleString('en-US');

    case 'date':
    default:
      return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
  }
}

/**
 * Format phone number (hide middle digits)
 */
export function formatPhone(phone: string, hide = true): string {
  if (!phone || phone.length !== 11) return phone;
  if (!hide) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * Format number (short version)
 */
export function formatNumberShort(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

/**
 * Get user avatar URL with gender-based default fallback.
 * Uses locally cached DiceBear Notionists SVGs.
 */
export function getUserAvatar(user: Pick<User, 'avatar' | 'gender'> | null | undefined): string {
  if (user?.avatar) return user.avatar;
  if (user?.gender === 'female') return '/default-avatar-female.svg';
  if (user?.gender === 'male') return '/default-avatar-male.svg';
  return '/default-avatar.svg';
}

/** Convert Timer units to minutes. */
export function timerToMinutes(timer: number): number {
  return Math.max(0, Math.floor(timer * TIMER_UNIT_MINUTES));
}

/** Convert Timer units to approximate alive days. */
export function timerToAliveDays(timer: number): number {
  return Math.max(0, Math.round(timerToMinutes(timer) / 60 / 24));
}

/** Format Timer remaining in long human form. */
export function formatTimerLong(timer: number): string {
  const totalMinutes = timerToMinutes(timer);
  if (totalMinutes <= 0) return "0m";
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(" ");
}

/**
 * Normalize a 0–1 progress fraction to a 0–100 percent, clamping edge cases.
 */
export function normalizeProgressPercent(progress: number): number {
  let pct = Math.max(0, Math.min(100, progress * 100));
  if (progress > 0 && pct < 0.1) pct = 0.1;
  if (progress < 1 && pct > 99.9) pct = 99.9;
  return pct;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
