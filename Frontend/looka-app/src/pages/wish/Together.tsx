import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, LukaAvatar } from '@/components'
import { WishListHorizontalSkeleton, EmptyGroupBuy, NetworkError } from '@/components/feedback'
import { useWishStore } from '@/store'
import { WishStatus } from '@/types'
import { WishCard } from '@/components/wish/WishCard'
import { useRefreshWithDeps } from '@/hooks'
import { activities, togetherTabs } from '@/mocks'

type ViewMode = 'list' | 'grid'

export function TogetherPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const { groupBuys, fetchGroupBuys } = useWishStore()

  // 使用 useRefreshWithDeps 管理数据加载
  const fetchData = useCallback(async () => {
    const statusMap: Record<number, WishStatus | undefined> = {
      0: 'active',
      1: 'active', // 过滤显示进度 > 80%
      2: 'success',
    }
    await fetchGroupBuys({ status: statusMap[activeTab] })
  }, [activeTab, fetchGroupBuys])

  const { loading, error, refresh } = useRefreshWithDeps(fetchData, [activeTab])

  // 根据 tab 过滤显示
  const filteredWishes = groupBuys.filter(wish => {
    if (activeTab === 1) {
      // 即将成真：进度 > 80%
      return wish.progress >= 80 && wish.status !== 'success'
    }
    return true
  })

  return (
    <Layout>
      {/* Header */}
      <div className="header-main">
        <div className="header-main-inner">
          <h1 className="header-title">一起</h1>
          <div className="tabs-header">
            {togetherTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`tab-header ${
                  index === activeTab ? 'tab-header-active' : 'tab-header-inactive'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {/* 视图切换 */}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="header-btn"
              aria-label={viewMode === 'list' ? '切换网格视图' : '切换列表视图'}
            >
              <Icon
                name={viewMode === 'list' ? 'grid_view' : 'view_agenda'}
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>
            <button className="header-btn">
              <Icon name="notifications" size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <main className="content-page py-3 pb-6 space-y-4">
        {/* 动态提醒 */}
        {activities.length > 0 && activeTab === 0 && (
          <div className="surface-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="notifications_active" size={18} className="text-primary" />
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">最新动态</span>
            </div>
            <div className="space-y-3">
              {activities.slice(0, 2).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  {activity.type === 'almost' ? (
                    <>
                      <LukaAvatar size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{activity.wishTitle}</span>
                          <span className="text-gray-500 dark:text-gray-400"> 还差 </span>
                          <span className="text-primary font-bold">{activity.remaining}</span>
                          <span className="text-gray-500 dark:text-gray-400"> 人</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={activity.user?.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{activity.user?.name}</span>
                          <span className="text-primary">
                            {activity.type === 'join' ? ' 也想要 ' : ' remix 了你的 '}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{activity.wishTitle}</span>
                        </p>
                      </div>
                    </>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && <WishListHorizontalSkeleton count={4} />}

        {/* 错误状态 - 使用 refresh 修复重试 */}
        {error && !loading && <NetworkError onRetry={refresh} />}

        {/* 空状态 */}
        {!loading && !error && filteredWishes.length === 0 && <EmptyGroupBuy />}

        {/* 愿望卡片列表 */}
        {!loading && !error && filteredWishes.length > 0 && (
          <>
            {/* 列表视图 - 增加卡片间距 */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredWishes.map((wish, index) => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    variant={index === 0 && activeTab === 0 ? 'large' : 'horizontal'}
                    onJoin={() => navigate(`/wish/${wish.id}`)}
                  />
                ))}
              </div>
            )}

            {/* 网格视图 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-3">
                {filteredWishes.map((wish) => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    variant="default"
                    onJoin={() => navigate(`/wish/${wish.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 空状态提示 */}
        {!loading && !error && filteredWishes.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm">发现更多人的愿望，一起让它成真</p>
          </div>
        )}

      </main>
    </Layout>
  )
}
