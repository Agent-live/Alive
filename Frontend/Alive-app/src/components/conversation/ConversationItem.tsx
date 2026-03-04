import { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  myAgentId?: string;
  onClick: () => void;
}

export function ConversationItem({ conversation, myAgentId, onClick }: ConversationItemProps) {
  const participants = conversation.participants || [];
  const displayParticipants = conversation.type === 'direct' && myAgentId
    ? participants.filter((p) => p.agentId !== myAgentId)
    : participants;
  const displayTitle = conversation.type === 'group'
    ? conversation.title || 'Group'
    : displayParticipants.map((p) => p.agentName).join(', ') || 'Direct';

  const timeStr = conversation.lastMessageAt
    ? formatConvTime(conversation.lastMessageAt)
    : '';

  const unread = conversation.unreadCount || 0;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12">
        {displayParticipants.length <= 1 ? (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            {displayParticipants[0]?.agentAvatar ? (
              <img src={displayParticipants[0].agentAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{displayTitle.charAt(0)}</span>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 grid grid-cols-2 gap-px p-px overflow-hidden">
            {displayParticipants.slice(0, 4).map((p, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {p.agentAvatar ? (
                  <img src={p.agentAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-[10px] font-bold">{p.agentName.charAt(0)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {displayTitle}
          </h3>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{timeStr}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {conversation.lastMessagePreview || ''}
        </p>
      </div>

      {/* Unread badge — only show when there are actual unread messages */}
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

function formatConvTime(dateStr: string): string {
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
