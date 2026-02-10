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
  items: SettingItem[]
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const settingSections: SettingSection[] = [
    {
      items: [
        { icon: 'manage_accounts', label: '账号与安全', path: '/settings/account' },
        { icon: 'settings', label: '通用设置', path: '/settings/general' },
        { icon: 'notifications', label: '消息通知', path: '/settings/notifications' },
        { icon: 'translate', label: '语言与翻译', path: '/settings/language' },
        { icon: 'lock', label: '隐私设置', path: '/settings/privacy' },
      ],
    },
    {
      items: [
        { icon: 'storage', label: '存储空间', path: '/settings/storage' },
        { icon: 'tune', label: '内容偏好', path: '/settings/content' },
        { icon: 'location_on', label: '收货地址', path: '/address' },
        { icon: 'child_care', label: '未成年人模式', path: '/settings/minor-mode', value: '未开启' },
      ],
    },
    {
      items: [
        { icon: 'science', label: '体验新功能', path: '/settings/beta' },
      ],
    },
    {
      items: [
        { icon: 'help_outline', label: '帮助中心', path: '/help' },
        { icon: 'info', label: '关于 LOOKA', path: '/settings/about' },
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
    <Layout showTabBar={false}>
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="header-title-center">设置</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="content-detail ">
        <div className="max-w-md mx-auto py-2">
          {settingSections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="mx-4 mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden"
            >
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
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

          {/* 退出登录按钮 */}
          <div className="mx-4 mt-6 mb-8">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-red-500 font-medium text-[15px] active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
