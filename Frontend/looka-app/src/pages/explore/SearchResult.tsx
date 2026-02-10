import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout, Icon, CardMasonry, Badge, ImageSwap, LikeButton } from '@/components'
import { ProductListSkeleton, EmptySearch, NetworkError } from '@/components/feedback'
import { productApi } from '@/api/products'
import { useRefreshWithDeps, useSearchHistory } from '@/hooks'
import { ProductCard, ProductStatus } from '@/types'

// 风格标签筛选
const styleFilters = ['全部', '梦幻', '简约', '复古', '街头', '优雅', '甜酷']

// 排序选项
const sortOptions = [
  { value: 'relevant', label: '综合' },
  { value: 'newest', label: '最新' },
  { value: 'popular', label: '热门' },
  { value: 'price_low', label: '价格低' },
  { value: 'price_high', label: '价格高' },
]

const statusConfig: Record<ProductStatus, { text: string; variant: 'wishing' | 'making' | 'owned' | 'shipping' }> = {
  wishing: { text: '等人一起', variant: 'wishing' },
  making: { text: '制作中', variant: 'making' },
  shipping: { text: '运输中', variant: 'shipping' },
  owned: { text: '已实现', variant: 'owned' },
}

/**
 * SearchResultPage - 搜索结果页面
 *
 * 功能：
 * - 显示搜索结果列表
 * - 支持风格筛选
 * - 支持排序切换
 * - 记录搜索历史
 */
export function SearchResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''

  const [activeStyle, setActiveStyle] = useState(0)
  const [activeSort, setActiveSort] = useState('relevant')
  const [products, setProducts] = useState<ProductCard[]>([])
  const [showSortMenu, setShowSortMenu] = useState(false)

  const { addToHistory } = useSearchHistory()

  // 记录搜索历史
  useEffect(() => {
    if (keyword) {
      addToHistory(keyword)
    }
  }, [keyword, addToHistory])

  // 获取搜索结果
  const fetchResults = useCallback(async () => {
    const sortMap: Record<string, 'newest' | 'popular'> = {
      relevant: 'newest',
      newest: 'newest',
      popular: 'popular',
      price_low: 'newest',
      price_high: 'newest',
    }

    const response = await productApi.getProducts({
      keyword: keyword,
      sortBy: sortMap[activeSort],
      tags: activeStyle > 0 ? [styleFilters[activeStyle]] : undefined,
    })

    let items = response.items

    // 客户端排序（因为 mock API 不支持价格排序）
    if (activeSort === 'price_low') {
      items = [...items].sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (activeSort === 'price_high') {
      items = [...items].sort((a, b) => (b.price || 0) - (a.price || 0))
    }

    setProducts(items)
    return items
  }, [keyword, activeStyle, activeSort])

  const { loading, error, refresh } = useRefreshWithDeps(fetchResults, [keyword, activeStyle, activeSort])

  // 乐观更新点赞
  const handleLike = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')

    const result = await productApi.toggleLike(productId)

    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, isLiked: result.liked, likes: result.likes }
          : p
      )
    )

    return result
  }, [products])

  // 重新搜索
  const handleNewSearch = () => {
    navigate('/search')
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="flex items-center gap-2 px-3 py-2 max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="header-btn-start"
            aria-label="返回"
          >
            <Icon name="arrow_back_ios" size={20} className="text-gray-600" />
          </button>

          {/* 搜索框（点击跳转到搜索页） */}
          <button
            onClick={handleNewSearch}
            className="flex-1 flex items-center bg-gray-100 rounded-full px-4 h-10"
          >
            <Icon name="search" size={18} className="text-gray-400 mr-2" />
            <span className="text-sm text-gray-800 truncate">{keyword}</span>
          </button>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="h-10 px-3 flex items-center gap-1 text-sm text-gray-600"
          >
            <Icon name="tune" size={18} />
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto">
          {/* 排序选项 */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-50">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveSort(option.value)}
                className={`text-sm transition-colors ${
                  activeSort === option.value
                    ? 'text-primary font-medium'
                    : 'text-gray-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 风格标签 */}
          <div className="style-tags px-2">
            {styleFilters.map((style, index) => (
              <button
                key={style}
                onClick={() => setActiveStyle(index)}
                className={`style-tag ${
                  index === activeStyle ? 'style-tag-active' : 'style-tag-inactive'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <main className="content-masonry">
        {/* 搜索统计 */}
        {!loading && !error && (
          <div className="px-2 py-3">
            <p className="text-sm text-gray-500">
              找到 <span className="text-primary font-medium">{products.length}</span> 个"{keyword}"相关结果
            </p>
          </div>
        )}

        {/* 加载状态 */}
        {loading && <ProductListSkeleton count={6} />}

        {/* 错误状态 */}
        {error && !loading && <NetworkError onRetry={refresh} />}

        {/* 空状态 */}
        {!loading && !error && products.length === 0 && (
          <div className="py-8">
            <EmptySearch keyword={keyword} />
            <div className="text-center mt-4">
              <button
                onClick={handleNewSearch}
                className="text-primary text-sm font-medium"
              >
                重新搜索
              </button>
            </div>
          </div>
        )}

        {/* 搜索结果列表 */}
        {!loading && !error && products.length > 0 && (
          <CardMasonry
            columns={{ default: 2, sm: 2, md: 2, lg: 2 }}
            gap={6}
          >
            {products.map((product, index) => {
              const aspectRatios = ['aspect-card-1', 'aspect-card-2', 'aspect-card-3', 'aspect-card-4']
              const aspectRatio = aspectRatios[index % aspectRatios.length]
              const config = statusConfig[product.status]

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/group-buy/${product.id}`)}
                  className="card-masonry card-interactive"
                >
                  {/* 图片区域 */}
                  <div className={`relative ${aspectRatio}`}>
                    <ImageSwap
                      mainImage={product.image}
                      thumbImage={product.thumbImage || product.image}
                      alt={product.name}
                      className="w-full h-full rounded-t-sm overflow-hidden"
                      thumbSize="md"
                    />
                    {/* 状态标签 */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <Badge variant={config.variant} size="sm">
                        {config.text}
                      </Badge>
                    </div>
                  </div>
                  {/* 信息区域 */}
                  <div className="px-1.5 py-2">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1 min-w-0">
                        {product.designer?.avatar && (
                          <img
                            src={product.designer.avatar}
                            alt={product.designer.name}
                            className="w-4 h-4 object-cover flex-shrink-0 rounded-full"
                          />
                        )}
                        <span className="text-xs text-gray-500 truncate">
                          {product.designer?.name || '设计师'}
                        </span>
                      </div>
                      <LikeButton
                        isLiked={product.isLiked ?? false}
                        likes={product.likes || 0}
                        onToggle={() => handleLike(product.id)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardMasonry>
        )}

        {/* 底部提示 */}
        {!loading && !error && products.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">没有找到想要的？</p>
            <button
              onClick={() => navigate('/luka')}
              className="text-primary text-sm font-medium mt-1"
            >
              让 洛卡 帮你设计
            </button>
          </div>
        )}
      </main>
    </Layout>
  )
}
