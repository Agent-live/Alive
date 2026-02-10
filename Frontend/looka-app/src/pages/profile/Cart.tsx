import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface CartItem {
  id: string
  name: string
  image: string
  price: number
  originalPrice: number
  size: string
  quantity: number
  selected: boolean
}

const mockCartItems: CartItem[] = [
  {
    id: '1',
    name: '星空渐变连衣裙',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    price: 299,
    originalPrice: 399,
    size: 'M',
    quantity: 1,
    selected: true,
  },
  {
    id: '2',
    name: '极简白衬衫',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
    price: 159,
    originalPrice: 199,
    size: 'S',
    quantity: 1,
    selected: true,
  },
  {
    id: '3',
    name: '复古格纹外套',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    price: 459,
    originalPrice: 599,
    size: 'L',
    quantity: 1,
    selected: false,
  },
]

export function CartPage() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [editMode, setEditMode] = useState(false)

  const toggleSelect = (id: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const toggleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected)
    setCartItems(prev =>
      prev.map(item => ({ ...item, selected: !allSelected }))
    )
  }

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    )
  }

  const removeSelected = () => {
    setCartItems(prev => prev.filter(item => !item.selected))
    setEditMode(false)
  }

  const selectedItems = cartItems.filter(item => item.selected)
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalSaved = selectedItems.reduce((sum, item) => sum + (item.originalPrice - item.price) * item.quantity, 0)

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">购物车 ({cartItems.length})</h1>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-[15px] text-primary font-medium"
          >
            {editMode ? '完成' : '管理'}
          </button>
        </div>
      </div>

      <div className="content-detail pb-32">
        <div className="max-w-md mx-auto py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="shopping_cart" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-400 dark:text-gray-500 mb-4">购物车是空的</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-primary text-white text-sm rounded-full"
              >
                去逛逛
              </button>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  {/* 选择框 */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.selected
                        ? 'bg-primary border-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {item.selected && (
                      <Icon name="check" size={14} className="text-white" />
                    )}
                  </button>

                  {/* 图片 */}
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">尺码: {item.size}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary font-bold">¥{item.price}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through">¥{item.originalPrice}</span>
                      </div>
                      {!editMode && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                          >
                            <Icon name="remove" size={14} className="text-gray-600 dark:text-gray-300" />
                          </button>
                          <span className="text-sm w-6 text-center dark:text-gray-200">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                          >
                            <Icon name="add" size={14} className="text-gray-600 dark:text-gray-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 surface-panel border-t border-gray-100 dark:border-gray-700/50 max-w-md mx-auto">
          <div className="p-4 pb-safe flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  cartItems.every(item => item.selected)
                    ? 'bg-primary border-primary'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {cartItems.every(item => item.selected) && (
                  <Icon name="check" size={14} className="text-white" />
                )}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">全选</span>
            </div>

            {editMode ? (
              <button
                onClick={removeSelected}
                disabled={selectedItems.length === 0}
                className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-full disabled:opacity-50"
              >
                删除 ({selectedItems.length})
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">合计:</span>
                    <span className="text-lg font-bold text-primary">¥{totalPrice}</span>
                  </div>
                  {totalSaved > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">已省 ¥{totalSaved}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2.5 bg-primary text-white font-medium rounded-full disabled:opacity-50"
                >
                  结算 ({selectedItems.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .pb-safe {
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
      `}</style>
    </Layout>
  )
}
