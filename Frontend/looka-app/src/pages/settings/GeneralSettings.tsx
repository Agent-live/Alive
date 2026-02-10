import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'
import { useSettingsStore, fontSizeValues, FontSize } from '@/store'

export function GeneralSettingsPage() {
  const navigate = useNavigate()
  const {
    isDarkMode,
    toggleDarkMode,
    fontSize,
    setFontSize,
    cacheSize,
    clearCache,
  } = useSettingsStore()

  const [showFontSizeSheet, setShowFontSizeSheet] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCache = async () => {
    setIsClearing(true)
    await clearCache()
    setIsClearing(false)
  }

  const fontSizeOptions: FontSize[] = ['small', 'standard', 'large', 'extraLarge']

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">通用设置</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {/* 显示设置 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">显示</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
              {/* 深色模式 */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <Icon name="dark_mode" size={22} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">深色模式</span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    isDarkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 字体大小 */}
              <button
                onClick={() => setShowFontSizeSheet(true)}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
              >
                <Icon name="text_fields" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">字体大小</span>
                <span className="text-sm text-gray-400 mr-1">{fontSizeValues[fontSize].label}</span>
                <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
              </button>
            </div>
          </div>

          {/* 其他设置 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">其他</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700 transition-colors disabled:opacity-60"
              >
                <Icon name="cleaning_services" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">清除缓存</span>
                {isClearing ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-sm text-gray-400 mr-1">
                      {cacheSize > 0 ? `${cacheSize.toFixed(1)} MB` : '已清理'}
                    </span>
                    <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 字体预览 */}
          <div className="mx-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">字体预览</h4>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              这是一段预览文字，用于展示当前字体大小的效果。
              LOOKA 致力于让每个人都能设计自己的专属服装。
            </p>
          </div>
        </div>
      </div>

      {/* 字体大小选择面板 */}
      {showFontSizeSheet && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={() => setShowFontSizeSheet(false)}
          />

          {/* 面板 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-[101] max-w-md mx-auto animate-slide-up">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">字体大小</h3>
                <button onClick={() => setShowFontSizeSheet(false)}>
                  <Icon name="close" size={24} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 pb-safe">
              {/* 字体大小选项 */}
              <div className="space-y-2 mb-6">
                {fontSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setFontSize(size)
                      setShowFontSizeSheet(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors ${
                      fontSize === size
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <span
                      className={`text-gray-800 dark:text-gray-200 ${
                        fontSize === size ? 'font-medium' : ''
                      }`}
                      style={{ fontSize: `${fontSizeValues[size].scale * 15}px` }}
                    >
                      {fontSizeValues[size].label}
                    </span>
                    {fontSize === size && (
                      <Icon name="check" size={20} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* 预览 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  预览文字效果
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .pb-safe {
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </Layout>
  )
}
