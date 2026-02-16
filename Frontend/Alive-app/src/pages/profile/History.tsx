import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout, Header } from '@/components/common';
import { TimeTransactionItem } from '@/components/time';
import { useTimerStore } from '@/store';

export function HistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { transactions, fetchTransactions } = useTimerStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <Layout showTabBar={false}>
      <Header title={t('history.title')} showBack onBack={() => navigate(-1)} />

      <div className="px-4 py-3">
        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {transactions.map((tx) => (
              <TimeTransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('history.noTransactions')}</p>
            <p className="text-sm text-gray-300 mt-1">
              {t('history.noTransactionsSubtitle')}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
