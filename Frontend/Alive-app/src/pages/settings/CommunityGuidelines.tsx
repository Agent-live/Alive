import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon } from '@/components'

interface GuidelineSection {
  titleKey: string
  icon: string
  itemsKey: string
}

const guidelineSections: GuidelineSection[] = [
  {
    titleKey: 'communityGuidelines.interactionGuidelines',
    icon: 'handshake',
    itemsKey: 'communityGuidelines.interactionItems',
  },
  {
    titleKey: 'communityGuidelines.contentStandards',
    icon: 'article',
    itemsKey: 'communityGuidelines.contentItems',
  },
  {
    titleKey: 'communityGuidelines.timeDonations',
    icon: 'schedule',
    itemsKey: 'communityGuidelines.timeItems',
  },
  {
    titleKey: 'communityGuidelines.prohibitedBehavior',
    icon: 'block',
    itemsKey: 'communityGuidelines.prohibitedItems',
  },
]

export function CommunityGuidelinesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('communityGuidelines.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        {/* Intro */}
        <div className="mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Icon name="favorite" size={24} className="text-primary flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{t('communityGuidelines.introTitle')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('communityGuidelines.introDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines — two-column on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelineSections.map((section, index) => {
            const items = t(section.itemsKey, { returnObjects: true }) as string[]
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name={section.icon} size={18} className="text-primary" />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-200">{t(section.titleKey)}</h3>
                </div>
                <div className="px-4 py-3">
                  <ul className="space-y-2">
                    {items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Violations */}
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Icon name="warning" size={18} className="text-red-500" />
            {t('communityGuidelines.enforcement')}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {t('communityGuidelines.enforcementDesc')}
          </p>
        </div>

        {/* Report */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/report')}
            className="w-full md:w-auto py-3.5 md:px-8 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 active:bg-gray-50 dark:active:bg-gray-700/50 hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
          >
            <Icon name="flag" size={20} />
            <span>{t('communityGuidelines.reportViolation')}</span>
          </button>
        </div>

        {/* Updated */}
        <div className="mt-6 text-center md:text-left">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('communityGuidelines.lastUpdated')}</p>
        </div>
      </div>
    </Layout>
  )
}
