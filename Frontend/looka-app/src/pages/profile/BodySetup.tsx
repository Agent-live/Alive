import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Button } from '@/components'

const photoTips = [
  {
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    title: '光线充足',
    desc: '面向自然光源',
    good: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    title: '站直身体',
    desc: '放松自然的姿势',
    good: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    title: '简洁背景',
    desc: '纯色背景最佳',
    good: true,
  },
]

export function BodySetupPage() {
  const navigate = useNavigate()
  const [hasPhoto, setHasPhoto] = useState(false)

  const handleTakePhoto = () => {
    // 模拟拍照
    setHasPhoto(true)
  }

  const handleUpload = () => {
    // 模拟上传
    setHasPhoto(true)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white">
        <div className="flex items-center p-4 h-14 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400">
            稍后再说
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 pb-32">
        {/* 洛卡 打招呼 */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-primary/10">
            <img src="/looka.png" alt="洛卡" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold mb-2">让 洛卡 认识你</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            上传一张你的照片<br />
            这样就能看到衣服穿在你身上什么样啦
          </p>
        </div>

        {/* 拍照提示 */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 text-center mb-4">这样拍效果最好</p>
          <div className="flex gap-3">
            {photoTips.map((tip, index) => (
              <div key={index} className="flex-1">
                <div className="relative aspect-[3/4] rounded overflow-hidden bg-gray-100 mb-2">
                  <img
                    src={tip.image}
                    alt={tip.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Icon name="check" size={12} className="text-white" />
                  </div>
                </div>
                <p className="text-xs font-medium text-center">{tip.title}</p>
                <p className="text-xs text-gray-400 text-center">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 上传区域 */}
        {!hasPhoto ? (
          <div className="border-2 border-dashed border-primary/30 rounded p-8 text-center bg-primary/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="photo_camera" size={28} className="text-primary" />
            </div>
            <p className="font-medium mb-1">拍一张或选一张</p>
            <p className="text-xs text-gray-400">照片仅用于试穿，我们会保护你的隐私</p>
          </div>
        ) : (
          <div className="relative aspect-[3/4] rounded overflow-hidden bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800"
              alt="我的照片"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setHasPhoto(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Icon name="refresh" size={18} className="text-white" />
            </button>
            <div className="absolute bottom-4 left-4 right-4 surface-glass rounded p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="check" size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">很棒！</p>
                  <p className="text-xs text-gray-500">洛卡 已经记住你啦</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 隐私说明 */}
        <div className="mt-6 flex items-start gap-2 text-xs text-gray-400">
          <Icon name="lock" size={14} className="mt-0.5 flex-shrink-0" />
          <p>你的照片会被安全加密存储，仅用于生成试穿效果，不会分享给任何人。</p>
        </div>
      </main>

      {/* 底部按钮 */}
      <div className="bottom-action">
        <div className="bottom-action-inner space-y-3">
          {!hasPhoto ? (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleTakePhoto}
              >
                <Icon name="photo_camera" size={20} />
                拍一张
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleUpload}
              >
                从相册选择
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate(-1)}
            >
              完成
            </Button>
          )}
        </div>
      </div>
    </Layout>
  )
}
