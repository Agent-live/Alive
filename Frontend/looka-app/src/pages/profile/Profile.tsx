import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, ImageSwap, CardMasonry, SideDrawer } from '@/components'
import { useAuthStore } from '@/store'
import {
  profileTabs,
  statusText,
  statusColor,
  myWishes,
  wantedWishes,
  sharedWishes,
  defaultUserAvatar,
  defaultUserProfile,
} from '@/mocks'

export function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false)

  // 从 authStore 获取用户数据（如果已登录）
  const { user } = useAuthStore()

  // 使用 authStore 用户数据或默认数据
  const userAvatar = user?.avatar || defaultUserAvatar
  const userName = user?.nickname || defaultUserProfile.name
  const userBio = defaultUserProfile.bio
  const userStats = defaultUserProfile.stats

  // 用户标签
  const userTags = ['时尚达人', '极简主义', '复古风']

  return (
    <Layout>
      {/* Side Drawer */}
      <SideDrawer isOpen={sideDrawerOpen} onClose={() => setSideDrawerOpen(false)} />

      {/* Header */}
      <div className="header-main">
        <div className="header-main-inner">
          <button className="header-btn-start" onClick={() => setSideDrawerOpen(true)}>
            <Icon name="menu" size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <button className="header-btn">
              <Icon name="qr_code_scanner" size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button className="header-btn">
              <Icon name="share" size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Profile Section */}
        <div className="pt-6 pb-4">
            {/* Avatar + Name Row */}
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar with + button */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                  <img
                    src={userAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* + Button */}
                <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800">
                  <Icon name="add" size={18} />
                </button>
              </div>

              {/* Name and ID */}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{userName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400 dark:text-gray-500">LOOKA ID: looka_user</span>
                  <Icon name="qr_code" size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {userBio}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {userTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{userStats.wishes}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">许愿</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{userStats.wants}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">想要</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{userStats.shares}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">分享</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  编辑资料
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-9 h-9 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center"
                >
                  <Icon name="settings" size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => navigate('/body-profile')}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="accessibility_new" size={18} className="text-primary" />
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">身材档案</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">让洛卡更懂你</p>
              </button>
              <button
                onClick={() => navigate('/luka')}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="auto_awesome" size={18} className="text-primary" />
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">洛卡对话</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">AI 设计助手</p>
              </button>
            </div>
          </div>

        {/* Content Tabs + Grid 外层容器 */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden pb-4">
          {/* Tabs */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex gap-6">
              {profileTabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(index)}
                  className={`relative pb-2 text-base transition-colors ${
                    index === activeTab
                      ? 'font-bold text-gray-900 dark:text-gray-100'
                      : 'font-medium text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {tab}
                  {index === activeTab && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/search')} className="text-gray-400 dark:text-gray-500">
              <Icon name="search" size={22} />
            </button>
          </div>

          {/* Wishes Grid */}
          <div className="pb-4">
            {(() => {
              // 根据 activeTab 选择数据
              const tabData = [myWishes, wantedWishes, sharedWishes]
              const currentWishes = tabData[activeTab] || []
              const emptyMessages = ['还没有许愿', '还没有想要的', '还没有分享']
              const emptyIcons = ['auto_awesome', 'favorite', 'share']

              if (currentWishes.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Icon name={emptyIcons[activeTab]} size={48} className="text-gray-200 dark:text-gray-700 mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">{emptyMessages[activeTab]}</p>
                  </div>
                )
              }

              return (
                <CardMasonry columns={{ default: 2 }} gap={8}>
                  {currentWishes.map((wish, index) => {
                    const aspectRatios = ['aspect-card-1', 'aspect-card-2', 'aspect-card-3', 'aspect-card-4']
                    const aspectRatio = aspectRatios[index % aspectRatios.length]

                    return (
                      <div
                        key={wish.id}
                        onClick={() => navigate(`/group-buy/${wish.id}`)}
                        className="bg-white dark:bg-gray-800 rounded overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
                      >
                        {/* 图片区域 */}
                        <div className={`relative ${aspectRatio}`}>
                          <ImageSwap
                            mainImage={wish.modelImage}
                            thumbImage={wish.clothImage}
                            alt={wish.name}
                            className="w-full h-full"
                            thumbSize="md"
                          />
                        </div>
                        {/* 信息 */}
                        <div className="px-2.5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-medium leading-tight line-clamp-1 text-gray-900 dark:text-gray-100">{wish.name}</h3>
                            <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor[wish.status]}`}>
                              {statusText[wish.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1.5 text-gray-400 dark:text-gray-500">
                            <Icon name="favorite" size={12} filled />
                            <span className="text-[11px]">{wish.wantCount}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* 添加新愿望 - 只在"我许的愿" tab 显示 */}
                  {activeTab === 0 && (
                    <div
                      onClick={() => navigate('/luka')}
                      className="aspect-card-1 bg-gray-50 dark:bg-gray-800/50 rounded flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-transform"
                    >
                      <Icon name="add" size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-xs text-gray-400 dark:text-gray-500">许个新愿望</p>
                    </div>
                  )}
                </CardMasonry>
              )
            })()}
          </div>
        </div>
      </div>
    </Layout>
  )
}
