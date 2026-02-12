import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, Toggle, SettingsDialog } from '@/components'

export function PrivacySettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [privacy, setPrivacy] = useState({
    showOnline: true,
    showLikes: true,
    showFollowing: true,
    allowMessage: true,
    allowComment: true,
  })

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderToggleItem = (
    icon: string,
    label: string,
    key: keyof typeof privacy,
    description?: string,
    showBorder = true
  ) => (
    <div className={`flex items-center justify-between px-4 py-3.5 ${showBorder ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}`}>
      <div className="flex items-center gap-4 flex-1">
        <Icon name={icon} size={22} className="text-gray-500 dark:text-gray-400" />
        <div className="flex-1">
          <span className="text-[15px] text-gray-800 dark:text-gray-200">{label}</span>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <Toggle checked={privacy[key]} onChange={() => togglePrivacy(key)} />
    </div>
  )

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('settingsPrivacy.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Visibility */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsPrivacy.visibility')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('visibility', t('settingsPrivacy.showOnline'), 'showOnline', t('settingsPrivacy.showOnlineDesc'))}
              {renderToggleItem('favorite', t('settingsPrivacy.showLikes'), 'showLikes', t('settingsPrivacy.showLikesDesc'))}
              {renderToggleItem('group', t('settingsPrivacy.showFollowing'), 'showFollowing', t('settingsPrivacy.showFollowingDesc'), false)}
            </div>
          </div>

          {/* Interaction Permissions */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsPrivacy.interactions')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('mail', t('settingsPrivacy.allowMessages'), 'allowMessage', t('settingsPrivacy.allowMessagesDesc'))}
              {renderToggleItem('comment', t('settingsPrivacy.allowComments'), 'allowComment', t('settingsPrivacy.allowCommentsDesc'), false)}
            </div>
          </div>

          {/* Other */}
          <div className="md:col-span-2">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{t('settingsPrivacy.other')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveDialog('blocked')}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50"
              >
                <Icon name="block" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">{t('settingsPrivacy.blockedUsers')}</span>
                <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
              </button>
              <button
                onClick={() => setActiveDialog('data')}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors"
              >
                <Icon name="download" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">{t('settingsPrivacy.downloadMyData')}</span>
                <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SettingsDialog open={activeDialog === 'blocked'} onClose={() => setActiveDialog(null)} title={t('settingsPrivacy.blockedUsers')} icon="block">
        <div className="py-6 text-center">
          <Icon name="check_circle" size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('settingsPrivacy.noBlockedUsers')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('settingsPrivacy.blockedUsersDesc')}</p>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'data'} onClose={() => setActiveDialog(null)} title={t('settingsPrivacy.downloadMyData')} icon="download">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('settingsPrivacy.downloadDataDesc')}
          </p>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Icon name="schedule" size={14} />
              <span>{t('settingsPrivacy.processingTime')}</span>
            </div>
          </div>
          <button className="w-full h-11 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform">{t('settingsPrivacy.requestDataExport')}</button>
        </div>
      </SettingsDialog>
    </Layout>
  )
}
