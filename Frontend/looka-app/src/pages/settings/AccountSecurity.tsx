import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'
import { useAuthStore } from '@/store'

interface SecurityItem {
  icon: string
  label: string
  value?: string
  path?: string
  danger?: boolean
}

export function AccountSecurityPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const securityItems: SecurityItem[] = [
    { icon: 'smartphone', label: '手机号', value: user?.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}` : '未绑定', path: '/settings/account/phone' },
    { icon: 'email', label: '邮箱', value: '未绑定', path: '/settings/account/email' },
    { icon: 'password', label: '登录密码', value: '已设置', path: '/settings/account/password' },
    { icon: 'key', label: '第三方账号', path: '/settings/account/third-party' },
  ]

  const otherItems: SecurityItem[] = [
    { icon: 'devices', label: '登录设备管理', path: '/settings/account/devices' },
    { icon: 'verified_user', label: '实名认证', value: '未认证', path: '/settings/account/verify' },
  ]

  const dangerItems: SecurityItem[] = [
    { icon: 'logout', label: '注销账号', path: '/settings/account/delete', danger: true },
  ]

  const handleItemClick = (item: SecurityItem) => {
    if (item.path) {
      navigate(item.path)
    }
  }

  const renderSection = (items: SecurityItem[], title?: string) => (
    <div className="mx-4 mb-3">
      {title && (
        <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{title}</h3>
      )}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
              index < items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
            }`}
          >
            <Icon name={item.icon} size={22} className={item.danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
            <span className={`flex-1 text-left text-[15px] ${item.danger ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {item.label}
            </span>
            {item.value && (
              <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{item.value}</span>
            )}
            <Icon name="chevron_right" size={20} className="text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">账号与安全</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {renderSection(securityItems, '账号绑定')}
          {renderSection(otherItems, '安全设置')}
          {renderSection(dangerItems)}
        </div>
      </div>
    </Layout>
  )
}
