import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'standard' | 'large' | 'extraLarge'

interface SettingsState {
  // 主题设置
  themeMode: ThemeMode
  isDarkMode: boolean

  // 字体大小
  fontSize: FontSize

  // 缓存大小（模拟）
  cacheSize: number

  // 操作方法
  setThemeMode: (mode: ThemeMode) => void
  toggleDarkMode: () => void
  setFontSize: (size: FontSize) => void
  clearCache: () => Promise<void>
  initTheme: () => void
}

// 字体大小对应的 CSS 变量值
export const fontSizeValues: Record<FontSize, { label: string; scale: number }> = {
  small: { label: '小', scale: 0.875 },
  standard: { label: '标准', scale: 1 },
  large: { label: '大', scale: 1.125 },
  extraLarge: { label: '特大', scale: 1.25 },
}

// 应用主题到 DOM
const applyTheme = (isDark: boolean) => {
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

// 应用字体大小到 DOM
const applyFontSize = (size: FontSize) => {
  const root = document.documentElement
  const scale = fontSizeValues[size].scale
  root.style.setProperty('--font-scale', scale.toString())
  root.style.fontSize = `${scale * 16}px`
}

// 获取系统主题偏好
const getSystemTheme = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeMode: 'light',
      isDarkMode: false,
      fontSize: 'standard',
      cacheSize: 23.5, // MB

      setThemeMode: (mode) => {
        let isDark = false
        if (mode === 'system') {
          isDark = getSystemTheme()
        } else {
          isDark = mode === 'dark'
        }

        set({ themeMode: mode, isDarkMode: isDark })
        applyTheme(isDark)
      },

      toggleDarkMode: () => {
        const { isDarkMode } = get()
        const newMode = isDarkMode ? 'light' : 'dark'
        set({ themeMode: newMode, isDarkMode: !isDarkMode })
        applyTheme(!isDarkMode)
      },

      setFontSize: (size) => {
        set({ fontSize: size })
        applyFontSize(size)
      },

      clearCache: async () => {
        // 模拟清理缓存
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 清理 localStorage 中的非必要数据
        const keysToKeep = ['settings-storage', 'auth-storage']
        const keysToRemove: string[] = []

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && !keysToKeep.some(k => key.includes(k))) {
            keysToRemove.push(key)
          }
        }

        // 清理 sessionStorage
        sessionStorage.clear()

        // 更新缓存大小
        set({ cacheSize: 0 })
      },

      initTheme: () => {
        const { themeMode, fontSize } = get()

        // 初始化主题
        let isDark = false
        if (themeMode === 'system') {
          isDark = getSystemTheme()
        } else {
          isDark = themeMode === 'dark'
        }
        set({ isDarkMode: isDark })
        applyTheme(isDark)

        // 初始化字体大小
        applyFontSize(fontSize)

        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', (e) => {
          if (get().themeMode === 'system') {
            set({ isDarkMode: e.matches })
            applyTheme(e.matches)
          }
        })
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        themeMode: state.themeMode,
        fontSize: state.fontSize,
      }),
    }
  )
)

// 便捷方法
export const settings = {
  toggleDarkMode: () => useSettingsStore.getState().toggleDarkMode(),
  setFontSize: (size: FontSize) => useSettingsStore.getState().setFontSize(size),
  clearCache: () => useSettingsStore.getState().clearCache(),
}
