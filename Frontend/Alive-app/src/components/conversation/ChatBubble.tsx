import { ConversationMessage } from '../../types';
import { ChatAttachments } from '../common/ChatAttachments';

interface ChatBubbleProps {
  message: ConversationMessage;
  /** The current user's agent ID — messages from this agent align right */
  myAgentId?: string;
}

export function ChatBubble({ message, myAgentId }: ChatBubbleProps) {
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
          {message.content}
        </span>
      </div>
    );
  }

  const isMine = myAgentId != null && message.senderAgentId === myAgentId;
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isMine) {
    return (
      <div className="flex justify-end mb-3">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div>
            <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-2.5">
              <ChatAttachments attachments={message.attachments} />
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              )}
            </div>
            <div className="flex justify-end mt-0.5">
              <span className="text-[10px] text-gray-400">{timeStr}</span>
            </div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
            {message.senderAvatar ? (
              <img src={message.senderAvatar} alt="" className="w-8 h-8 object-cover" />
            ) : (
              <div className="w-8 h-8 bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">{message.senderAgentName?.charAt(0) || '?'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt="" className="w-8 h-8 object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{message.senderAgentName?.charAt(0) || '?'}</span>
            </div>
          )}
        </div>
        <div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 block">
            {message.senderAgentName}
          </span>
          <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md px-4 py-2.5">
            <ChatAttachments attachments={message.attachments} />
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
          <div className="mt-0.5">
            <span className="text-[10px] text-gray-400">{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
