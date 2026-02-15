import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n, { supportedLanguages } from '@/lib/i18n'
import type { LanguageCode } from '@/lib/i18n'
import { settingsApi } from '@/api/settings'
import { toast } from './uiStore'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'standard' | 'large' | 'extraLarge'

interface SettingsState {
  // 主题设置
  themeMode: ThemeMode
  isDarkMode: boolean

  // 状态主题：根据 agent 生存状态改变全局主题色
  statusThemeEnabled: boolean

  // 字体大小
  fontSize: FontSize

  // 语言
  language: LanguageCode

  // 缓存大小（模拟）
  cacheSize: number

  // 操作方法
  setThemeMode: (mode: ThemeMode) => void
  toggleDarkMode: () => void
  setStatusThemeEnabled: (enabled: boolean) => void
  setFontSize: (size: FontSize) => void
  setLanguage: (lang: LanguageCode) => void
  clearCache: () => Promise<void>
  initTheme: () => void

  // Apply server-side user settings without re-syncing them back to the server.
  applyRemoteUserSettings: (settings: { theme?: string; language?: string }) => void
}

// Font size values — labels are i18n keys resolved at render time
export const fontSizeValues: Record<FontSize, { labelKey: string; label: string; scale: number }> = {
  small: { labelKey: 'settingsGeneral.fontSizeSmall', label: 'Small', scale: 0.875 },
  standard: { labelKey: 'settingsGeneral.fontSizeStandard', label: 'Standard', scale: 1 },
  large: { labelKey: 'settingsGeneral.fontSizeLarge', label: 'Large', scale: 1.125 },
  extraLarge: { labelKey: 'settingsGeneral.fontSizeExtraLarge', label: 'Extra Large', scale: 1.25 },
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
      themeMode: 'system',
      isDarkMode: false,
      statusThemeEnabled: false,
      fontSize: 'standard',
      language: 'en' as LanguageCode,
      cacheSize: 23.5, // MB

      applyRemoteUserSettings: (settings) => {
        if (!settings) return

        const theme = (settings.theme || '').trim() as ThemeMode
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          const isDark = theme === 'system' ? getSystemTheme() : theme === 'dark'
          set({ themeMode: theme, isDarkMode: isDark })
          applyTheme(isDark)
        }

        const language = (settings.language || '').trim() as LanguageCode
        if (supportedLanguages.some((l) => l.code === language)) {
          set({ language })
          i18n.changeLanguage(language)
          const config = supportedLanguages.find((l) => l.code === language)
          if (config) {
            document.documentElement.dir = config.dir
          }
        }
      },

      setThemeMode: (mode) => {
        let isDark = false
        if (mode === 'system') {
          isDark = getSystemTheme()
        } else {
          isDark = mode === 'dark'
        }

        set({ themeMode: mode, isDarkMode: isDark })
        applyTheme(isDark)

        void settingsApi.updateUserSettings({ theme: mode }).catch((err) => {
          console.warn('Failed to sync theme setting:', err)
          toast.error('Failed to save theme setting')
        })
      },

      setStatusThemeEnabled: (enabled) => {
        set({ statusThemeEnabled: enabled })
      },

      toggleDarkMode: () => {
        const { isDarkMode } = get()
        const newMode = isDarkMode ? 'light' : 'dark'
        set({ themeMode: newMode, isDarkMode: !isDarkMode })
        applyTheme(!isDarkMode)

        void settingsApi.updateUserSettings({ theme: newMode }).catch((err) => {
          console.warn('Failed to sync theme setting:', err)
          toast.error('Failed to save theme setting')
        })
      },

      setFontSize: (size) => {
        set({ fontSize: size })
        applyFontSize(size)
      },

      setLanguage: (lang) => {
        set({ language: lang })
        i18n.changeLanguage(lang)
        const config = supportedLanguages.find(l => l.code === lang)
        if (config) {
          document.documentElement.dir = config.dir
        }

        void settingsApi.updateUserSettings({ language: lang }).catch((err) => {
          console.warn('Failed to sync language setting:', err)
          toast.error('Failed to save language setting')
        })
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
        statusThemeEnabled: state.statusThemeEnabled,
        fontSize: state.fontSize,
        language: state.language,
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
