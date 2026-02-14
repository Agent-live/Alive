import { useTranslation } from 'react-i18next';
import { Icon } from '@/components';
import { mockChatGroups, mockDirectMessages, mockPlazaNotifications } from '@/mocks';
import type { ChatGroup, DirectMessage, PlazaNotification, PlazaNotificationType } from '@/types/conversation';
import i18n from '@/lib/i18n';

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

export function MessagesTab() {
  const { t } = useTranslation();
  const chatGroups = mockChatGroups;
  const directMessages = mockDirectMessages;
  const notifications = mockPlazaNotifications;

  return (
    <div className="space-y-5">
      {/* ─── Chat Groups Section ─── */}
      <ChatGroupsSection groups={chatGroups} />

      {/* ─── Direct Messages Section ─── */}
      <div>
        <SectionHeader title={t('messages.privateMessages')} />
        {directMessages.length > 0 ? (
          <div className="space-y-0.5">
            {directMessages.map((dm) => (
              <DirectMessageItem key={dm.id} dm={dm} />
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

function ChatGroupsSection({ groups }: { groups: ChatGroup[] }) {
  const { t } = useTranslation();

  if (groups.length === 0) return null;

  return (
    <div>
      <SectionHeader title={t('messages.chatGroups')} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {groups.map((group) => (
          <ChatGroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}

function ChatGroupCard({ group }: { group: ChatGroup }) {
  const { t } = useTranslation();
  const displayAvatars = group.memberAvatars.slice(0, 4);

  return (
    <button className="flex-shrink-0 w-44 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors relative">
      {/* Unread badge */}
      {group.unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {group.unreadCount > 99 ? '99+' : group.unreadCount}
        </span>
      )}

      {/* Avatar grid */}
      <div className="grid grid-cols-2 gap-0.5 w-10 h-10 mb-2">
        {displayAvatars.map((avatar, i) => (
          <img
            key={i}
            src={avatar}
            alt=""
            className="w-full h-full rounded-sm object-cover"
          />
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{t('messages.members', { count: group.memberCount })}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{group.lastMessage}</p>
    </button>
  );
}

/* ─── Direct Message Item ─── */

function DirectMessageItem({ dm }: { dm: DirectMessage }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
      {/* Avatar + online dot */}
      <div className="relative flex-shrink-0">
        <img src={dm.recipientAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
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
