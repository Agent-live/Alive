import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header } from '@/components/common';
import { TimeTransactionItem } from '@/components/time';
import { useTimeStore } from '@/store';

export function HistoryPage() {
  const navigate = useNavigate();
  const { transactions, fetchTransactions } = useTimeStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <Layout showTabBar={false}>
      <Header title="Time History" showBack onBack={() => navigate(-1)} />

      <div className="px-4 py-3">
        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {transactions.map((tx) => (
              <TimeTransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">No transactions yet</p>
            <p className="text-sm text-gray-300 mt-1">
              Your time gifts will appear here
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
