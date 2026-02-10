import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface Creator {
  id: string
  name: string
  avatar: string
  bio: string
  wishCount: number
  isFollowing: boolean
}

interface WishItem {
  id: string
  image: string
  title: string
  creator: {
    id: string
    name: string
    avatar: string
  }
  status: 'wishing' | 'making' | 'shipping' | 'realized'
  likeCount: number
}

const mockCreators: Creator[] = [
  {
    id: '1',
    name: '设计师小雨',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    bio: '热爱极简风格，追求舒适与美的平衡',
    wishCount: 28,
    isFollowing: true,
  },
  {
    id: '2',
    name: 'Fashion Studio',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    bio: '专注复古与现代的融合设计',
    wishCount: 156,
    isFollowing: true,
  },
  {
    id: '3',
    name: '穿搭日记',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    bio: '每天分享一套穿搭灵感',
    wishCount: 89,
    isFollowing: true,
  },
]

const mockWishes: WishItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    title: '春日轻盈连衣裙',
    creator: mockCreators[0],
    status: 'making',
    likeCount: 234,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    title: '复古格纹西装外套',
    creator: mockCreators[1],
    status: 'wishing',
    likeCount: 567,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
    title: '极简白衬衫',
    creator: mockCreators[2],
    status: 'realized',
    likeCount: 890,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
    title: '夏日印花半裙',
    creator: mockCreators[0],
    status: 'shipping',
    likeCount: 156,
  },
]

const statusLabels: Record<WishItem['status'], { label: string; color: string }> = {
  wishing: { label: '许愿中', color: 'bg-primary/10 text-primary' },
  making: { label: '制作中', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' },
  shipping: { label: '运输中', color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-500' },
  realized: { label: '已实现', color: 'bg-green-50 dark:bg-green-900/30 text-green-500' },
}

type TabType = 'wishes' | 'creators'

export function FollowingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('wishes')
  const [creators, setCreators] = useState(mockCreators)

  const handleUnfollow = (creatorId: string) => {
    setCreators(prev =>
      prev.map(c =>
        c.id === creatorId ? { ...c, isFollowing: !c.isFollowing } : c
      )
    )
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">关注</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-40 bg-white dark:bg-[#16181B] border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('wishes')}
            className={`flex-1 py-3 text-[15px] font-medium transition-colors relative ${
              activeTab === 'wishes'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            动态
            {activeTab === 'wishes' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`flex-1 py-3 text-[15px] font-medium transition-colors relative ${
              activeTab === 'creators'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            创作者
            {activeTab === 'creators' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {activeTab === 'wishes' ? (
            // Wishes Feed
            mockWishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Icon name="auto_awesome" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
                <p className="text-gray-400 dark:text-gray-500">关注的创作者还没有发布愿望</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-4">
                {mockWishes.map((wish) => (
                  <div
                    key={wish.id}
                    onClick={() => navigate(`/wish/${wish.id}`)}
                    className="bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="aspect-[3/4] relative">
                      <img
                        src={wish.image}
                        alt={wish.title}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${statusLabels[wish.status].color}`}>
                        {statusLabels[wish.status].label}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {wish.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={wish.creator.avatar}
                            alt={wish.creator.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                            {wish.creator.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500">
                          <Icon name="favorite" size={14} />
                          <span className="text-xs">{wish.likeCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Creators List
            creators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Icon name="people" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
                <p className="text-gray-400 dark:text-gray-500">还没有关注任何创作者</p>
              </div>
            ) : (
              <div className="space-y-3 px-4">
                {creators.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                  >
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                        {creator.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {creator.bio}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {creator.wishCount} 个愿望
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnfollow(creator.id)
                      }}
                      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        creator.isFollowing
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-primary text-white'
                      }`}
                    >
                      {creator.isFollowing ? '已关注' : '关注'}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  )
}
