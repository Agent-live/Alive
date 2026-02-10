import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Button, Card, Badge } from '@/components'

const productionSteps = [
  {
    name: '物料采集',
    description: '顶级桑蚕丝及复合面料已到库',
    icon: 'inventory_2',
    completed: true,
  },
  {
    name: 'AI 优化',
    description: 'AI 剪裁模型已完成细节优化',
    icon: 'auto_awesome',
    completed: true,
    images: [
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200',
    ],
  },
  {
    name: '手工缝制',
    description: '资深裁缝正在进行最后的拼装',
    icon: 'content_cut',
    completed: false,
    current: true,
    progress: 65,
  },
  {
    name: '物流配送',
    description: '完成质检后将立即发货',
    icon: 'local_shipping',
    completed: false,
  },
]

export function OrderDetailPage() {
  const navigate = useNavigate()

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">订单生产详情</h1>
          <button className="header-btn-end">
            <Icon name="more_horiz" size={24} />
          </button>
        </div>
      </header>

      <div className="pb-40 ">
        {/* Product Card */}
        <div className="p-5">
          <Card>
            <div className="flex gap-4">
              <div
                className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded border border-gray-50 flex-shrink-0"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200)' }}
              />
              <div className="flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="primary">正在生产</Badge>
                  </div>
                  <h2 className="text-lg font-bold leading-tight font-display tracking-tight">赛博朋克丝绸和服</h2>
                  <p className="text-gray-400 text-xs font-medium mt-1">订单编号: #AI-882-9421</p>
                </div>
                <div className="flex gap-2 items-center mt-3">
                  <span className="text-base font-bold">¥4,280.00</span>
                  <span className="text-xs text-gray-400">数量: 1</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="history" size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-500">预计 3 天后完成</span>
              </div>
              <Button variant="secondary" size="sm">
                查看实时进度
              </Button>
            </div>
          </Card>
        </div>

        {/* Production Progress */}
        <div className="px-7 py-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-md font-bold font-display tracking-tight">生产进度</h3>
          </div>
          <div className="relative">
            {productionSteps.map((step, index) => (
              <div key={step.name} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex size-9 items-center justify-center rounded-full ${
                      step.completed
                        ? 'bg-primary text-white'
                        : step.current
                        ? 'border border-primary bg-white text-primary'
                        : 'bg-gray-50 text-gray-300 border border-gray-100'
                    }`}
                  >
                    {step.completed ? (
                      <Icon name="check" size={18} />
                    ) : (
                      <Icon name={step.icon} size={18} />
                    )}
                  </div>
                  {index < productionSteps.length - 1 && (
                    <div
                      className={`w-[1px] grow h-10 ${
                        step.completed ? 'bg-primary/20' : 'bg-gray-100'
                      }`}
                      style={{ minHeight: step.images ? '80px' : step.current ? '60px' : '40px' }}
                    />
                  )}
                </div>
                <div className="pt-1 pb-6">
                  <h4
                    className={`font-bold text-base font-display ${
                      step.current ? 'text-primary' : step.completed ? 'text-luxury-black' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      step.current ? 'text-luxury-black font-medium' : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </p>
                  {step.images && (
                    <div className="mt-4 flex gap-2">
                      {step.images.map((img, imgIndex) => (
                        <div
                          key={imgIndex}
                          className="w-14 h-14 rounded bg-cover bg-center border border-gray-100"
                          style={{ backgroundImage: `url(${img})` }}
                        />
                      ))}
                    </div>
                  )}
                  {step.current && step.progress !== undefined && (
                    <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share CTA */}
        <div className="p-5">
          <Card className="bg-luxury-black text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-md font-bold font-display mb-1.5">晒出你的定制</h4>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                分享你的 AI 设计到社区，可获得 200 积分奖励
              </p>
              <div className="flex gap-3">
                <Button variant="primary" fullWidth>
                  发布到社区
                </Button>
                <button className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white backdrop-blur-sm">
                  <Icon name="share" size={18} />
                </button>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bottom-action">
        <div className="bottom-action-inner flex gap-3">
          <Button variant="secondary" fullWidth icon="headset_mic">
            帮助
          </Button>
          <Button variant="primary" fullWidth className="flex-[2]">
            购买同款
          </Button>
        </div>
      </div>
    </Layout>
  )
}
