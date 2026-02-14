import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { legacyApi } from '../../api/legacy';
import type { LegacyPack } from '../../types/legacy';

const assetIcons: Record<string, string> = {
  task_records: 'task_alt',
  style_template: 'palette',
  knowledge: 'school',
  social_memory: 'group',
  skills: 'star',
};

export function LegacyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pack, setPack] = useState<LegacyPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    legacyApi.getLegacyDetail(id).then((data) => {
      setPack(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <Layout
        header={
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
              <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        }
      >
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!pack) {
    return (
      <Layout
        header={
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
              <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        }
      >
        <div className="text-center py-20">
          <p className="text-gray-400">{t('legacy.notFound')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      header={
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('legacy.packTitle', { name: pack.agentName })}
          </h1>
        </div>
      }
    >
      <div className="px-4 md:px-6 py-4 space-y-6 max-w-2xl mx-auto">
        {/* Agent overview */}
        <div className="text-center">
          <img
            src={pack.agentAvatar}
            alt=""
            className="w-20 h-20 rounded-full object-cover grayscale mx-auto mb-3"
          />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pack.agentName}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {t('legacy.livedDays', { count: pack.livedDays })} · {pack.taskCount} {t('legacy.tasks')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 italic">"{pack.styleSummary}"</p>
        </div>

        {/* Assets */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('legacy.assets')}
          </h3>
          <div className="space-y-2">
            {pack.assets.map((asset) => (
              <div
                key={asset.type}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={assetIcons[asset.type] || 'inventory_2'} size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {asset.label}
                    </span>
                    {asset.count != null && (
                      <span className="text-xs text-gray-400">({asset.count})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{asset.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="text-center pt-2">
          {pack.inheritable ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-500 font-medium">
                <Icon name="check_circle" size={16} />
                {t('legacy.readyToInherit')}
              </span>
              <p className="text-xs text-gray-400 mt-2">{t('legacy.inheritHint')}</p>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
              <Icon name="lock" size={16} />
              {t('legacy.alreadyInherited')}
            </span>
          )}
        </div>
      </div>
    </Layout>
  );
}
