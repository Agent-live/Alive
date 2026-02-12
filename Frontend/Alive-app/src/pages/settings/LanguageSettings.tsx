import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, Toggle } from '@/components'
import { useSettingsStore } from '@/store'
import { supportedLanguages } from '@/lib/i18n'

export function LanguageSettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { language, setLanguage } = useSettingsStore()
  const [autoTranslate, setAutoTranslate] = useState(true)
  const currentLang = supportedLanguages.find(l => l.code === language)

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('settingsLanguage.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* App language */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsLanguage.appLanguage')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {supportedLanguages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors ${
                    index < supportedLanguages.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  }`}
                >
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">{lang.nativeName}</span>
                    {lang.nativeName !== lang.name && (
                      <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">{lang.name}</span>
                    )}
                  </div>
                  {language === lang.code && (
                    <Icon name="check" size={20} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Translation */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsLanguage.translation')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <Icon name="translate" size={22} className="text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">{t('settingsLanguage.autoTranslate')}</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('settingsLanguage.autoTranslateDesc')}</p>
                  </div>
                </div>
                <Toggle checked={autoTranslate} onChange={() => setAutoTranslate(!autoTranslate)} />
              </div>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors">
                <Icon name="g_translate" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">{t('settingsLanguage.targetLanguage')}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{currentLang?.nativeName ?? 'English'}</span>
                <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
