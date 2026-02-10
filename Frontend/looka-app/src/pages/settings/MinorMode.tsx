import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function MinorModePage() {
  const navigate = useNavigate()
  const [isEnabled, setIsEnabled] = useState(false)
  const [timeLimit, setTimeLimit] = useState(40) // minutes

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">未成年人模式</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 模式说明 */}
          <div className="mx-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Icon name="child_care" size={24} className="text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">保护未成年人健康上网</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  开启后将限制使用时长、过滤不适宜内容，并禁用直播打赏、充值消费等功能。
                </p>
              </div>
            </div>
          </div>

          {/* 开启开关 */}
          <div className="mx-4 mb-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-4">
                  <Icon name="shield" size={22} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">开启未成年人模式</span>
                </div>
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    isEnabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 时间限制 */}
          {isEnabled && (
            <div className="mx-4 mb-3">
              <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">每日使用时长</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">限制时长</span>
                  <span className="text-lg font-bold text-primary">{timeLimit} 分钟</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={10}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
                  <span>20分钟</span>
                  <span>120分钟</span>
                </div>
              </div>
            </div>
          )}

          {/* 功能限制说明 */}
          {isEnabled && (
            <div className="mx-4 mb-3">
              <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">功能限制</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                {[
                  { icon: 'timer', text: '每日使用时长限制' },
                  { icon: 'nightlight', text: '22:00-6:00 禁止使用' },
                  { icon: 'visibility_off', text: '过滤不适宜内容' },
                  { icon: 'money_off', text: '禁用消费功能' },
                  { icon: 'search_off', text: '限制搜索功能' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 px-4 py-3 ${
                      index < 4 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                    }`}
                  >
                    <Icon name={item.icon} size={20} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 设置密码 */}
          {isEnabled && (
            <div className="mx-4 mt-6">
              <button className="w-full py-3.5 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform">
                设置监护密码
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                设置密码后，关闭模式时需要验证
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
