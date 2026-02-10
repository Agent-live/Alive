import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Button, Card } from '@/components'

const designs = [
  {
    id: '1',
    name: '极简和风设计',
    price: 599,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tags: ['建议试穿', '可投产'],
    recommended: true,
  },
  {
    id: '2',
    name: '赛博丝绸长衫',
    price: 780,
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tags: ['可投产'],
  },
  {
    id: '3',
    name: '未来主义纹样',
    price: 420,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tags: ['建议试穿'],
  },
  {
    id: '4',
    name: '解构风羽织',
    price: 660,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tags: ['可投产'],
  },
]

export function DesignSchemePage() {
  const navigate = useNavigate()
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleSave = (id: string) => {
    setSavingId(id)
    setTimeout(() => {
      setSavingId(null)
    }, 800)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="sticky top-0 z-50 surface-panel border-b border-gray-100">
        <div className="flex items-center p-4 h-14 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-start">
            <Icon name="arrow_back_ios" size={20} className="text-gray-900" />
          </button>
          <h1 className="text-md font-bold tracking-tight flex-1 text-center">设计方案与试穿</h1>
          <button className="size-10 flex items-center justify-end">
            <Icon name="share" size={22} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 pb-32 space-y-4">
        {/* Design Grid */}
        <div className="grid grid-cols-2 gap-4">
          {designs.map((design) => (
            <div
              key={design.id}
              className="bg-white rounded overflow-hidden shadow-sm border border-gray-100 flex flex-col"
            >
              <div
                className="relative aspect-[3/4] cursor-pointer"
                onClick={() => navigate('/try-on')}
              >
                <img
                  src={design.image}
                  alt={design.name}
                  className="w-full h-full object-cover"
                />
                {/* User Photo Overlay */}
                <div className="absolute bottom-2 right-2 w-14 h-14 rounded-full border-2 border-white overflow-hidden shadow-lg">
                  <img
                    src={design.userPhoto}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Tags */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {design.recommended && (
                    <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      建议试穿
                    </span>
                  )}
                  {design.tags.includes('可投产') && (
                    <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      可投产
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">{design.name}</span>
                  <span className="text-primary text-sm font-bold">¥{design.price}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/parameter-edit')}
                    className="flex-1 py-1.5 bg-gray-50 border border-gray-100 text-xs font-bold rounded hover:bg-gray-100 transition-colors active:scale-95"
                  >
                    编辑参数
                  </button>
                  <button
                    onClick={() => handleSave(design.id)}
                    className="flex-1 py-1.5 bg-primary text-white text-xs font-bold rounded shadow-sm shadow-primary/20 active:scale-95 transition-transform"
                  >
                    {savingId === design.id ? '已保存' : '保存衣柜'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Management Card */}
        <Card
          className="flex items-center justify-between cursor-pointer hover:border-gray-200 transition-colors active:scale-[0.99]"
          onClick={() => navigate('/orders')}
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="shopping_bag" size={20} className="text-primary" />
            </div>
            <div>
              <h4 className="text-base font-bold">统一订单管理</h4>
              <p className="text-gray-400 text-sm">查看您正在生产和待发货的单品</p>
            </div>
          </div>
          <Icon name="chevron_right" size={20} className="text-gray-300" />
        </Card>

        {/* Share CTA */}
        <Card className="bg-luxury-black text-white overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-1">发布到社区</h4>
            <p className="text-white/60 text-sm mb-5 leading-relaxed">
              分享您的虚拟试穿效果，赢取积分与定制礼券。
            </p>
            <div className="flex gap-3">
              <Button variant="primary" fullWidth onClick={() => navigate('/')}>
                立即发布
              </Button>
              <button className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors active:scale-95">
                <Icon name="ios_share" size={20} />
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-[40px]" />
        </Card>
      </div>
    </Layout>
  )
}
