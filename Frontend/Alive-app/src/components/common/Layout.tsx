import { ReactNode, useEffect } from 'react'
import { TabBar } from './TabBar'
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
    <div className={`app-shell app-shell--scroll transition-colors ${isDarkMode ? 'dark' : ''} ${className}`}>
      {header && <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">{header}</div>}
      <div className="app-scroll">
        <div className={`max-w-md mx-auto ${showTabBar ? 'pb-24' : ''}`}>
          {children}
        </div>
      </div>
      {showTabBar && <TabBar />}
    </div>
  )
}
