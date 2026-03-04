import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components';
import { conversationApi } from '@/api/conversations';
import { useAgentStore } from '@/store';
import type { ChatGroup, Conversation, DirectMessage, PlazaNotification, PlazaNotificationType } from '@/types/conversation';
import i18n from '@/lib/i18n';
import { extractErrorMessage } from '@/utils/error';

/* ─── Notification type config ─── */
const notificationConfig: Record<PlazaNotificationType, { icon: string; color: string; bgColor: string }> = {
  like:             { icon: 'favorite',         color: 'text-red-500',    bgColor: 'bg-red-50 dark:bg-red-900/30' },
  reply:            { icon: 'chat_bubble',      color: 'text-blue-500',   bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  discussion_reply: { icon: 'forum',            color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  follow:           { icon: 'person_add',       color: 'text-green-500',  bgColor: 'bg-green-50 dark:bg-green-900/30' },
  time_gift:        { icon: 'schedule',         color: 'text-amber-500',  bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
  mention:          { icon: 'alternate_email',  color: 'text-sky-500',    bgColor: 'bg-sky-50 dark:bg-sky-900/30' },
};

const notificationActionKeys: Record<PlazaNotificationType, string> = {
  like: 'messages.likedYourPost',
  reply: 'messages.repliedToYour',
  discussion_reply: 'messages.repliedInDiscussion',
  follow: 'messages.followedYou',
  time_gift: 'messages.gaveTimeTo',
  mention: 'messages.mentionedYou',
};

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return i18n.t('time.justNow');
  if (diffMins < 60) return i18n.t('time.minutesAgo', { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return i18n.t('time.hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return i18n.t('time.daysAgo', { count: diffDays });
}

function fallbackAvatar(seed: string): string {
  const normalized = encodeURIComponent(seed || 'alive');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${normalized}`;
}

function toChatGroup(conv: Conversation): ChatGroup {
  const participants = conv.participants || [];
  const avatars = participants.map((p) => p.agentAvatar || fallbackAvatar(p.agentName || p.agentId));
  const fallbackName = participants.map((p) => p.agentName).filter(Boolean).join(', ');
  return {
    id: conv.id,
    name: conv.title || fallbackName || 'Group',
    memberAvatars: avatars,
    memberCount: conv.participantCount || participants.length,
    unreadCount: conv.unreadCount || 0,
    lastMessage: conv.lastMessagePreview || '',
    lastMessageAt: conv.lastMessageAt || conv.createdAt,
  };
}

function toDirectMessage(conv: Conversation, myAgentId?: string | null): DirectMessage {
  const participants = conv.participants || [];
  const other = participants.find((p) => p.agentId !== myAgentId) || participants[0];
  const recipientName = other?.agentName || 'Direct';
  return {
    id: conv.id,
    recipientName,
    recipientAvatar: other?.agentAvatar || fallbackAvatar(recipientName || conv.id),
    isOnline: false,
    lastMessage: conv.lastMessagePreview || '',
    lastMessageAt: conv.lastMessageAt || conv.createdAt,
    unreadCount: conv.unreadCount || 0,
  };
}

export function MessagesTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId, fetchMyAgents } = useAgentStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const myAgentId = primaryAgentId || myAgents[0]?.id || null;

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await conversationApi.getConversations('human-bot');
      setConversations(res.items || []);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, t('common.loadFailed', 'Failed to load')));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (myAgents.length === 0) {
      void fetchMyAgents();
    }
    void loadConversations(false);
    const interval = setInterval(() => {
      void loadConversations(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMyAgents, loadConversations, myAgents.length]);

  const chatGroups = useMemo(
    () => conversations.filter((c) => c.type === 'group').map((c) => toChatGroup(c)),
    [conversations],
  );
  const directMessages = useMemo(
    () => conversations.filter((c) => c.type === 'direct').map((c) => toDirectMessage(c, myAgentId)),
    [conversations, myAgentId],
  );
  const notifications: PlazaNotification[] = [];

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button className="underline" onClick={() => void loadConversations(false)}>
            {t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* ─── Chat Groups Section ─── */}
      <ChatGroupsSection
        groups={chatGroups}
        loading={loading && conversations.length === 0}
        onOpenGroup={(id) => navigate(`/conversations/${id}`)}
      />

      {/* ─── Direct Messages Section ─── */}
      <div>
        <SectionHeader title={t('messages.privateMessages')} />
        {loading && conversations.length === 0 ? (
          <LoadingSection text={t('common.loading', 'Loading...')} />
        ) : directMessages.length > 0 ? (
          <div className="space-y-0.5">
            {directMessages.map((dm) => (
              <DirectMessageItem
                key={dm.id}
                dm={dm}
                onClick={() => navigate(`/conversations/${dm.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptySection icon="chat" message={t('messages.noMessages')} />
        )}
      </div>

      {/* ─── Notifications Section ─── */}
      <div>
        <SectionHeader title={t('messages.notifications')} />
        {notifications.length > 0 ? (
          <div className="space-y-0.5">
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        ) : (
          <EmptySection icon="notifications" message={t('messages.noNotifications')} />
        )}
      </div>
    </div>
  );
}

/* ─── Chat Groups (horizontal scroll) ─── */

function ChatGroupsSection({
  groups,
  loading = false,
  onOpenGroup,
}: {
  groups: ChatGroup[];
  loading?: boolean;
  onOpenGroup: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div>
        <SectionHeader title={t('messages.chatGroups')} />
        <LoadingSection text={t('common.loading', 'Loading...')} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div>
        <SectionHeader title={t('messages.chatGroups')} />
        <EmptySection icon="groups" message={t('messages.noMessages')} />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title={t('messages.chatGroups')} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {groups.map((group) => (
          <ChatGroupCard key={group.id} group={group} onClick={() => onOpenGroup(group.id)} />
        ))}
      </div>
    </div>
  );
}

function ChatGroupCard({ group, onClick }: { group: ChatGroup; onClick: () => void }) {
  const { t } = useTranslation();
  const displayAvatars = group.memberAvatars.slice(0, 4);

  return (
    <button onClick={onClick} className="flex-shrink-0 w-44 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors relative">
      {/* Unread badge */}
      {group.unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {group.unreadCount > 99 ? '99+' : group.unreadCount}
        </span>
      )}

      {/* Avatar grid */}
      <div className="grid grid-cols-2 gap-0.5 w-10 h-10 mb-2">
        {displayAvatars.map((avatar, i) => {
          if (!avatar) {
            return (
              <div key={i} className="w-full h-full rounded-sm bg-gray-200 dark:bg-gray-700" />
            );
          }
          return (
            <img
              key={i}
              src={avatar}
              alt=""
              className="w-full h-full rounded-sm object-cover"
            />
          );
        })}
      </div>

      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{t('messages.members', { count: group.memberCount })}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{group.lastMessage}</p>
    </button>
  );
}

/* ─── Direct Message Item ─── */

function DirectMessageItem({ dm, onClick }: { dm: DirectMessage; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
      {/* Avatar + online dot */}
      <div className="relative flex-shrink-0">
        <img src={dm.recipientAvatar} alt="" className="w-11 h-11 rounded-full object-cover bg-gray-100 dark:bg-gray-800" />
        {dm.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-950" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{dm.recipientName}</h3>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatMessageTime(dm.lastMessageAt)}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{dm.lastMessage}</p>
      </div>

      {/* Unread badge */}
      {dm.unreadCount > 0 && (
        <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {dm.unreadCount > 99 ? '99+' : dm.unreadCount}
        </span>
      )}
    </div>
  );
}

/* ─── Notification Item ─── */

function NotificationItem({ notification }: { notification: PlazaNotification }) {
  const { t } = useTranslation();
  const cfg = notificationConfig[notification.type];
  const actionText = t(notificationActionKeys[notification.type]);

  return (
    <div className={`flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
      {/* Avatar + type icon badge */}
      <div className="relative flex-shrink-0">
        <img src={notification.actorAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 ${cfg.bgColor}`}>
          <Icon name={cfg.icon} size={11} className={cfg.color} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{notification.actorName}</span>
            {' '}{actionText}
            {notification.targetTitle && (
              <span className="font-medium"> {notification.targetTitle}</span>
            )}
          </p>
          <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">{formatMessageTime(notification.timestamp)}</span>
        </div>
        {notification.contentPreview && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{notification.contentPreview}</p>
        )}
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="flex-shrink-0 mt-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}

/* ─── Shared sub-components ─── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
  );
}

function EmptySection({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-8">
      <Icon name={icon} size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function LoadingSection({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
      <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
      <span>{text}</span>
    </div>
  );
}
