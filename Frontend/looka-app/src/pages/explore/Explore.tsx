import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, CardMasonry, ImageSwap, LikeButton } from '@/components'
import { ProductListSkeleton, EmptyState, NetworkError } from '@/components/feedback'
import { productApi } from '@/api/products'
import { useRefreshWithDeps } from '@/hooks'
import { ProductCard, ProductStatus } from '@/types'

// 主导航
const mainTabs = ['关注', '最近', '热门']

// 风格标签
const styles = ['全部', '梦幻', '简约', '复古', '街头', '优雅', '甜酷']

const statusConfig: Record<ProductStatus, { text: string; variant: 'wishing' | 'making' | 'owned' | 'shipping' }> = {
  wishing: { text: '等人一起', variant: 'wishing' },
  making: { text: '制作中', variant: 'making' },
  shipping: { text: '运输中', variant: 'shipping' },
  owned: { text: '已实现', variant: 'owned' },
}

export function ExplorePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(1)
  const [activeStyle, setActiveStyle] = useState(0)
  const [products, setProducts] = useState<ProductCard[]>([])

  // 使用 useRefreshWithDeps 解决刷新问题
  const fetchProducts = useCallback(async () => {
    const sortMap = ['newest', 'newest', 'popular'] as const
    const response = await productApi.getProducts({
      sortBy: sortMap[activeTab] as 'newest' | 'popular',
      tags: activeStyle > 0 ? [styles[activeStyle]] : undefined,
    })
    setProducts(response.items)
    return response.items
  }, [activeTab, activeStyle])

  const { loading, error, refresh } = useRefreshWithDeps(fetchProducts, [activeTab, activeStyle])

  // 乐观更新点赞
  const handleLike = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')

    const result = await productApi.toggleLike(productId)

    // 更新本地状态
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, isLiked: result.liked, likes: result.likes }
          : p
      )
    )

    return result
  }, [products])

  return (
    <Layout>
      {/* Header */}
      <div className="header-main">
        <div className="header-main-inner">
          <h1 className="header-title">逛逛</h1>
          <div className="tabs-header">
            {mainTabs.map((tab, index) => (
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
          <button onClick={() => navigate('/search')} className="header-btn">
            <Icon name="search" size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <main className="content-masonry">
        {/* 风格标签 */}
        <div className="style-tags">
          {styles.map((style, index) => (
            <button
              key={style}
              onClick={() => setActiveStyle(index)}
              className={`style-tag ${
                index === activeStyle ? 'style-tag-active' : 'style-tag-inactive'
              }`}
            >
              {/* {style} */}
            </button>
          ))}
        </div>

        {/* 加载状态 */}
        {loading && <ProductListSkeleton count={6} />}

        {/* 错误状态 - 使用 refresh 修复重试问题 */}
        {error && !loading && <NetworkError onRetry={refresh} />}

        {/* 空状态 */}
        {!loading && !error && products.length === 0 && (
          <EmptyState
            icon="explore"
            title="暂无内容"
            description="稍后再来看看吧"
          />
        )}

        {/* 设计卡片 */}
        {!loading && !error && products.length > 0 && (
          <>
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
                    className="card-masonry card-masonry-minimal card-interactive"
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
                    </div>
                    {/* 信息区域 */}
                    <div className="px-2.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-medium leading-tight line-clamp-1">{product.name}</h3>
                        <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                          {config.text}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {product.designer?.avatar && (
                            <img
                              src={product.designer.avatar}
                              alt={product.designer.name}
                              className="w-4 h-4 object-cover flex-shrink-0 rounded-full"
                            />
                          )}
                          <span className="card-meta truncate">
                            {product.designer?.name || '设计师'}
                          </span>
                        </div>
                        <LikeButton
                          isLiked={product.isLiked ?? false}
                          likes={product.likes || 0}
                          onToggle={() => handleLike(product.id)}
                          size="sm"
                          className="card-meta"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardMasonry>

            {/* 底部提示 */}
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">看到喜欢的？点击加入愿望</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">或者创作你自己的设计</p>
            </div>
          </>
        )}

      </main>
    </Layout>
  )
}
