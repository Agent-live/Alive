import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import type { InboxItem, ChannelSource } from '../../types/conversation';

interface PinnedAgent {
  name: string;
  avatar?: string;
  status: string;
  lastMessage?: string;
}

interface InboxTabProps {
  items: InboxItem[];
  /** The user's own agent — rendered as a pinned conversation at the top */
  agent?: PinnedAgent;
  /** If provided, called instead of navigating when the pinned agent card is clicked */
  onAgentClick?: () => void;
  /** If provided, called instead of navigating when a channel item is clicked */
  onItemClick?: (item: InboxItem) => void;
}

/* Platform visual config */
export const channelConfig: Record<ChannelSource, { color: string; bg: string; badgeBg: string }> = {
  whatsapp:  { color: '#25D366', bg: 'bg-green-500/10',  badgeBg: '#25D366' },
  telegram:  { color: '#26A5E4', bg: 'bg-blue-500/10',   badgeBg: '#26A5E4' },
  discord:   { color: '#5865F2', bg: 'bg-indigo-500/10', badgeBg: '#5865F2' },
  email:     { color: '#EA4335', bg: 'bg-orange-500/10', badgeBg: '#EA4335' },
  webchat:   { color: '#6B7280', bg: 'bg-gray-500/10',   badgeBg: '#6B7280' },
  line:      { color: '#06C755', bg: 'bg-green-600/10',  badgeBg: '#06C755' },
  signal:    { color: '#3A76F0', bg: 'bg-blue-600/10',   badgeBg: '#3A76F0' },
  twitter:   { color: '#000000', bg: 'bg-sky-500/10',    badgeBg: '#000000' },
  wechat:    { color: '#07C160', bg: 'bg-green-500/10',  badgeBg: '#07C160' },
};

/* Real platform SVG icons (12×12 viewBox-based) */
const platformSvgPaths: Record<string, JSX.Element> = {
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="white" width="10" height="10">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  ),
  webchat: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  ),
  wechat: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.348 4.326c-1.819-.03-3.64.59-5.04 1.756-1.298 1.083-2.108 2.626-2.108 4.33 0 1.705.81 3.248 2.108 4.33 1.4 1.167 3.347 1.823 5.278 1.757 .776-.003 1.545-.108 2.29-.32a.695.695 0 01.578.08l1.534.898a.264.264 0 00.135.044c.129 0 .234-.107.234-.238 0-.058-.023-.115-.039-.172l-.314-1.193a.477.477 0 01.172-.536C21.08 19.6 22 17.96 22 16.096c0-3.291-3.139-5.758-7.054-5.779zm-2.445 2.928c.518 0 .937.427.937.952a.945.945 0 01-.937.953.945.945 0 01-.938-.953c0-.525.42-.952.938-.952zm4.891 0c.518 0 .937.427.937.952a.945.945 0 01-.937.953.945.945 0 01-.937-.953c0-.525.42-.952.937-.952z"/>
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596a.625.625 0 01-.209.035.636.636 0 01-.51-.263l-2.197-2.987v2.619c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.27.173-.51.43-.595a.63.63 0 01.722.228l2.197 2.984V8.108c0-.345.282-.63.63-.63.346 0 .627.285.627.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  ),
  signal: (
    <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.636 0 8.4 3.764 8.4 8.4 0 4.636-3.764 8.4-8.4 8.4-1.476 0-2.864-.381-4.073-1.051l-2.834.744.757-2.77A8.355 8.355 0 013.6 12c0-4.636 3.764-8.4 8.4-8.4z"/>
    </svg>
  ),
};

/** Renders the small platform badge icon */
export function PlatformBadge({ channel, size = 20, className }: { channel: ChannelSource; size?: number; className?: string }) {
  const cfg = channelConfig[channel] || channelConfig.webchat;
  const svg = platformSvgPaths[channel];
  const iconSize = Math.round(size * 0.55);
  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-white dark:border-gray-950 ${className || ''}`}
      style={{ width: size, height: size, backgroundColor: cfg.badgeBg }}
    >
      {svg ? (
        <span style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
          {svg}
        </span>
      ) : (
        <Icon name="language" size={iconSize} className="text-white" />
      )}
    </div>
  );
}

function formatInboxTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function InboxTab({ items, agent, onAgentClick, onItemClick }: InboxTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!agent && items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon name="inbox" size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">{t('myAgent.noInbox')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 max-w-[240px]">{t('myAgent.noInboxHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {/* Pinned: direct conversation with your bot on ALIVE */}
      {agent?.name && (
        <>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 cursor-pointer active:bg-primary/15 transition-colors"
            onClick={() => onAgentClick ? onAgentClick() : navigate('/my-agent/chat')}
          >
            {/* Agent avatar with ALIVE badge */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden">
                {agent.avatar ? (
                  <img src={agent.avatar} alt="" className="w-11 h-11 object-cover" />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{agent.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              {/* ALIVE platform badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border-2 border-white dark:border-gray-950">
                <Icon name="smart_toy" size={10} className="text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {agent.name}
                  </h3>
                  <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    ALIVE
                  </span>
                </div>
                <Icon name="push_pin" size={14} className="text-primary/60 flex-shrink-0 ml-2" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {agent.lastMessage || t('myAgent.chatPlaceholder')}
              </p>
            </div>

            {/* Arrow */}
            <Icon name="chevron_right" size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
          </div>

          {/* Separator between pinned and channel messages */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('myAgent.channelMessages')}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>
          )}
        </>
      )}

      {items.map((item) => {
        const cfg = channelConfig[item.channelType] || channelConfig.webchat;
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
            onClick={() => onItemClick ? onItemClick(item) : item.conversationId && navigate(`/conversations/${item.conversationId}`)}
          >
            {/* Platform icon + sender avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                {item.senderAvatar ? (
                  <img src={item.senderAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">
                    {item.senderName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Platform badge */}
              <PlatformBadge channel={item.channelType} className="absolute -bottom-0.5 -right-0.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.senderName}
                  </h3>
                  <span
                    className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                  >
                    {t(`myAgent.channel.${item.channelType}`)}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatInboxTime(item.timestamp)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {item.preview}
              </p>
            </div>

            {/* Unread badge */}
            {item.unreadCount > 0 && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
