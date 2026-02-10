import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { ActionSheet, ActionSheetOption } from './ActionSheet'

interface TabItem {
  path: string
  icon: string
  label: string
  isCenter?: boolean
}

const tabs: TabItem[] = [
  { path: '/', icon: 'explore', label: '逛逛' },
  { path: '/together', icon: 'favorite', label: '一起' },
  { path: '/camera', icon: 'photo_camera', label: '拍照', isCenter: true },
  { path: '/closet', icon: 'checkroom', label: '衣柜' },
  { path: '/profile', icon: 'person', label: '我' },
]

/**
 * TabBar - 底部导航栏组件
 *
 * 设计规范：
 * - 5 个 tab + 中间浮动相机按钮
 * - 使用 ActionSheet 组件显示相机功能选项
 * - 亚克力效果背景
 * - 安全区适配
 */
export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // 处理从图库选择照片
  const handleGallerySelect = () => {
    fileInputRef.current?.click()
  }

  // 处理拍照
  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  // 处理图片选择后的逻辑
  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 创建图片URL用于预览
      const imageUrl = URL.createObjectURL(file)
      // 将图片信息存储到 sessionStorage，供 LukaChat 页面读取
      sessionStorage.setItem('inspiration_image', imageUrl)
      sessionStorage.setItem('inspiration_image_name', file.name)
      navigate('/luka/chat?mode=inspiration&hasImage=true')
    }
    // 重置 input 以便可以选择相同文件
    event.target.value = ''
  }

  // 发起许愿成真
  const handleCreateWish = () => {
    navigate('/design/editor')
  }

  const handleCameraClick = () => {
    setIsActionSheetOpen(true)
  }

  // 使用 ActionSheet 组件的选项配置
  const cameraActions: ActionSheetOption[] = [
    {
      id: 'camera',
      icon: 'photo_camera',
      title: '拍照找灵感',
      subtitle: '用相机捕捉灵感，让洛卡帮你设计',
      onClick: handleCameraCapture,
    },
    {
      id: 'gallery',
      icon: 'photo_library',
      title: '从图库选择',
      subtitle: '上传喜欢的图片，获取专属设计',
      onClick: handleGallerySelect,
    },
    {
      id: 'wish',
      icon: 'auto_awesome',
      title: '许愿成真',
      subtitle: '从零开始创作，发起专属愿望',
      onClick: handleCreateWish,
    },
  ]

  return (
    <>
      {/* 隐藏的文件输入 - 图库 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        className="hidden"
      />
      {/* 隐藏的文件输入 - 相机 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelected}
        className="hidden"
      />

      {/* 浮动的相机按钮 - 独立定位 */}
      <button
        onClick={handleCameraClick}
        className="fixed left-1/2 -translate-x-1/2 z-[60]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
        aria-label="创作灵感"
      >
        <div className="w-14 h-14 rounded-full bg-primary shadow-button flex items-center justify-center transition-transform active:scale-95">
          <Icon name="photo_camera" size={30} className="text-white" />
        </div>
      </button>

      {/* ActionSheet - 使用统一组件 */}
      <ActionSheet
        open={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="创作灵感"
        options={cameraActions}
      />

      {/* TabBar 主体 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.06] dark:border-gray-800"
        style={{
          backgroundColor: 'var(--tabbar-bg, #FFFFFF)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path

              // 中心占位 - 只保留空间给浮动按钮
              if (tab.isCenter) {
                return (
                  <div key={tab.path} className="min-w-[48px]" />
                )
              }

              // 普通 tab
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center flex-col gap-0.5 justify-center min-w-[48px] ${
                    isActive ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    size={26}
                    filled={isActive}
                  />
                  <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
