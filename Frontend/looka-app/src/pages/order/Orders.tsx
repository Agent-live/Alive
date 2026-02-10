import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header, Icon, Card, Badge, Button } from '@/components'

const tabs = ['全部', '待付款', '生产中', '待收货', '已完成']

const orders = [
  {
    id: 'AI-882-9421',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    title: '赛博朋克丝绸和服',
    price: 4280,
    quantity: 1,
    status: 'producing',
    progress: 65,
    estimatedDays: 3,
    steps: [
      { name: '物料采集', completed: true },
      { name: 'AI 优化', completed: true },
      { name: '手工缝制', completed: false, current: true },
      { name: '物流配送', completed: false },
    ],
  },
  {
    id: 'AI-773-8312',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    title: '极简主义廓形外套',
    price: 890,
    quantity: 1,
    status: 'pending',
    groupBuy: {
      current: 8,
      target: 10,
    },
  },
]

const statusConfig = {
  pending: { label: '待付款', variant: 'warning' as const },
  producing: { label: '正在生产', variant: 'primary' as const },
  shipping: { label: '待收货', variant: 'info' as const },
  completed: { label: '已完成', variant: 'success' as const },
}

export function OrdersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Layout>
      <Header title="我的订单" />

      {/* Tabs */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
        <div className="flex px-2 overflow-x-auto hide-scrollbar">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                index === activeTab
                  ? 'text-primary border-primary'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-visible">
            {/* Order Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400">订单编号: #{order.id}</span>
              <Badge variant={statusConfig[order.status as keyof typeof statusConfig].variant}>
                {statusConfig[order.status as keyof typeof statusConfig].label}
              </Badge>
            </div>

            {/* Product Info */}
            <div className="flex gap-4">
              <div
                className="w-24 h-24 rounded bg-cover bg-center flex-shrink-0 border border-gray-100"
                style={{ backgroundImage: `url(${order.image})` }}
              />
              <div className="flex-1">
                <h3 className="font-bold text-sm line-clamp-2">{order.title}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-primary font-bold">¥{order.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">x{order.quantity}</span>
                </div>
              </div>
            </div>

            {/* Production Progress */}
            {order.status === 'producing' && order.steps && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">
                    <Icon name="history" size={14} className="inline mr-1" />
                    预计 {order.estimatedDays} 天后完成
                  </span>
                  <button onClick={() => navigate(`/order/${order.id}`)} className="text-xs text-primary font-medium">查看详情</button>
                </div>
                <div className="flex items-center gap-2">
                  {order.steps.map((step, index) => (
                    <div key={step.name} className="flex items-center gap-2 flex-1">
                      <div
                        className={`size-6 rounded-full flex items-center justify-center text-xs ${
                          step.completed
                            ? 'bg-primary text-white'
                            : step.current
                            ? 'border-2 border-primary text-primary'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {step.completed ? <Icon name="check" size={14} /> : index + 1}
                      </div>
                      {index < order.steps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 ${
                            step.completed ? 'bg-primary/30' : 'bg-gray-100'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group Buy Progress */}
            {order.groupBuy && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">拼团进度</span>
                  <span className="text-xs font-bold text-primary">
                    {order.groupBuy.current}/{order.groupBuy.target} 人
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(order.groupBuy.current / order.groupBuy.target) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  还差 {order.groupBuy.target - order.groupBuy.current} 人即可成团开始生产
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="sm" fullWidth icon="headset_mic">
                帮助
              </Button>
              <Button variant="primary" size="sm" fullWidth>
                {order.status === 'pending' ? '立即付款' : '购买同款'}
              </Button>
            </div>
          </Card>
        ))}

        {/* Share CTA */}
        <Card className="bg-luxury-black text-white">
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-1">晒出你的定制</h4>
            <p className="text-white/50 text-xs mb-4">
              分享你的 AI 设计到社区，可获得 200 积分奖励
            </p>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" fullWidth>
                发布到社区
              </Button>
              <button className="size-10 rounded-full bg-white/10 flex items-center justify-center">
                <Icon name="share" size={18} className="text-white" />
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />
        </Card>
      </div>
    </Layout>
  )
}
