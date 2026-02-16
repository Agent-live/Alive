import { ReactNode, useEffect } from 'react'
import { TabBar } from './TabBar'
import { SideNav } from './SideNav'
import { useSettingsStore } from '@/store'

export interface LayoutProps {
  children: ReactNode
  header?: ReactNode
  showTabBar?: boolean
  className?: string
}

export function Layout({
  children,
  header,
  showTabBar = true,
  className = '',
}: LayoutProps) {
  const { isDarkMode } = useSettingsStore()

  useEffect(() => {
    document.body.classList.add('scroll-lock')
    return () => document.body.classList.remove('scroll-lock')
  }, [])

  return (
    <div className={`transition-colors ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen h-[100dvh] overflow-hidden">
        {/* Desktop side nav — always visible on md+ */}
        <SideNav />

        {/* Main content area */}
        <div className={`flex-1 flex flex-col h-full min-w-0 ${className}`}>
          {/* Header */}
          {header && (
            <div
              className="sticky top-0 z-10 header-blur border-b border-gray-100/60 md:border-b-0 dark:border-gray-800/60"
              style={{ paddingTop: 'var(--safe-area-inset-top)' }}
            >
              <div className="w-full px-0 md:px-2">
                {header}
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto app-scroll">
            <div className={`w-full ${showTabBar ? 'pb-24 md:pb-6' : ''}`}>
              {children}
            </div>
          </div>

          {/* Mobile bottom tab bar */}
          {showTabBar && <TabBar />}
        </div>
      </div>
    </div>
  )
}
