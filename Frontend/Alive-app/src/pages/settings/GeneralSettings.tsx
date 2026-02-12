import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, Toggle } from '@/components'
import { useSettingsStore, fontSizeValues, FontSize } from '@/store'

export function GeneralSettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    isDarkMode,
    toggleDarkMode,
    statusThemeEnabled,
    setStatusThemeEnabled,
    fontSize,
    setFontSize,
    cacheSize,
    clearCache,
  } = useSettingsStore()

  const [showFontSizeSheet, setShowFontSizeSheet] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCache = async () => {
    setIsClearing(true)
    await clearCache()
    setIsClearing(false)
  }

  const fontSizeOptions: FontSize[] = ['small', 'standard', 'large', 'extraLarge']

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('settingsGeneral.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Display */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsGeneral.display')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {/* Dark mode */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <Icon name="dark_mode" size={22} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">{t('settingsGeneral.darkMode')}</span>
                </div>
                <Toggle checked={isDarkMode} onChange={toggleDarkMode} />
              </div>

              {/* Status theme */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <Icon name="palette" size={22} className="text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">{t('settingsGeneral.statusTheme')}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{t('settingsGeneral.statusThemeDesc')}</p>
                  </div>
                </div>
                <Toggle checked={statusThemeEnabled} onChange={() => setStatusThemeEnabled(!statusThemeEnabled)} />
              </div>

              {/* Font size */}
              <button
                onClick={() => setShowFontSizeSheet(true)}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors"
              >
                <Icon name="text_fields" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">{t('settingsGeneral.fontSize')}</span>
                <span className="text-sm text-gray-400 mr-1">{t(fontSizeValues[fontSize].labelKey)}</span>
                <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Other */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsGeneral.other')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors disabled:opacity-60"
              >
                <Icon name="cleaning_services" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">{t('settingsGeneral.clearCache')}</span>
                {isClearing ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-sm text-gray-400 mr-1">
                      {cacheSize > 0 ? `${cacheSize.toFixed(1)} MB` : t('settingsGeneral.cleared')}
                    </span>
                    <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Font preview — full width */}
          <div className="md:col-span-2 mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settingsGeneral.fontPreview')}</h4>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('settingsGeneral.fontPreviewText')}
            </p>
          </div>
        </div>
      </div>

      {/* Font size bottom sheet */}
      {showFontSizeSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={() => setShowFontSizeSheet(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-[101] max-w-lg mx-auto animate-slide-up">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settingsGeneral.fontSize')}</h3>
                <button onClick={() => setShowFontSizeSheet(false)}>
                  <Icon name="close" size={24} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 pb-safe">
              <div className="space-y-2 mb-6">
                {fontSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setFontSize(size)
                      setShowFontSizeSheet(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors ${
                      fontSize === size
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <span
                      className={`text-gray-800 dark:text-gray-200 ${
                        fontSize === size ? 'font-medium' : ''
                      }`}
                      style={{ fontSize: `${fontSizeValues[size].scale * 15}px` }}
                    >
                      {t(fontSizeValues[size].labelKey)}
                    </span>
                    {fontSize === size && (
                      <Icon name="check" size={20} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {t('settingsGeneral.previewText')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .pb-safe {
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </Layout>
  )
}
