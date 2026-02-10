import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, LukaAvatar, Card } from '@/components'

export function TryOnPage() {
  const navigate = useNavigate()
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderRef = useRef<HTMLDivElement>(null)

  const currentDreamers = 8
  const targetDreamers = 10
  const daysLeft = 3

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return
    handleSliderMove(e.clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleSliderMove(e.touches[0].clientX)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} className="text-gray-600" />
          </button>
          <h1 className="header-title-center">AI 试穿</h1>
          <button className="header-btn-end">
            <Icon name="share" size={22} className="text-gray-600" />
          </button>
        </div>
      </div>

      <main className="content-detail">
        {/* 对比滑块 */}
        <div className="pt-2">
          <div
            ref={sliderRef}
            className="relative aspect-[3/4] rounded overflow-hidden cursor-ew-resize bg-gray-100"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* 右侧：试穿效果 */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800)' }}
            />

            {/* 左侧：原图（没穿这件衣服） */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800)',
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            />

            {/* 滑块手柄 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Icon name="drag_indicator" size={20} className="text-gray-400" />
              </div>
            </div>

            {/* 左侧标签 */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
              <span className="text-white text-xs font-medium">原图</span>
            </div>

            {/* 右侧标签 */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full">
              <span className="text-white text-xs font-medium">试穿效果</span>
            </div>

            {/* 顶部提示 */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
              <span className="text-white text-xs">← 左右滑动对比 →</span>
            </div>

            {/* 中间底部：衣服缩略图 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-14 rounded overflow-hidden border-2 border-white shadow-lg bg-white">
              <img
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200"
                alt="衣服"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 衣服信息 */}
        <div className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">星空渐变长裙</h2>
              <p className="text-sm text-gray-500 mt-1">"想要一条像银河一样的裙子"</p>
            </div>
            {/* 价格 */}
            <div className="text-right">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-primary">¥299</span>
                <span className="text-sm text-gray-400 line-through">¥399</span>
              </div>
              <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">省100元</span>
            </div>
          </div>

          {/* 版型信息 */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">宽松版型</span>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">及膝长度</span>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">轻薄雪纺</span>
          </div>
        </div>

        {/* 洛卡 的建议 */}
        <div className="mt-4">
          <div className="bg-primary/5 rounded p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <LukaAvatar size="sm" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">洛卡 觉得</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  这件裙子很适合你！宽松的版型刚好修饰腰线，颜色也很衬你的肤色~
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 愿望进度 - 核心信息 */}
        <div className="mt-4">
          <Card className="bg-primary/5 border-primary/10">
            <div className="text-center mb-4">
              <p className="text-gray-500 text-sm">这个愿望</p>
              <p className="text-2xl font-bold mt-1">
                还差 <span className="text-primary">{targetDreamers - currentDreamers}</span> 个人
              </p>
              <p className="text-gray-500 text-sm">就能一起拥有它了</p>
            </div>

            {/* 进度 */}
            <div className="relative">
              <div className="flex justify-between mb-2">
                {[...Array(targetDreamers)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${i < currentDreamers
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-300'
                      }`}
                  >
                    {i < currentDreamers ? (
                      <Icon name="favorite" size={12} filled />
                    ) : (
                      <Icon name="favorite_border" size={12} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Icon name="schedule" size={16} />
              <span>还有 {daysLeft} 天</span>
            </div>
          </Card>
        </div>

        {/* 它会怎样来到你身边 */}
        <div className="mt-4">
          <Card>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Icon name="auto_awesome" size={20} className="text-primary" />
              愿望如何实现
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">愿望达成，开始制作</p>
                  <p className="text-xs text-gray-500 mt-0.5">洛卡 会通知你</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">专属工坊手工制作</p>
                  <p className="text-xs text-gray-500 mt-0.5">大约需要 5-7 天</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">愿望成真，送到你手上</p>
                  <p className="text-xs text-gray-500 mt-0.5">你的 Dream Dress 来了</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                如果人数不够，会全额退回，放心许愿
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* 底部操作栏 */}
      <div className="bottom-action">
        <div className="bottom-action-inner">
          <button className="w-full h-12 bg-primary text-white text-base font-bold rounded shadow-md shadow-primary/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <Icon name="favorite" size={18} filled />
            我也想要
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            人齐了才开始，放心许愿
          </p>
        </div>
      </div>
    </Layout>
  )
}
