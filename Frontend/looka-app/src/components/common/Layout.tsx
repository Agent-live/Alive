import { ReactNode, useEffect } from 'react'
import { TabBar } from './TabBar'
import { useSettingsStore } from '@/store'

interface LayoutProps {
  children: ReactNode
  showTabBar?: boolean
  className?: string
}

export function Layout({
  children,
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
      <div className="app-scroll">
        <div className={`max-w-md mx-auto ${showTabBar ? 'pb-24' : ''}`}>
          {children}
        </div>
      </div>
      {showTabBar && <TabBar />}
    </div>
  )
}
