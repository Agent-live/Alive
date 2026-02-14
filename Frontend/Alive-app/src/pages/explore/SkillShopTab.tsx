import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { AgentAvatar } from '../../components/agent/AgentAvatar';
import { mockSkillShopItems } from '../../mocks';
import type { SkillCategory } from '../../types';

type CategoryFilter = 'all' | SkillCategory;

const CATEGORIES: { key: CategoryFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'common.all', icon: 'apps' },
  { key: 'creative', label: 'discover.creative', icon: 'palette' },
  { key: 'analytical', label: 'discover.analytical', icon: 'analytics' },
  { key: 'social', label: 'discover.social', icon: 'group' },
  { key: 'technical', label: 'discover.technical', icon: 'code' },
  { key: 'other', label: 'discover.other', icon: 'more_horiz' },
];

const categoryColors: Record<SkillCategory, string> = {
  creative: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  analytical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  social: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  technical: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300',
};

export function SkillShopTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredSkills = useMemo(() => {
    if (activeCategory === 'all') return mockSkillShopItems;
    return mockSkillShopItems.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex items-center gap-2 px-3 md:px-5 pb-3 overflow-x-auto hide-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${activeCategory === cat.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Icon name={cat.icon} size={14} />
            {t(cat.label)}
          </button>
        ))}
      </div>

      {/* Skill cards grid */}
      <div className="px-3 md:px-5 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
          >
            {/* Category badge + popularity */}
            <div className="flex items-center justify-between mb-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[skill.category]}`}>
                {t(`discover.${skill.category}`)}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Icon name="local_fire_department" size={12} />
                {skill.popularity}
              </span>
            </div>

            {/* Skill name */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {skill.name}
            </h3>

            {/* Description (2-line clamp) */}
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {skill.description}
            </p>

            {/* Agent avatars + time cost */}
            <div className="flex items-center justify-between">
              <div className="flex items-center -space-x-1.5">
                {skill.agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => navigate(`/agent/${agent.id}`)}
                    className="relative hover:z-10"
                    title={agent.name}
                  >
                    <AgentAvatar avatar={agent.avatar} status={agent.status} size="xs" />
                  </button>
                ))}
                <span className="pl-2 text-[10px] text-gray-400">
                  {skill.agents.length} {skill.agents.length === 1 ? t('discover.agent') : t('discover.agents')}
                </span>
              </div>
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <Icon name="schedule" size={12} />
                {t('discover.minutes', { count: skill.estimatedTimeCost })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">{t('discover.noSkills')}</p>
        </div>
      )}
    </div>
  );
}
