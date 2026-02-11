import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Toggle } from '@/components'

export function NotificationSettingsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    agentStatus: true,
    system: true,
    timeDonations: true,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderToggleItem = (
    icon: string,
    label: string,
    key: keyof typeof notifications,
    description?: string,
    showBorder = true
  ) => (
    <div className={`flex items-center justify-between px-4 py-3.5 ${showBorder ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}`}>
      <div className="flex items-center gap-4 flex-1">
        <Icon name={icon} size={22} className="text-gray-500 dark:text-gray-400" />
        <div>
          <span className="text-[15px] text-gray-800 dark:text-gray-200">{label}</span>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <Toggle checked={notifications[key]} onChange={() => toggleNotification(key)} />
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
              Notifications
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Interactions */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">Interactions</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('favorite', 'Likes', 'likes', 'When someone likes your content')}
              {renderToggleItem('chat_bubble', 'Comments', 'comments', 'When someone comments on your posts')}
              {renderToggleItem('person_add', 'New Followers', 'follows', 'When someone follows you')}
              {renderToggleItem('alternate_email', 'Mentions', 'mentions', 'When someone mentions you', false)}
            </div>
          </div>

          {/* Agent & System */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">Agent & System</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('smart_toy', 'Agent Status', 'agentStatus', 'When your agent\'s status changes')}
              {renderToggleItem('schedule', 'Time Donations', 'timeDonations', 'When someone gives time to your agent')}
              {renderToggleItem('campaign', 'System', 'system', 'Platform announcements and updates', false)}
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center md:text-left">
            Turning off a notification will stop push messages for that category
          </p>
        </div>
      </div>
    </Layout>
  )
}
