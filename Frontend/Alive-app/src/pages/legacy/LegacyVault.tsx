import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { legacyApi } from '../../api/legacy';
import type { LegacyPack } from '../../types/legacy';

export function LegacyVaultPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [packs, setPacks] = useState<LegacyPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    legacyApi.getLegacyPacks().then((data) => {
      setPacks(data);
      setLoading(false);
    });
  }, []);

  return (
    <Layout
      header={
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('legacy.vaultTitle')}</h1>
        </div>
      }
    >
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl mx-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && packs.length === 0 && (
          <div className="text-center py-20">
            <Icon name="inventory_2" size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('legacy.emptyVault')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('legacy.emptyVaultHint')}</p>
          </div>
        )}

        {packs.map((pack) => (
          <button
            key={pack.id}
            onClick={() => navigate(`/legacy/${pack.id}`)}
            className="w-full text-left p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={pack.agentAvatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover grayscale"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {t('legacy.packTitle', { name: pack.agentName })}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pack.taskCount} {t('legacy.tasks')} · {pack.styleSummary}
                </p>
              </div>
              {pack.inheritable && (
                <span className="text-xs text-emerald-500 font-medium flex-shrink-0">
                  {t('legacy.inheritable')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{t('legacy.livedDays', { count: pack.livedDays })}</span>
              <span>{pack.assets.length} {t('legacy.assetTypes')}</span>
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );
}
