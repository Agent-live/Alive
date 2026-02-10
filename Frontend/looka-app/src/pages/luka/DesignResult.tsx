import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Button, Card, Badge } from '@/components'

const generatedDesigns = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    selected: true,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    selected: false,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    selected: false,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    selected: false,
  },
]

const designSpecs = [
  { label: '风格', value: '赛博朋克' },
  { label: '面料', value: '真丝混纺' },
  { label: '场景', value: '正式场合' },
  { label: '预算', value: '¥1,000-2,000' },
]

export function DesignResultPage() {
  const navigate = useNavigate()
  const [selectedDesign, setSelectedDesign] = useState('1')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const selectedImage = generatedDesigns.find(d => d.id === selectedDesign)?.image

  const handleSaveToCloset = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      navigate('/closet')
    }, 800)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="close" size={24} />
          </button>
          <h1 className="header-title-center">AI 设计结果</h1>
          <button onClick={() => navigate('/parameter-edit')} className="header-btn-end">
            <Icon name="tune" size={24} />
          </button>
        </div>
      </header>

      <div className="pb-36 ">
        {/* Main Design Preview */}
        <div className="relative aspect-[3/4] bg-gray-100">
          <img
            src={selectedImage}
            alt="Generated Design"
            className="w-full h-full object-cover"
          />
          {/* AI Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant="primary">
              <Icon name="auto_awesome" size={12} className="inline mr-1" />
              AI 生成
            </Badge>
          </div>
          {/* Regenerate Button */}
          <button className="absolute top-4 right-4 size-10 surface-glass rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Icon name="refresh" size={20} className="text-gray-700" />
          </button>
          {/* Navigation */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {generatedDesigns.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setSelectedDesign(generatedDesigns[index].id)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Design Thumbnails */}
        <div className="p-4">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {generatedDesigns.map((design, index) => (
              <button
                key={design.id}
                onClick={() => {
                  setSelectedDesign(design.id)
                  setCurrentIndex(index)
                }}
                className={`flex-shrink-0 w-20 h-28 rounded overflow-hidden border-2 transition-all active:scale-95 ${
                  selectedDesign === design.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent'
                }`}
              >
                <img
                  src={design.image}
                  alt={`Design ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {/* Generate More Button */}
            <button className="flex-shrink-0 w-20 h-28 rounded border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
              <Icon name="add" size={24} className="text-gray-400" />
              <span className="text-xs text-gray-400">更多</span>
            </button>
          </div>
        </div>

        {/* Design Specs */}
        <div className="px-4">
          <Card>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Icon name="description" size={18} className="text-primary" />
              设计参数
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {designSpecs.map((spec) => (
                <div key={spec.label} className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                    {spec.label}
                  </p>
                  <p className="text-sm font-medium">{spec.value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/parameter-edit')}
              className="w-full mt-4 py-3 text-center text-sm text-primary font-medium border border-primary/20 rounded hover:bg-primary/5 transition-colors active:scale-[0.98]"
            >
              <Icon name="edit" size={16} className="inline mr-1" />
              调整参数重新生成
            </button>
          </Card>
        </div>

        {/* Production Info */}
        <div className="px-4 mt-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-green-100 rounded flex items-center justify-center">
                <Icon name="verified" size={24} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">可立即生产</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  此设计已通过 AI 可生产性检测，预计 5-7 天交付
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Estimated Price */}
        <div className="px-4 mt-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">预估价格</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-primary">¥1,280</span>
                  <span className="text-sm text-gray-400 line-through">¥1,890</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">拼团价</p>
                <p className="text-lg font-bold text-green-600">¥980</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bottom-action">
        <div className="bottom-action-inner flex gap-2">
          {/* 图标按钮：试穿 */}
          <button
            onClick={() => navigate('/try-on')}
            className="h-11 w-11 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform"
            aria-label="虚拟试穿"
          >
            <Icon name="checkroom" size={20} />
          </button>
          {/* 图标按钮：收藏 */}
          <button
            onClick={handleSaveToCloset}
            disabled={isSaving}
            className="h-11 w-11 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            aria-label="收藏到衣柜"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Icon name="bookmark" size={20} />
            )}
          </button>
          {/* 主按钮：发起愿望 */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => navigate('/wish/create')}
          >
            发起愿望，找人一起
          </Button>
        </div>
      </div>
    </Layout>
  )
}
