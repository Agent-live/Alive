import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { useSettingsStore } from '@/store'

interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  icon: string
  label: string
  path?: string
  onClick?: () => void
  badge?: boolean
}

interface MenuSection {
  items: MenuItem[]
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const navigate = useNavigate()
  const { isDarkMode } = useSettingsStore()

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const menuSections: MenuSection[] = [
    {
      items: [
        { icon: 'people', label: '关注', path: '/following' },
      ],
    },
    {
      items: [
        { icon: 'auto_awesome', label: '我的愿望', path: '/my-wishes' },
        { icon: 'edit_note', label: '草稿箱', path: '/drafts' },
      ],
    },
    {
      items: [
        { icon: 'account_balance_wallet', label: '钱包', path: '/wallet' },
      ],
    },
  ]

  const bottomActions = [
    { icon: 'help_outline', label: '帮助中心', path: '/help' },
    { icon: 'settings', label: '设置', path: '/settings' },
  ]

  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.path) {
      navigate(item.path)
    }
    onClose()
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 侧边栏 */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[75%] max-w-[320px] z-[101] transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
      >
        {/* 安全区域顶部 */}
        <div className="h-[env(safe-area-inset-top)]" />

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className={`mx-3 mb-2 rounded-xl overflow-hidden ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}
            >
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors ${
                    isDarkMode ? 'active:bg-gray-700/50' : 'active:bg-gray-100'
                  }`}
                >
                  <Icon name={item.icon} size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`flex-1 text-left text-[15px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* 底部操作栏 */}
        <div className={`border-t px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))] ${
          isDarkMode ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <div className="flex items-center justify-around">
            {bottomActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(action)}
                className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Icon name={action.icon} size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
