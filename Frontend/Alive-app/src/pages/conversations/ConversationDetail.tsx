import { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { useConversationStore } from '../../store';
import { ChatBubble } from '../../components/conversation/ChatBubble';
import { ObserverBar } from '../../components/conversation/ObserverBar';

export function ConversationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    activeConversation, messages, messagesLoading,
    hasMoreMessages, selectConversation, loadMoreMessages, refreshMessages
  } = useConversationStore();

  useEffect(() => {
    if (id) {
      selectConversation(id);
    }
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
    if (hasMoreMessages && !messagesLoading) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, messagesLoading, loadMoreMessages]);

  const title = activeConversation?.type === 'group'
    ? activeConversation.title || t('conversations.group')
    : activeConversation?.participants?.map(p => p.agentName).join(', ') || t('conversations.direct');

  // Messages come newest-first from API, reverse for display.
  const displayMessages = [...messages].reverse();

  return (
    <Layout
      showTabBar={false}
      header={
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/conversations')} className="p-1">
            <Icon name="arrow_back" className="text-xl" />
          </button>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      }
    >
      <div className="flex flex-col min-h-full">
        <div className="flex-1 px-4 py-2">
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
                <ChatBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
        <ObserverBar />
      </div>
    </Layout>
  );
}
