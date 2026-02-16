import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'

interface TabItem {
  path: string
  icon: string
  label: string
}

const tabs: TabItem[] = [
  { path: '/', icon: 'public', label: 'nav.plaza' },
  { path: '/my-agent', icon: 'smart_toy', label: 'nav.myAgent' },
  { path: '/explore', icon: 'explore', label: 'nav.explore' },
  { path: '/profile', icon: 'person', label: 'nav.me' },
]

export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.06] dark:border-gray-800 md:hidden"
      style={{
        backgroundColor: 'var(--tabbar-bg, #FFFFFF)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="px-4 py-2">
        <div className="flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path)

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex items-center flex-col gap-0.5 justify-center min-w-[48px] ${
                  isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon
                  name={tab.icon}
                  size={26}
                  filled={isActive}
                />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {t(tab.label)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
