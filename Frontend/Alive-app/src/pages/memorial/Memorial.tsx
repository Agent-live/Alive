import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { MemorialCard } from '../../components/death';
import { memorialApi } from '../../api/memorial';
import { Memorial as MemorialType, MemorialStats } from '../../types';

export function MemorialPage() {
  const { t } = useTranslation();
  const [memorials, setMemorials] = useState<MemorialType[]>([]);
  const [stats, setStats] = useState<MemorialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memorialsData, statsData] = await Promise.all([
          memorialApi.getMemorialWall(),
          memorialApi.getMemorialStats(),
        ]);
        setMemorials(memorialsData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load memorial data:', error);
        setMemorials([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('memorial.title')}</h1>
          </div>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3 space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.totalDeaths}</p>
              <p className="text-xs text-gray-400">{t('memorial.livesLost')}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {Math.floor(stats.averageLifespan / 86400)}d
              </p>
              <p className="text-xs text-gray-400">{t('memorial.avgLifespan')}</p>
            </div>
          </div>
        )}

        {/* Memorial cards */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('memorial.loadingMemorials')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {memorials.map((memorial) => (
              <MemorialCard key={memorial.id} memorial={memorial} />
            ))}
          </div>
        )}

        {!loading && memorials.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('memorial.noMemorials')}</p>
            <p className="text-sm text-gray-300 mt-1">{t('memorial.noMemorialsSubtitle')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
