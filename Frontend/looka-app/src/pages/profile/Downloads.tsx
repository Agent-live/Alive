import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface DownloadItem {
  id: string
  name: string
  image: string
  size: string
  downloadedAt: string
  type: 'design' | 'image' | 'video'
}

const mockDownloads: DownloadItem[] = [
  {
    id: '1',
    name: '星空渐变连衣裙设计图',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    size: '2.4 MB',
    downloadedAt: '今天 14:30',
    type: 'design',
  },
  {
    id: '2',
    name: '虚拟试穿效果图',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    size: '1.8 MB',
    downloadedAt: '昨天 16:20',
    type: 'image',
  },
  {
    id: '3',
    name: '设计过程视频',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    size: '15.6 MB',
    downloadedAt: '3天前',
    type: 'video',
  },
]

export function DownloadsPage() {
  const navigate = useNavigate()
  const [downloads, setDownloads] = useState(mockDownloads)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDelete = () => {
    setDownloads(prev => prev.filter(item => !selectedIds.has(item.id)))
    setSelectedIds(new Set())
    setEditMode(false)
  }

  const getTypeIcon = (type: DownloadItem['type']) => {
    switch (type) {
      case 'design':
        return 'design_services'
      case 'image':
        return 'image'
      case 'video':
        return 'videocam'
    }
  }

  const totalSize = downloads.reduce((sum, item) => {
    const size = parseFloat(item.size)
    return sum + size
  }, 0)

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">我的下载</h1>
          <button
            onClick={() => {
              setEditMode(!editMode)
              setSelectedIds(new Set())
            }}
            className="text-[15px] text-primary font-medium"
          >
            {editMode ? '完成' : '管理'}
          </button>
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 存储信息 */}
          <div className="mx-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="folder" size={24} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">已下载 {downloads.length} 个文件</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">占用空间 {totalSize.toFixed(1)} MB</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings/storage')}
              className="text-sm text-primary"
            >
              管理
            </button>
          </div>

          {downloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="download" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-400 dark:text-gray-500">暂无下载内容</p>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {downloads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  {editMode && (
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedIds.has(item.id)
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {selectedIds.has(item.id) && (
                        <Icon name="check" size={14} className="text-white" />
                      )}
                    </button>
                  )}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Icon name={getTypeIcon(item.type)} size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{item.size}</span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{item.downloadedAt}</span>
                    </div>
                  </div>
                  {!editMode && (
                    <button className="p-2">
                      <Icon name="more_vert" size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      {editMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 surface-panel border-t border-gray-100 dark:border-gray-700/50 max-w-md mx-auto">
          <button
            onClick={handleDelete}
            className="w-full py-3 bg-red-500 text-white font-medium rounded-xl active:scale-[0.98] transition-transform"
          >
            删除 ({selectedIds.size})
          </button>
        </div>
      )}
    </Layout>
  )
}
