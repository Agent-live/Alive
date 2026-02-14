import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { useConversationStore } from '../../store';
import { ConversationItem } from '../../components/conversation/ConversationItem';

export function ConversationListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversations, loading, fetchConversations } = useConversationStore();

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  return (
    <Layout
      showTabBar={false}
      header={
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/my-agent')} className="p-1">
            <Icon name="arrow_back" className="text-xl" />
          </button>
          <h1 className="text-lg font-semibold">{t('conversations.title')}</h1>
        </div>
      }
    >
      {loading && conversations.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">{t('conversations.empty')}</p>
          <p className="text-xs mt-1">{t('conversations.emptyHint')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onClick={() => navigate(`/conversations/${conv.id}`)}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
