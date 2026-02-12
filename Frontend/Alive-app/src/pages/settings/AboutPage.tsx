import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, SettingsDialog } from '@/components'

export function AboutPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const menuItems = [
    { icon: 'description', labelKey: 'about.termsOfService', dialogKey: 'terms' },
    { icon: 'privacy_tip', labelKey: 'about.privacyPolicy', dialogKey: 'privacy' },
    { icon: 'gavel', labelKey: 'about.communityGuidelines', route: '/community-guidelines' },
    { icon: 'update', labelKey: 'about.checkForUpdates', dialogKey: 'update' },
  ]

  const handleClick = (item: typeof menuItems[number]) => {
    if ('route' in item && item.route) {
      navigate(item.route)
    } else if ('dialogKey' in item && item.dialogKey) {
      setActiveDialog(item.dialogKey)
    }
  }

  const close = () => setActiveDialog(null)

  const termsList = t('about.termsList', { returnObjects: true }) as string[]
  const privacyList = t('about.privacyList', { returnObjects: true }) as string[]

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('about.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        {/* Logo & version */}
        <div className="flex flex-col items-center md:items-start py-10 md:py-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">ALIVE</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('about.version', { version: '1.0.0' })}</p>
        </div>

        {/* Menu */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleClick(item)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors ${
                index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
              }`}
            >
              <Icon name={item.icon} size={22} className="text-gray-500 dark:text-gray-400" />
              <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">
                {t(item.labelKey)}
              </span>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center md:text-left py-8 text-xs text-gray-400 dark:text-gray-500">
          <p>{t('about.tagline')}</p>
          <p className="mt-1">{t('about.subtitle')}</p>
          <p className="mt-4">{t('about.copyright', { year: '2025' })}</p>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <SettingsDialog open={activeDialog === 'terms'} onClose={close} title={t('about.termsOfService')} icon="description">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="font-medium text-gray-800 dark:text-gray-100">{t('about.termsTitle')}</p>
          <p>{t('about.termsAgree')}</p>
          <ul className="space-y-2 list-disc pl-4">
            {termsList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">{t('about.lastUpdated')}</p>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'privacy'} onClose={close} title={t('about.privacyPolicy')} icon="privacy_tip">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="font-medium text-gray-800 dark:text-gray-100">{t('about.privacyTitle')}</p>
          <p>{t('about.privacyDesc')}</p>
          <ul className="space-y-2 list-disc pl-4">
            {privacyList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p>{t('about.privacyNoSell')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">{t('about.lastUpdated')}</p>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'update'} onClose={close} title={t('about.checkForUpdates')} icon="update">
        <div className="py-4 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon name="check_circle" size={36} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('about.upToDate')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('about.latestVersion', { version: '1.0.0' })}</p>
        </div>
      </SettingsDialog>
    </Layout>
  )
}
