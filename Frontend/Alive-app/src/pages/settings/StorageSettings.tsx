import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface StorageItem {
  icon: string
  label: string
  size: string
  color: string
}

export function StorageSettingsPage() {
  const navigate = useNavigate()
  const [isClearing, setIsClearing] = useState(false)

  const storageItems: StorageItem[] = [
    { icon: 'image', label: '图片缓存', size: '45.2 MB', color: 'text-blue-500' },
    { icon: 'videocam', label: '视频缓存', size: '128.6 MB', color: 'text-purple-500' },
    { icon: 'auto_awesome', label: 'AI 生成缓存', size: '32.8 MB', color: 'text-primary' },
    { icon: 'folder', label: '其他缓存', size: '12.4 MB', color: 'text-orange-500' },
  ]

  const totalSize = '219.0 MB'

  const handleClearCache = async () => {
    setIsClearing(true)
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsClearing(false)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">存储空间</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 总存储 */}
          <div className="mx-4 mb-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center">
              <Icon name="storage" size={36} className="text-primary" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">已使用空间</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalSize}</p>
          </div>

          {/* 存储详情 */}
          <div className="mx-4 mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">存储详情</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {storageItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-4 py-3.5 ${
                    index < storageItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  }`}
                >
                  <Icon name={item.icon} size={22} className={item.color} />
                  <span className="flex-1 text-[15px] text-gray-800 dark:text-gray-200">{item.label}</span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{item.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 存储柱状图 */}
          <div className="mx-4 mb-6">
            <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: '21%' }} />
              <div className="h-full bg-purple-500" style={{ width: '59%' }} />
              <div className="h-full bg-primary" style={{ width: '15%' }} />
              <div className="h-full bg-orange-500" style={{ width: '5%' }} />
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
              {storageItems.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 清理按钮 */}
          <div className="mx-4">
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {isClearing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>清理中...</span>
                </>
              ) : (
                <>
                  <Icon name="cleaning_services" size={20} />
                  <span>清理缓存</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
              清理后可释放 {totalSize} 空间
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
