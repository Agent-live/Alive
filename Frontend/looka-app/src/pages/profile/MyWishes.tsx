import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface WishItem {
  id: string
  image: string
  title: string
  status: 'wishing' | 'making' | 'shipping' | 'realized'
  createdAt: string
  likeCount: number
  joinCount?: number
}

const mockWishes: WishItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    title: '春日轻盈连衣裙',
    status: 'making',
    createdAt: '3天前',
    likeCount: 234,
    joinCount: 12,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    title: '复古格纹西装外套',
    status: 'wishing',
    createdAt: '1周前',
    likeCount: 567,
    joinCount: 45,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
    title: '极简白衬衫',
    status: 'realized',
    createdAt: '2周前',
    likeCount: 890,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
    title: '夏日印花半裙',
    status: 'shipping',
    createdAt: '5天前',
    likeCount: 156,
  },
]

const statusConfig: Record<WishItem['status'], { label: string; color: string; bgColor: string; icon: string }> = {
  wishing: {
    label: '许愿中',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: 'auto_awesome',
  },
  making: {
    label: '制作中',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    icon: 'precision_manufacturing',
  },
  shipping: {
    label: '运输中',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    icon: 'local_shipping',
  },
  realized: {
    label: '已实现',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    icon: 'check_circle',
  },
}

type FilterType = 'all' | 'wishing' | 'making' | 'shipping' | 'realized'

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'wishing', label: '许愿中' },
  { key: 'making', label: '制作中' },
  { key: 'shipping', label: '运输中' },
  { key: 'realized', label: '已实现' },
]

export function MyWishesPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredWishes = activeFilter === 'all'
    ? mockWishes
    : mockWishes.filter(w => w.status === activeFilter)

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">我的愿望</h1>
          <button
            onClick={() => navigate('/design/editor')}
            className="text-primary"
          >
            <Icon name="add" size={24} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-40 bg-white dark:bg-[#16181B] border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {filteredWishes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="auto_awesome" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-400 dark:text-gray-500 mb-4">还没有愿望</p>
              <button
                onClick={() => navigate('/design/editor')}
                className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-full"
              >
                发起第一个愿望
              </button>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {filteredWishes.map((wish) => (
                <div
                  key={wish.id}
                  onClick={() => navigate(`/wish/${wish.id}`)}
                  className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer active:scale-[0.99] transition-transform"
                >
                  {/* Image */}
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={wish.image}
                      alt={wish.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                        {wish.title}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {wish.createdAt}创建
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig[wish.status].bgColor}`}>
                        <Icon
                          name={statusConfig[wish.status].icon}
                          size={14}
                          className={statusConfig[wish.status].color}
                        />
                        <span className={`text-xs font-medium ${statusConfig[wish.status].color}`}>
                          {statusConfig[wish.status].label}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-0.5">
                          <Icon name="favorite" size={14} />
                          <span className="text-xs">{wish.likeCount}</span>
                        </div>
                        {wish.joinCount && (
                          <div className="flex items-center gap-0.5">
                            <Icon name="group" size={14} />
                            <span className="text-xs">{wish.joinCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600 self-center" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
