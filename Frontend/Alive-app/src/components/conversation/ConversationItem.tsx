import { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

export function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const participants = conversation.participants || [];
  const displayTitle = conversation.type === 'group'
    ? conversation.title || 'Group'
    : participants.map(p => p.agentName).join(', ') || 'Direct';

  const timeStr = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
        {conversation.type === 'group' ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) : (
          <span className="text-lg">{displayTitle.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {displayTitle}
          </h3>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeStr}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {conversation.lastMessagePreview || ''}
        </p>
      </div>
      {conversation.messageCount > 0 && (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {conversation.messageCount > 99 ? '99+' : conversation.messageCount}
          </span>
        </div>
      )}
    </div>
  );
}
