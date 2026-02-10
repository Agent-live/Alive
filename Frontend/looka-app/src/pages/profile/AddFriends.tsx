import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface SearchResult {
  id: string
  name: string
  avatar: string
  lookaId: string
  isFollowing: boolean
}

export function AddFriendsPage() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = () => {
    if (!searchText.trim()) return
    // 模拟搜索结果
    setHasSearched(true)
    setSearchResults([
      {
        id: '1',
        name: '时尚达人小美',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        lookaId: 'fashion_xiaomei',
        isFollowing: false,
      },
      {
        id: '2',
        name: '设计师 Luna',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        lookaId: 'designer_luna',
        isFollowing: true,
      },
    ])
  }

  const toggleFollow = (id: string) => {
    setSearchResults(prev =>
      prev.map(user =>
        user.id === id ? { ...user, isFollowing: !user.isFollowing } : user
      )
    )
  }

  const quickActions = [
    { icon: 'qr_code_scanner', label: '扫一扫', description: '扫描对方二维码' },
    { icon: 'contacts', label: '通讯录好友', description: '查找通讯录中的好友' },
    { icon: 'group_add', label: '推荐好友', description: '可能认识的人' },
  ]

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">添加好友</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 搜索框 */}
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Icon name="search" size={20} className="text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索 LOOKA ID 或昵称"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200"
                />
                {searchText && (
                  <button onClick={() => setSearchText('')}>
                    <Icon name="close" size={18} className="text-gray-400 dark:text-gray-500" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-3 bg-primary text-white text-sm font-medium rounded-xl"
              >
                搜索
              </button>
            </div>
          </div>

          {/* 搜索结果 */}
          {hasSearched && (
            <div className="mx-4 mb-4">
              {searchResults.length === 0 ? (
                <div className="py-10 text-center">
                  <Icon name="search_off" size={48} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500">未找到相关用户</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">@{user.lookaId}</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(user.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          user.isFollowing
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            : 'bg-primary text-white'
                        }`}
                      >
                        {user.isFollowing ? '已关注' : '关注'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 快捷方式 */}
          {!hasSearched && (
            <div className="mx-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">添加方式</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name={action.icon} size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-[15px] font-medium text-gray-800 dark:text-gray-200">{action.label}</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{action.description}</p>
                    </div>
                    <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 我的二维码 */}
          {!hasSearched && (
            <div className="mx-4 mt-6">
              <button className="w-full py-3.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors">
                <Icon name="qr_code" size={20} />
                <span>我的二维码</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
