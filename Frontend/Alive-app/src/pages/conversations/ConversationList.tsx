import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate('/my-agent')} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t('conversations.title')}
        </h1>
      </header>

      {/* Content — centered on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Icon name="forum" size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 mb-1">{t('conversations.empty')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[240px]">{t('conversations.emptyHint')}</p>
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
        </div>
      </div>
    </div>
  );
}
