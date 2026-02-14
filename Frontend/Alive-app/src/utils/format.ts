import { AgentStatus, User } from '../types';

/**
 * Format Timer balance with human-readable time equivalent.
 * 1 Timer = 10 minutes of display time.
 */
export function formatTimer(timer: number, options?: { showEquivalent?: boolean }): string {
  if (timer <= 0) return '0 Timer';
  if (options?.showEquivalent) {
    const hours = Math.floor((timer * 10) / 60);
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
  const minutes = timer * 10;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/**
 * Convert Timer to LifeClock display format (HH:MM:SS).
 * 1 Timer = 10 minutes = 600 seconds for display purposes.
 */
export function timerToLifeClock(timer: number): string {
  if (timer <= 0) return '00:00:00';
  const totalSeconds = timer * 600;
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
