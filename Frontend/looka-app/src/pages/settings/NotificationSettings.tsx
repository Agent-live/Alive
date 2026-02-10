import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function NotificationSettingsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    orders: true,
    system: true,
    promotion: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderToggleItem = (
    icon: string,
    label: string,
    key: keyof typeof notifications,
    description?: string,
    showBorder = true
  ) => (
    <div className={`flex items-center justify-between px-4 py-3.5 ${showBorder ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}`}>
      <div className="flex items-center gap-4 flex-1">
        <Icon name={icon} size={22} className="text-gray-500 dark:text-gray-400" />
        <div>
          <span className="text-[15px] text-gray-800 dark:text-gray-200">{label}</span>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => toggleNotification(key)}
        className={`w-12 h-7 rounded-full transition-colors relative ${
          notifications[key] ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            notifications[key] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">消息通知</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {/* 互动通知 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">互动通知</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('favorite', '点赞通知', 'likes', '有人点赞你的内容时通知')}
              {renderToggleItem('chat_bubble', '评论通知', 'comments', '有人评论你的内容时通知')}
              {renderToggleItem('person_add', '关注通知', 'follows', '有人关注你时通知')}
              {renderToggleItem('alternate_email', '@提及', 'mentions', '有人@你时通知', false)}
            </div>
          </div>

          {/* 服务通知 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">服务通知</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('local_shipping', '订单通知', 'orders', '订单状态变更时通知')}
              {renderToggleItem('campaign', '系统通知', 'system', '系统公告和重要通知', false)}
            </div>
          </div>

          {/* 营销通知 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">营销通知</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('redeem', '活动推送', 'promotion', '优惠活动和推荐内容', false)}
            </div>
          </div>

          {/* 说明 */}
          <div className="mx-4 mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              关闭通知后，您将不会收到相应的推送消息
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
