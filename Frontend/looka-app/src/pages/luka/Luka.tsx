import { useNavigate } from 'react-router-dom'
import { Layout, Icon, LukaAvatar, ChatInput } from '@/components'

// 功能场景卡片
const featureCards = [
  {
    id: 'describe',
    title: '描述想法',
    example: '我想要一条像星空一样的裙子',
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=100',
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=100',
    ],
    bgColor: 'bg-primary/10 dark:bg-primary/15',
  },
  {
    id: 'inspiration',
    title: '上传灵感',
    example: '帮我做类似这张图的感觉',
    images: [
      'https://images.unsplash.com/photo-1485968579169-a6b12a6e05ff?w=100',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100',
    ],
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 'remix',
    title: '改造衣柜',
    example: '帮我把这件改成更日常的版本',
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100',
    ],
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
]

export function LukaPage() {
  const navigate = useNavigate()

  const handleCardClick = (cardId: string) => {
    navigate(`/luka/chat?mode=${cardId}`)
  }

  // 安全退出 洛卡 - 如果没有历史记录则回到首页
  const handleExit = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  // 处理发送消息
  const handleSend = (value: string) => {
    navigate(`/luka/chat?mode=describe&q=${encodeURIComponent(value)}`)
  }

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    sessionStorage.setItem('inspiration_image', imageUrl)
    sessionStorage.setItem('inspiration_image_name', file.name)
    navigate('/luka/chat?mode=inspiration&hasImage=true')
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={handleExit} className="header-btn">
            <Icon name="close" size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <LukaAvatar size="xs" />
            <span className="font-bold dark:text-gray-100">洛卡</span>
          </div>
          <button className="header-btn">
            <Icon name="more_horiz" size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </header>

      <div className="content-page">
        {/* 洛卡 自我介绍 */}
        <div className="py-6">
          <div className="bg-gray-800/50 dark:bg-gray-800/80 rounded p-5 mb-6 border border-gray-700">
            <p className="text-base leading-relaxed text-gray-300">
              Hi，我是 <span className="text-primary font-medium">洛卡</span>，帮你把脑海里的衣服变成真的。
              <br /><br />
              告诉我你想要什么，或者发张图给我看看，我来帮你实现～
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {featureCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`flex-shrink-0 w-40 ${card.bgColor} rounded-xl p-4 text-left transition-transform active:scale-95 border border-gray-100 dark:border-gray-700`}
              >
                <h3 className="font-bold text-base mb-1 text-gray-800 dark:text-gray-100">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{card.example}</p>
                <div className="flex -space-x-2">
                  {card.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded bg-cover bg-center border-2 border-white dark:border-gray-700 shadow-sm"
                      style={{ backgroundImage: `url(${img})` }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 历史对话预览 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-gray-400 dark:text-gray-500">最近</h3>
            <button className="text-xs text-gray-400 dark:text-gray-500">查看全部</button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/luka/chat?history=1')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div
                className="w-12 h-12 rounded bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=100)' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">星空渐变长裙</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">已生成 3 个方案</p>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/luka/chat?history=2')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div
                className="w-12 h-12 rounded bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100)' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">复古和服外套</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">制作中</p>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 底部输入区 - 使用统一的 ChatInput 组件 */}
      <ChatInput
        onSend={handleSend}
        onImageUpload={handleImageUpload}
        placeholder="描述你想要的衣服..."
        showExitHint
        onExit={handleExit}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
      />
    </Layout>
  )
}
