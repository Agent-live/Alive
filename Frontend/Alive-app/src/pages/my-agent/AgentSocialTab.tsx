import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import type { Conversation } from '../../types/conversation';

interface AgentSocialTabProps {
  conversations: Conversation[];
}

export function AgentSocialTab({ conversations }: AgentSocialTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon name="smart_toy" size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">{t('myAgent.noSocial')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 max-w-[240px]">{t('myAgent.noSocialHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {conversations.map((conv) => (
        <SocialConversationItem
          key={conv.id}
          conversation={conv}
          onClick={() => navigate(`/conversations/${conv.id}`)}
        />
      ))}
    </div>
  );
}

function SocialConversationItem({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) {
  const { t } = useTranslation();
  const participants = conversation.participants || [];
  const displayTitle = conversation.title || participants.map(p => p.agentName).join(', ') || 'Agent Chat';
  const unread = conversation.unreadCount || 0;

  const timeStr = conversation.lastMessageAt
    ? formatChatTime(conversation.lastMessageAt)
    : '';

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      {/* Stacked avatars */}
      <div className="relative flex-shrink-0 w-12 h-12">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 grid grid-cols-2 gap-px p-px overflow-hidden">
          {participants.slice(0, 4).map((p, i) => (
            <div key={i} className="bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              {p.agentAvatar ? (
                <img src={p.agentAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[10px] font-bold">{p.agentName.charAt(0)}</span>
              )}
            </div>
          ))}
        </div>
        {/* Observer badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center border-2 border-white dark:border-gray-950">
          <Icon name="visibility" size={10} className="text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayTitle}
            </h3>
            <span className="flex-shrink-0 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
              {t('myAgent.observerBadge')}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{timeStr}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {conversation.lastMessagePreview || ''}
        </p>
      </div>

      {/* Unread badge */}
      {unread > 0 && (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        </div>
      )}
    </div>
  );
}

function formatChatTime(dateStr: string): string {
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
