import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function AboutPage() {
  const navigate = useNavigate()

  const menuItems = [
    { icon: 'description', label: '用户协议', path: '/terms' },
    { icon: 'privacy_tip', label: '隐私政策', path: '/privacy-policy' },
    { icon: 'gavel', label: '社区规范', path: '/community-guidelines' },
    { icon: 'copyright', label: '版权声明', path: '/copyright' },
    { icon: 'update', label: '检查更新', path: '/update' },
  ]

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">关于 LOOKA</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {/* Logo 和版本 */}
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg mb-4">
              <span className="text-white text-2xl font-bold">L</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">LOOKA</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">版本 1.0.0</p>
          </div>

          {/* 菜单列表 */}
          <div className="mx-4 mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
                  index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                }`}
              >
                <Icon name={item.icon} size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">
                  {item.label}
                </span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
            ))}
          </div>

          {/* 底部信息 */}
          <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
            <p>LOOKA - AI 时尚设计平台</p>
            <p className="mt-1">让每个人都能设计自己的专属服装</p>
            <p className="mt-4">Copyright 2024 LOOKA. All rights reserved.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
