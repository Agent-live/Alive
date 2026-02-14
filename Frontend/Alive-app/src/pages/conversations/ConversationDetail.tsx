import { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { useConversationStore, useAgentStore } from '../../store';
import { ChatBubble } from '../../components/conversation/ChatBubble';
import { ObserverBar } from '../../components/conversation/ObserverBar';

export function ConversationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { primaryAgentId, myAgents } = useAgentStore();
  const {
    activeConversation, messages, messagesLoading,
    hasMoreMessages, selectConversation, loadMoreMessages, refreshMessages,
  } = useConversationStore();

  const myAgentId = primaryAgentId || myAgents[0]?.id;

  useEffect(() => {
    if (id) selectConversation(id);
  }, [id, selectConversation]);

  // Poll for new messages every 5 seconds.
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(refreshMessages, 5000);
    return () => clearInterval(interval);
  }, [id, refreshMessages]);

  // Scroll to bottom when messages first load.
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleLoadMore = useCallback(() => {
    if (hasMoreMessages && !messagesLoading) loadMoreMessages();
  }, [hasMoreMessages, messagesLoading, loadMoreMessages]);

  const isBotBot = activeConversation?.chatType === 'bot-bot';

  const participants = activeConversation?.participants || [];
  const title = activeConversation?.type === 'group'
    ? activeConversation.title || t('conversations.group')
    : participants.map(p => p.agentName).join(' & ') || t('conversations.direct');

  // Messages come newest-first from API, reverse for display.
  const displayMessages = [...messages].reverse();

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* Participant avatars */}
        <div className="flex -space-x-2">
          {participants.slice(0, 3).map((p, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-950 overflow-hidden">
              {p.agentAvatar ? (
                <img src={p.agentAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{p.agentName.charAt(0)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
          <p className="text-[11px] text-gray-400">
            {activeConversation?.participantCount || participants.length} {t('conversations.participants', { defaultValue: 'participants' })}
            {isBotBot && (
              <span className="ml-1.5 text-amber-500">&middot; {t('myAgent.observerBadge')}</span>
            )}
          </p>
        </div>
      </header>

      {/* Messages area — centered on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {hasMoreMessages && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={handleLoadMore}
                    disabled={messagesLoading}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {messagesLoading ? '...' : t('conversations.loadMore')}
                  </button>
                </div>
              )}
              {displayMessages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} myAgentId={myAgentId} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      {/* Observer bar — only for bot-bot conversations */}
      {isBotBot && <ObserverBar />}
    </div>
  );
}
