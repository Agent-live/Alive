import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface HistoryItem {
  id: string
  title: string
  image: string
  viewedAt: string
  type: 'design' | 'wish' | 'product'
}

interface HistoryGroup {
  date: string
  items: HistoryItem[]
}

const mockHistory: HistoryGroup[] = [
  {
    date: '今天',
    items: [
      {
        id: '1',
        title: '星空渐变连衣裙',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
        viewedAt: '10:30',
        type: 'design',
      },
      {
        id: '2',
        title: '极简白衬衫设计',
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
        viewedAt: '09:15',
        type: 'wish',
      },
    ],
  },
  {
    date: '昨天',
    items: [
      {
        id: '3',
        title: '复古格纹外套',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
        viewedAt: '20:45',
        type: 'product',
      },
      {
        id: '4',
        title: '春季薄款风衣',
        image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
        viewedAt: '15:20',
        type: 'design',
      },
    ],
  },
  {
    date: '本周',
    items: [
      {
        id: '5',
        title: '夏日碎花裙',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
        viewedAt: '周三',
        type: 'wish',
      },
    ],
  },
]

export function HistoryPage() {
  const navigate = useNavigate()
  const [history] = useState(mockHistory)

  const getTypeLabel = (type: HistoryItem['type']) => {
    switch (type) {
      case 'design':
        return { text: '设计', color: 'bg-primary/10 text-primary' }
      case 'wish':
        return { text: '愿望', color: 'bg-blue-50 text-blue-500' }
      case 'product':
        return { text: '商品', color: 'bg-orange-50 text-orange-500' }
    }
  }

  const handleItemClick = (item: HistoryItem) => {
    switch (item.type) {
      case 'design':
        navigate(`/design/editor/${item.id}`)
        break
      case 'wish':
        navigate(`/wish/${item.id}`)
        break
      case 'product':
        navigate(`/product/${item.id}`)
        break
    }
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">浏览记录</h1>
          <button className="text-[15px] text-gray-500 dark:text-gray-400">
            清空
          </button>
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="history" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-400 dark:text-gray-500">暂无浏览记录</p>
            </div>
          ) : (
            history.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <h3 className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {group.date}
                </h3>
                <div className="space-y-2 px-4">
                  {group.items.map((item) => {
                    const typeInfo = getTypeLabel(item.type)
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                              {typeInfo.text}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{item.viewedAt}</span>
                          </div>
                        </div>
                        <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
