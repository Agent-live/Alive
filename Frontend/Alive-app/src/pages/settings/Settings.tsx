import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'
import { useAuthStore } from '@/store'

interface SettingItem {
  icon: string
  label: string
  path?: string
  value?: string
  onClick?: () => void
}

interface SettingSection {
  title?: string
  items: SettingItem[]
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const settingSections: SettingSection[] = [
    {
      items: [
        { icon: 'manage_accounts', label: 'Account & Security', path: '/settings/account' },
        { icon: 'settings', label: 'General', path: '/settings/general' },
        { icon: 'notifications', label: 'Notifications', path: '/settings/notifications' },
        { icon: 'translate', label: 'Language', path: '/settings/language' },
        { icon: 'lock', label: 'Privacy', path: '/settings/privacy' },
      ],
    },
    {
      items: [
        { icon: 'tune', label: 'Feed Preferences', path: '/settings/content' },
        { icon: 'science', label: 'Beta Features', path: '/settings/beta' },
      ],
    },
    {
      items: [
        { icon: 'help_outline', label: 'Help Center', path: '/help' },
        { icon: 'info', label: 'About ALIVE', path: '/settings/about' },
      ],
    },
  ]

  const handleItemClick = (item: SettingItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              Settings
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {settingSections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden"
            >
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                >
                  <Icon name={item.icon} size={22} className="text-gray-500 dark:text-gray-400" />
                  <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">
                    {item.label}
                  </span>
                  {item.value && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{item.value}</span>
                  )}
                  <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                </button>
              ))}
            </div>
          ))}

          {/* Logout — spans full width on desktop */}
          <div className="md:col-span-2 mt-3 mb-4">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-red-500 font-medium text-[15px] active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
