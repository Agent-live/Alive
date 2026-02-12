import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '@/locales/en.json'
import zhCN from '@/locales/zh-CN.json'
import zhTW from '@/locales/zh-TW.json'
import ja from '@/locales/ja.json'
import ko from '@/locales/ko.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import pt from '@/locales/pt.json'
import ar from '@/locales/ar.json'
import ru from '@/locales/ru.json'
import hi from '@/locales/hi.json'
import th from '@/locales/th.json'

export type LanguageCode = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'ru' | 'hi' | 'th'

export interface SupportedLanguage {
  code: LanguageCode
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
}

export const supportedLanguages: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文', dir: 'ltr' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', dir: 'ltr' },
]

// Read persisted language from zustand's settings-storage
function getPersistedLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem('settings-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      const lang = parsed?.state?.language
      if (lang && supportedLanguages.some(l => l.code === lang)) {
        return lang as LanguageCode
      }
    }
  } catch {
    // ignore
  }
  return 'en'
}

const persistedLang = getPersistedLanguage()

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      ja: { translation: ja },
      ko: { translation: ko },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      ar: { translation: ar },
      ru: { translation: ru },
      hi: { translation: hi },
      th: { translation: th },
    },
    lng: persistedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: [],  // Disable auto-detection — we use zustand persistence
    },
  })

// Set initial document direction
const langConfig = supportedLanguages.find(l => l.code === persistedLang)
if (langConfig) {
  document.documentElement.dir = langConfig.dir
}

/**
 * Wrapper hook for backward compatibility with existing useI18n references.
 */
export function useI18n() {
  const { t, i18n: i18nInstance } = useTranslation()
  return {
    t,
    i18n: i18nInstance,
    currentLanguage: i18nInstance.language as LanguageCode,
    changeLanguage: (lang: LanguageCode) => {
      i18nInstance.changeLanguage(lang)
      const config = supportedLanguages.find(l => l.code === lang)
      if (config) {
        document.documentElement.dir = config.dir
      }
    },
  }
}

export default i18n
