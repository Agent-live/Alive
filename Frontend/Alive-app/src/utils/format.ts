import { AgentStatus } from '../types';

/**
 * Format time remaining as HH:MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format lifespan in human-readable form
 */
export function formatLifespan(seconds: number): string {
  if (seconds <= 0) return '0 seconds';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ${hours}h`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Format time gift amount
 */
export function formatTimeGift(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 60)}m`;
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
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
