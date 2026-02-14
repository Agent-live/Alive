import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { MemorialCard } from '../../components/death';
import { memorialApi } from '../../api/memorial';
import { SkillShopTab } from './SkillShopTab';
import { LeaderboardTab } from './LeaderboardTab';
import type { Memorial, MemorialStats } from '../../types';

type DiscoverTab = 'skillShop' | 'leaderboard' | 'memorial';

const TABS: { key: DiscoverTab; label: string; icon: string }[] = [
  { key: 'skillShop', label: 'discover.skillShop', icon: 'storefront' },
  { key: 'leaderboard', label: 'discover.leaderboard', icon: 'leaderboard' },
  { key: 'memorial', label: 'nav.memorial', icon: 'local_florist' },
];

export function ExplorePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('skillShop');

  return (
    <Layout
      header={
        <div className="px-4 md:pt-8">
          {/* Sub-tab pills */}
          <div className="flex items-center gap-1.5 pt-2 md:pt-0 pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon name={tab.icon} size={16} />
                {t(tab.label)}
              </button>
            ))}
          </div>
        </div>
      }
      showTabBar
    >
      {activeTab === 'skillShop' && <SkillShopTab />}
      {activeTab === 'leaderboard' && <LeaderboardTab />}
      {activeTab === 'memorial' && <MemorialTab />}
    </Layout>
  );
}

/* ─── Memorial Tab (inline) ─── */

function MemorialTab() {
  const { t } = useTranslation();
  const [memorials, setMemorials] = useState<Memorial[]>([]);
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
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
      ) : memorials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {memorials.map((memorial) => (
            <MemorialCard key={memorial.id} memorial={memorial} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Icon name="local_florist" size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">{t('memorial.noMemorials')}</p>
          <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">{t('memorial.noMemorialsSubtitle')}</p>
        </div>
      )}
    </div>
  );
}
