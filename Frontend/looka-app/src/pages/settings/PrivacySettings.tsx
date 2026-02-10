import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function PrivacySettingsPage() {
  const navigate = useNavigate()
  const [privacy, setPrivacy] = useState({
    showOnline: true,
    showLikes: true,
    showFollowing: true,
    allowMessage: true,
    allowComment: true,
  })

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderToggleItem = (
    icon: string,
    label: string,
    key: keyof typeof privacy,
    description?: string,
    showBorder = true
  ) => (
    <div className={`flex items-center justify-between px-4 py-3.5 ${showBorder ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}`}>
      <div className="flex items-center gap-4 flex-1">
        <Icon name={icon} size={22} className="text-gray-500 dark:text-gray-400" />
        <div className="flex-1">
          <span className="text-[15px] text-gray-800 dark:text-gray-200">{label}</span>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => togglePrivacy(key)}
        className={`w-12 h-7 rounded-full transition-colors relative ${
          privacy[key] ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            privacy[key] ? 'translate-x-6' : 'translate-x-1'
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
          <h1 className="header-title-center">隐私设置</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {/* 个人信息可见性 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">个人信息</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('visibility', '展示在线状态', 'showOnline', '其他用户可以看到你是否在线')}
              {renderToggleItem('favorite', '展示点赞列表', 'showLikes', '其他用户可以看到你点赞的内容')}
              {renderToggleItem('group', '展示关注列表', 'showFollowing', '其他用户可以看到你关注的人', false)}
            </div>
          </div>

          {/* 互动权限 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">互动权限</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {renderToggleItem('mail', '允许私信', 'allowMessage', '允许其他用户给你发私信')}
              {renderToggleItem('comment', '允许评论', 'allowComment', '允许其他用户评论你的内容', false)}
            </div>
          </div>

          {/* 其他隐私选项 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">其他</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => navigate('/settings/privacy/blacklist')}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50"
              >
                <Icon name="block" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">黑名单</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
              <button
                onClick={() => navigate('/settings/privacy/data')}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors"
              >
                <Icon name="download" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">下载我的数据</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
