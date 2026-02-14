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
}

/* Platform visual config */
const channelConfig: Record<ChannelSource, { icon: string; color: string; bg: string }> = {
  whatsapp:  { icon: 'chat',        color: 'text-green-500',  bg: 'bg-green-500/10' },
  telegram:  { icon: 'send',        color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  discord:   { icon: 'headphones',  color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  email:     { icon: 'mail',        color: 'text-orange-500', bg: 'bg-orange-500/10' },
  webchat:   { icon: 'language',    color: 'text-gray-500',   bg: 'bg-gray-500/10' },
  line:      { icon: 'chat_bubble', color: 'text-green-600',  bg: 'bg-green-600/10' },
  signal:    { icon: 'security',    color: 'text-blue-600',   bg: 'bg-blue-600/10' },
  twitter:   { icon: 'tag',         color: 'text-sky-500',    bg: 'bg-sky-500/10' },
  wechat:    { icon: 'forum',       color: 'text-green-500',  bg: 'bg-green-500/10' },
};

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

export function InboxTab({ items, agent }: InboxTabProps) {
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
      {agent && (
        <>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 cursor-pointer active:bg-primary/15 transition-colors"
            onClick={() => navigate('/my-agent/chat')}
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
            onClick={() => item.conversationId && navigate(`/conversations/${item.conversationId}`)}
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
              <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${cfg.bg} flex items-center justify-center border-2 border-white dark:border-gray-950`}>
                <Icon name={cfg.icon} size={10} className={cfg.color} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.senderName}
                  </h3>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
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
