import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Button } from '@/components'

const sizes = [
  { label: 'S', spec: '160/84A' },
  { label: 'M', spec: '165/88A' },
  { label: 'L', spec: '170/92A' },
  { label: 'XL', spec: '175/96A' },
]

const images = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
]

export function ProductDetailPage() {
  const navigate = useNavigate()
  const [currentImage, setCurrentImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('S')
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <div className="flex gap-6">
            <span className="text-sm font-bold text-primary border-b-2 border-primary pb-1">商品</span>
            <span className="text-sm font-medium text-gray-400">详情</span>
            <span className="text-sm font-medium text-gray-400">评价</span>
          </div>
          <button className="header-btn-end">
            <Icon name="share" size={20} />
          </button>
        </div>
      </header>

      <div className="pb-40 ">
        {/* Product Image Gallery */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={images[currentImage]}
            alt="Product"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-6 right-6 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="text-white text-xs font-medium">{currentImage + 1}/{images.length}</span>
          </div>
          {/* Thumbnail dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImage ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 bg-white">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-display text-luxury-black">¥1,280</span>
              <span className="text-sm text-gray-400 line-through">¥1,890</span>
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex flex-col items-center"
            >
              <Icon
                name="favorite"
                size={20}
                filled={isFavorite}
                className={isFavorite ? 'text-primary' : 'text-gray-400'}
              />
              <span className="text-xs text-gray-400 mt-0.5">1.2k</span>
            </button>
          </div>
          <h1 className="text-xl font-bold leading-snug mb-3">Cyberpunk 高定真丝和服 - AI 联名限量款</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            融合未来主义美学与传统剪裁，每一件均由 AI 算法优化版型，工匠手工打造。
          </p>
        </div>

        {/* Sections */}
        <div className="mt-2 space-y-2">
          {/* Fabric Details */}
          <section className="bg-white p-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              面料工艺
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="h-40 rounded overflow-hidden bg-gray-50">
                <img
                  src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"
                  alt="Texture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-40 rounded overflow-hidden bg-gray-50">
                <img
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400"
                  alt="Detail"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              选用 30 姆米顶级桑蚕丝，结合数字提花技术。面料具有独特的偏光质感，在不同光线下呈现赛博朋克式的色泽变换。
            </p>
          </section>

          {/* Size Guide */}
          <section className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                尺码指南
              </h3>
              <button
                onClick={() => navigate('/try-on')}
                className="text-sm text-primary font-medium"
              >
                AI 智能量体 &gt;
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              {sizes.map((size) => (
                <button
                  key={size.label}
                  onClick={() => setSelectedSize(size.label)}
                  className={`flex-shrink-0 px-6 py-3 rounded text-center transition-colors ${
                    selectedSize === size.label
                      ? 'border border-primary bg-primary/5'
                      : 'border border-gray-100'
                  }`}
                >
                  <div className="text-base font-bold">{size.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{size.spec}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Delivery Time */}
          <section className="bg-white p-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              预计周期
            </h3>
            <div className="flex items-center justify-between p-4 rounded bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="bolt" size={20} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold">预计 72 小时内发货</div>
                  <div className="text-xs text-gray-400">目前生产线空闲，极速定制</div>
                </div>
              </div>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[80%] rounded-full" />
              </div>
            </div>
          </section>

          {/* Production Preview */}
          <section className="bg-white p-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              生产预览
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">生产方式</span>
                <span className="text-sm font-medium">轻定制 · 个性化剪裁</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">面料来源</span>
                <span className="text-sm font-medium">杭州桑蚕丝工厂</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">工艺认证</span>
                <span className="text-sm font-medium text-primary">AI 版型优化</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bottom-action">
        <div className="bottom-action-inner flex items-center gap-3">
          <div className="flex flex-col items-center justify-center px-2">
            <Icon name="headset_mic" size={22} className="text-gray-900" />
            <span className="text-xs text-gray-500 mt-0.5">客服</span>
          </div>
          <div className="flex flex-col items-center justify-center px-2">
            <Icon name="shopping_bag" size={22} className="text-gray-900" />
            <span className="text-xs text-gray-500 mt-0.5">购物车</span>
          </div>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => navigate('/group-buy/1')}
          >
            发起拼单
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
          >
            直接购买
          </Button>
        </div>
      </div>
    </Layout>
  )
}
