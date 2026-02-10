import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout, Icon, Button } from '@/components'

// 模拟数据
const clothData = {
  id: '1',
  name: '星空渐变长裙',
  category: '裙装',
  season: ['春', '秋'],
  status: 'owned', // wanting | making | shipping | owned

  // 我的想法
  myThought: '想要一条像银河一样的裙子，深蓝到紫色的渐变，日常也能穿',

  // 三张核心图
  designImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
  tryOnImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
  realImage: 'https://images.unsplash.com/photo-1485968579169-a6b12a6e05ff?w=800',

  // 制作进度（温暖版）
  productionSteps: [
    { step: '找到了最好的面料', detail: '顶级桑蚕丝，触感超棒', done: true, icon: 'eco' },
    { step: '洛卡 帮你调整了版型', detail: '根据你的身材优化了细节', done: true, icon: 'auto_awesome' },
    { step: '裁缝师傅正在缝制', detail: '资深师傅手工制作中', done: false, current: true, icon: 'content_cut' },
    { step: '很快就要出发啦', detail: '完成后立即寄给你', done: false, icon: 'local_shipping' },
  ],

  // 时间线
  timeline: [
    { date: '1月15日', event: '告诉 洛卡 我的想法', type: 'create' },
    { date: '1月18日', event: '30人一起，开始制作', type: 'start' },
    { date: '1月25日', event: '制作完成，发货', type: 'ship' },
    { date: '1月27日', event: '收到啦！', type: 'arrive' },
  ],

  // 搭配建议
  matchSuggestions: [
    { id: '3', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400', name: '极简白衬衫' },
    { id: '5', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400', name: '复古格纹西装' },
  ],

  // 详情
  details: {
    fabric: '轻薄雪纺',
    length: '及膝',
    colors: ['#1e1b4b', '#7c3aed', '#f472b6'],
  },
}

export function ClothDetailPage() {
  const navigate = useNavigate()
  const { id: _id } = useParams() // TODO: 用 id 获取真实数据
  const [activeImage, setActiveImage] = useState<'design' | 'tryOn' | 'real'>('design')

  const images = {
    design: clothData.designImage,
    tryOn: clothData.tryOnImage,
    real: clothData.realImage,
  }

  const imageLabels = {
    design: '设计图',
    tryOn: 'AI试穿',
    real: '实物',
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="sticky top-0 z-50 surface-panel">
        <div className="flex items-center p-4 h-14 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="text-md font-bold">{clothData.name}</h1>
          <button className="size-10 flex items-center justify-end">
            <Icon name="more_horiz" size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto pb-32">
        {/* 主图区域 - 三图切换 */}
        <div className="relative">
          <div className="aspect-[3/4] surface-inset">
            <img
              src={images[activeImage]}
              alt={imageLabels[activeImage]}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 图片切换器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20">
            {(['design', 'tryOn', 'real'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveImage(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeImage === type ? 'bg-white text-black' : 'text-white'
                }`}
              >
                {imageLabels[type]}
              </button>
            ))}
          </div>

          {/* 状态标签 */}
          <div className="absolute top-4 left-4">
            {clothData.status === 'owned' ? (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                已在衣柜
              </span>
            ) : clothData.status === 'making' ? (
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                制作中
              </span>
            ) : clothData.status === 'shipping' ? (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                在路上
              </span>
            ) : (
              <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                想要的
              </span>
            )}
          </div>
        </div>

        {/* 我的想法 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Icon name="format_quote" size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">我的想法</p>
              <p className="text-sm text-gray-700 leading-relaxed">"{clothData.myThought}"</p>
            </div>
          </div>
        </div>

        {/* 制作进度 - 仅在制作中状态显示 */}
        {clothData.status === 'making' && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="precision_manufacturing" size={18} className="text-amber-500" />
              它是这样变成真的
            </h3>
            <p className="text-xs text-gray-400 mb-4">预计还有 3 天完成</p>

            <div className="space-y-4">
              {clothData.productionSteps.map((step, index) => (
                <div key={index} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done
                      ? 'bg-green-100'
                      : step.current
                        ? 'bg-amber-100'
                        : 'bg-gray-100'
                  }`}>
                    {step.done ? (
                      <Icon name="check" size={16} className="text-green-600" />
                    ) : (
                      <Icon name={step.icon} size={16} className={step.current ? 'text-amber-600' : 'text-gray-400'} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.current ? 'text-amber-600' : ''}`}>
                      {step.step}
                      {step.current && <span className="ml-2 text-xs">进行中...</span>}
                    </p>
                    <p className="text-xs text-gray-400">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 时间线 - 仅在已拥有状态显示 */}
        {clothData.status === 'owned' && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Icon name="timeline" size={18} className="text-primary" />
              这件衣服的故事
            </h3>
            <div className="space-y-4 ml-2">
              {clothData.timeline.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === clothData.timeline.length - 1 ? 'bg-green-500' : 'bg-primary'
                    }`} />
                    {index < clothData.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 -mt-1">
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-gray-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 洛卡 搭配建议 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Icon name="auto_awesome" size={12} className="text-white" />
            </div>
            <h3 className="font-bold">洛卡 的搭配建议</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">这件裙子可以和这些搭配</p>
          <div className="flex gap-3">
            {clothData.matchSuggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/closet/${item.id}`)}
                className="flex-1 cursor-pointer"
              >
                <div className="aspect-square rounded overflow-hidden bg-gray-100 mb-1">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-600 truncate">{item.name}</p>
              </div>
            ))}
            <div
              onClick={() => navigate('/')}
              className="flex-1 aspect-square rounded bg-gray-50 flex flex-col items-center justify-center cursor-pointer"
            >
              <Icon name="search" size={20} className="text-gray-300 mb-1" />
              <p className="text-xs text-gray-400">找更多</p>
            </div>
          </div>
        </div>

        {/* 衣服详情 */}
        <div className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Icon name="info" size={18} className="text-primary" />
            详情
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-400">分类</span>
              <span className="text-sm">{clothData.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-400">季节</span>
              <span className="text-sm">{clothData.season.join('、')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-400">面料</span>
              <span className="text-sm">{clothData.details.fabric}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-400">长度</span>
              <span className="text-sm">{clothData.details.length}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-400">配色</span>
              <div className="flex gap-1">
                {clothData.details.colors.map((color) => (
                  <div
                    key={color}
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作 - 优化按钮文案和布局 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 surface-panel border-t border-gray-100 max-w-md mx-auto">
        <div className="flex gap-2" style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}>
          {/* 图标按钮：试穿效果 */}
          <button
            onClick={() => navigate('/try-on')}
            className="h-11 w-11 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform"
            aria-label="查看试穿效果"
          >
            <Icon name="checkroom" size={20} />
          </button>
          {/* 主按钮：Remix 设计 */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            icon="auto_awesome"
            onClick={() => navigate('/luka/chat?mode=remix')}
          >
            做一件类似的
          </Button>
        </div>
      </div>
    </Layout>
  )
}
