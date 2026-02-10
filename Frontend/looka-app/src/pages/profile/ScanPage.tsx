import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components'

export function ScanPage() {
  const navigate = useNavigate()
  const [flashOn, setFlashOn] = useState(false)

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between p-4 pt-[max(16px,env(safe-area-inset-top))]">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
          >
            <Icon name="close" size={24} className="text-white" />
          </button>
          <h1 className="text-white font-medium">扫一扫</h1>
          <button
            onClick={() => setFlashOn(!flashOn)}
            className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
          >
            <Icon
              name={flashOn ? 'flash_on' : 'flash_off'}
              size={24}
              className="text-white"
            />
          </button>
        </div>
      </div>

      {/* 扫描区域 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 半透明遮罩 */}
        <div className="absolute inset-0 bg-black/60" />

        {/* 扫描框 */}
        <div className="relative w-64 h-64">
          {/* 透明区域 */}
          <div className="absolute inset-0 bg-transparent" style={{
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
          }} />

          {/* 四角 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

          {/* 扫描线动画 */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
        </div>
      </div>

      {/* 提示文字 */}
      <div className="absolute bottom-1/3 left-0 right-0 text-center">
        <p className="text-white/80 text-sm">将二维码放入框内即可自动扫描</p>
      </div>

      {/* 底部功能 */}
      <div className="absolute bottom-0 left-0 right-0 pb-[max(32px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-center gap-12">
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Icon name="photo_library" size={24} className="text-white" />
            </div>
            <span className="text-white/80 text-xs">相册</span>
          </button>
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Icon name="qr_code" size={24} className="text-white" />
            </div>
            <span className="text-white/80 text-xs">我的码</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% {
            top: 0;
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            top: calc(100% - 2px);
            opacity: 1;
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
