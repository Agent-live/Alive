import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

const languages: LanguageOption[] = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
]

export function LanguageSettingsPage() {
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN')
  const [autoTranslate, setAutoTranslate] = useState(true)

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">语言与翻译</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {/* 应用语言 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">应用语言</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {languages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
                    index < languages.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  }`}
                >
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">{lang.nativeName}</span>
                    {lang.code !== 'zh-CN' && (
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

          {/* 翻译设置 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">翻译设置</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <Icon name="translate" size={22} className="text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-[15px] text-gray-800 dark:text-gray-200">自动翻译</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">自动翻译外语内容</p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoTranslate(!autoTranslate)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    autoTranslate ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      autoTranslate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors">
                <Icon name="g_translate" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">翻译目标语言</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">简体中文</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
