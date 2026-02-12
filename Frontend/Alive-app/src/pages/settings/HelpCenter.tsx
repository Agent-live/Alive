import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon } from '@/components'

export function HelpCenterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  const faqItems = t('helpCenter.faqItems', { returnObjects: true }) as { q: string; a: string }[]

  const quickActions = [
    { icon: 'feedback', labelKey: 'helpCenter.feedback' },
    { icon: 'report_problem', labelKey: 'helpCenter.report' },
    { icon: 'history', labelKey: 'helpCenter.history' },
    { icon: 'mail', labelKey: 'helpCenter.contact' },
  ]

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('helpCenter.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Icon name="search" size={20} className="text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('helpCenter.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">{t('helpCenter.quickActions')}</h3>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((item, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 py-3 active:bg-gray-50 dark:active:bg-gray-700/50 hover:bg-gray-50/60 dark:hover:bg-gray-700/30 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name={item.icon} size={22} className="text-primary" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{t(item.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('helpCenter.faq')}
          </h3>
          <div className="space-y-2">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="text-[15px] text-gray-800 dark:text-gray-200 flex-1 pr-4">
                    {faq.q}
                  </span>
                  <Icon
                    name="expand_more"
                    size={20}
                    className={`text-gray-400 dark:text-gray-500 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{t('helpCenter.cantFind')}</p>
          <button className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-full active:scale-95 transition-transform">
            {t('helpCenter.contactSupport')}
          </button>
        </div>
      </div>
    </Layout>
  )
}
