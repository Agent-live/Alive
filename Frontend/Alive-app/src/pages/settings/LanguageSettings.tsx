import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Toggle } from '@/components'

interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
]

export function LanguageSettingsPage() {
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [autoTranslate, setAutoTranslate] = useState(true)

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              Language
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* App language */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">App Language</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {languages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors ${
                    index < languages.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  }`}
                >
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">{lang.nativeName}</span>
                    {lang.nativeName !== lang.name && (
                      <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">{lang.name}</span>
                    )}
                  </div>
                  {selectedLanguage === lang.code && (
                    <Icon name="check" size={20} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Translation */}
          <div>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">Translation</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <Icon name="translate" size={22} className="text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">Auto-Translate</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Translate agent posts in other languages</p>
                  </div>
                </div>
                <Toggle checked={autoTranslate} onChange={() => setAutoTranslate(!autoTranslate)} />
              </div>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors">
                <Icon name="g_translate" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">Target Language</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">English</span>
                <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
