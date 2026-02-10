import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface DraftItem {
  id: string
  title: string
  image: string
  updatedAt: string
  type: 'design' | 'wish'
}

const mockDrafts: DraftItem[] = [
  {
    id: '1',
    title: '夏日清新连衣裙',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    updatedAt: '2小时前',
    type: 'design',
  },
  {
    id: '2',
    title: '复古格纹外套',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    updatedAt: '昨天',
    type: 'design',
  },
  {
    id: '3',
    title: '极简白衬衫',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
    updatedAt: '3天前',
    type: 'wish',
  },
]

export function DraftsPage() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState(mockDrafts)
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
    setDrafts(prev => prev.filter(item => !selectedIds.has(item.id)))
    setSelectedIds(new Set())
    setEditMode(false)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">草稿箱</h1>
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
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="edit_note" size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-400 dark:text-gray-500">暂无草稿</p>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  {editMode && (
                    <button
                      onClick={() => toggleSelect(draft.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedIds.has(draft.id)
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {selectedIds.has(draft.id) && (
                        <Icon name="check" size={14} className="text-white" />
                      )}
                    </button>
                  )}
                  <div
                    onClick={() => !editMode && navigate(`/luka/chat?draft=${draft.id}`)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      <img
                        src={draft.image}
                        alt={draft.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                        {draft.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          draft.type === 'design'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                        }`}>
                          {draft.type === 'design' ? '设计' : '愿望'}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{draft.updatedAt}</span>
                      </div>
                    </div>
                    {!editMode && (
                      <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
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
