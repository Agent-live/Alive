import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, Toggle } from '@/components'

export function MinorModePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isEnabled, setIsEnabled] = useState(false)
  const [timeLimit, setTimeLimit] = useState(40) // minutes

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">{t('settingsMinorMode.title')}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* Mode description */}
          <div className="mx-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Icon name="child_care" size={24} className="text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{t('settingsMinorMode.protectMinors')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('settingsMinorMode.protectMinorsDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Enable toggle */}
          <div className="mx-4 mb-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-4">
                  <Icon name="shield" size={22} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">{t('settingsMinorMode.enableMinorMode')}</span>
                </div>
                <Toggle checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} />
              </div>
            </div>
          </div>

          {/* Time limit */}
          {isEnabled && (
            <div className="mx-4 mb-3">
              <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsMinorMode.dailyUsageTime')}</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">{t('settingsMinorMode.timeLimit')}</span>
                  <span className="text-lg font-bold text-primary">{t('settingsMinorMode.minutes', { count: timeLimit })}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={10}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
                  <span>{t('settingsMinorMode.minMinutes')}</span>
                  <span>{t('settingsMinorMode.maxMinutes')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Restrictions */}
          {isEnabled && (
            <div className="mx-4 mb-3">
              <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsMinorMode.restrictions')}</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                {[
                  { icon: 'timer', textKey: 'settingsMinorMode.dailyTimeLimit' },
                  { icon: 'nightlight', textKey: 'settingsMinorMode.nightRestriction' },
                  { icon: 'visibility_off', textKey: 'settingsMinorMode.contentFilter' },
                  { icon: 'money_off', textKey: 'settingsMinorMode.disableSpending' },
                  { icon: 'search_off', textKey: 'settingsMinorMode.limitSearch' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 px-4 py-3 ${
                      index < 4 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                    }`}
                  >
                    <Icon name={item.icon} size={20} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t(item.textKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Set password */}
          {isEnabled && (
            <div className="mx-4 mt-6">
              <button className="w-full py-3.5 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform">
                {t('settingsMinorMode.setGuardianPassword')}
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                {t('settingsMinorMode.guardianPasswordHint')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
