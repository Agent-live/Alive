import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, Toggle, ActionSheet, SettingsDialog } from '@/components'
import type { ActionSheetOption } from '@/components'

interface Memory {
  id: string
  content: string
  agentName: string
  agentAvatar: string
  createdAt: string
}

const INITIAL_MEMORIES: Memory[] = [
  {
    id: '1',
    content: 'User prefers morning check-ins over evening ones. Likes to start the day with a brief summary.',
    agentName: 'Luna',
    agentAvatar: '🌙',
    createdAt: '2026-02-10T09:15:00Z',
  },
  {
    id: '2',
    content: 'Favorite music genre is lo-fi hip hop. Often listens while working.',
    agentName: 'Echo',
    agentAvatar: '🎵',
    createdAt: '2026-02-09T14:30:00Z',
  },
  {
    id: '3',
    content: 'Has a golden retriever named Mochi. Frequently mentions walks in the park.',
    agentName: 'Luna',
    agentAvatar: '🌙',
    createdAt: '2026-02-08T18:45:00Z',
  },
  {
    id: '4',
    content: 'Works as a UX designer at a startup. Interested in AI-assisted design tools.',
    agentName: 'Spark',
    agentAvatar: '⚡',
    createdAt: '2026-02-07T11:20:00Z',
  },
  {
    id: '5',
    content: 'Prefers concise responses over long explanations. Values bullet points.',
    agentName: 'Echo',
    agentAvatar: '🎵',
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: '6',
    content: 'Is learning Japanese. Enjoys when agents include simple Japanese phrases occasionally.',
    agentName: 'Kiko',
    agentAvatar: '🌸',
    createdAt: '2026-02-03T20:10:00Z',
  },
  {
    id: '7',
    content: 'Allergic to peanuts. Important to remember when suggesting food or recipes.',
    agentName: 'Spark',
    agentAvatar: '⚡',
    createdAt: '2026-01-28T16:55:00Z',
  },
]

type SortOrder = 'newest' | 'oldest'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MemorySettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  // ActionSheet state
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null)

  // Sort menu
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  // Clear all dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editContent, setEditContent] = useState('')

  // More menu
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  const filteredMemories = useMemo(() => {
    let result = memories
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        m => m.content.toLowerCase().includes(q) || m.agentName.toLowerCase().includes(q)
      )
    }
    result = [...result].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return sortOrder === 'newest' ? diff : -diff
    })
    return result
  }, [memories, searchQuery, sortOrder])

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id))
  }

  const handleClearAll = () => {
    setMemories([])
    setClearDialogOpen(false)
  }

  const handleEditSave = () => {
    if (selectedMemoryId && editContent.trim()) {
      setMemories(prev =>
        prev.map(m => (m.id === selectedMemoryId ? { ...m, content: editContent.trim() } : m))
      )
    }
    setEditDialogOpen(false)
    setSelectedMemoryId(null)
  }

  const openEditDialog = (memory: Memory) => {
    setSelectedMemoryId(memory.id)
    setEditContent(memory.content)
    setEditDialogOpen(true)
  }

  const memoryActions: ActionSheetOption[] = [
    {
      id: 'edit',
      icon: 'edit',
      title: t('settingsMemory.editMemory'),
      onClick: () => {
        const mem = memories.find(m => m.id === selectedMemoryId)
        if (mem) openEditDialog(mem)
      },
    },
    {
      id: 'delete',
      icon: 'delete',
      title: t('settingsMemory.deleteMemory'),
      danger: true,
      onClick: () => {
        if (selectedMemoryId) handleDeleteMemory(selectedMemoryId)
        setSelectedMemoryId(null)
      },
    },
  ]

  const sortOptions: ActionSheetOption[] = [
    {
      id: 'newest',
      icon: 'arrow_downward',
      title: t('settingsMemory.newestFirst'),
      onClick: () => setSortOrder('newest'),
    },
    {
      id: 'oldest',
      icon: 'arrow_upward',
      title: t('settingsMemory.oldestFirst'),
      onClick: () => setSortOrder('oldest'),
    },
  ]

  const moreOptions: ActionSheetOption[] = [
    {
      id: 'clear-all',
      icon: 'delete_sweep',
      title: t('settingsMemory.clearAllMemories'),
      subtitle: t('settingsMemory.clearAllSubtitle', { count: memories.length }),
      danger: true,
      onClick: () => setClearDialogOpen(true),
    },
  ]

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('settingsMemory.title')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        {/* Toggle + description */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="psychology" size={22} className="text-primary" />
              </div>
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                {t('settingsMemory.memoryLabel')}
              </span>
            </div>
            <Toggle checked={memoryEnabled} onChange={() => setMemoryEnabled(!memoryEnabled)} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {t('settingsMemory.memoryDesc')}
          </p>
        </div>

        {memoryEnabled && (
          <>
            {/* Search bar + sort + more */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <Icon
                  name="search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  type="text"
                  placeholder={t('settingsMemory.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
              <button
                onClick={() => setSortSheetOpen(true)}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                title="Sort"
              >
                <Icon name="sort" size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setMoreSheetOpen(true)}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                title="More options"
              >
                <Icon name="more_horiz" size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Memory list */}
            {filteredMemories.length > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                {filteredMemories.map((memory, index) => (
                  <div
                    key={memory.id}
                    className={`px-4 py-3.5 ${
                      index < filteredMemories.length - 1
                        ? 'border-b border-gray-100 dark:border-gray-700/50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                          {memory.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg leading-none">{memory.agentAvatar}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {memory.agentName}
                          </span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(memory.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMemoryId(memory.id)
                          setActionSheetOpen(true)
                        }}
                        className="p-1 -mr-1 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
                      >
                        <Icon name="more_horiz" size={18} className="text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Icon name="psychology" size={32} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                  {searchQuery ? t('settingsMemory.noMatchingMemories') : t('settingsMemory.noMemories')}
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  {searchQuery
                    ? t('settingsMemory.tryDifferentSearch')
                    : t('settingsMemory.agentsWillSave')}
                </p>
              </div>
            )}

            {/* Footer stats */}
            {memories.length > 0 && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 mb-2">
                {memories.length === 1
                  ? t('settingsMemory.memorySaved', { count: memories.length })
                  : t('settingsMemory.memoriesSaved', { count: memories.length })}
              </p>
            )}
          </>
        )}
      </div>

      {/* ActionSheet — per-memory actions */}
      <ActionSheet
        open={actionSheetOpen}
        onClose={() => {
          setActionSheetOpen(false)
          setSelectedMemoryId(null)
        }}
        title={t('settingsMemory.memoryLabel')}
        options={memoryActions}
      />

      {/* ActionSheet — sort */}
      <ActionSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title={t('settingsMemory.sortBy')}
        options={sortOptions}
      />

      {/* ActionSheet — more options */}
      <ActionSheet
        open={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        title={t('settingsMemory.options')}
        options={moreOptions}
      />

      {/* Clear all confirmation dialog */}
      <SettingsDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        title={t('settingsMemory.clearAllMemories')}
        icon="delete_sweep"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('settingsMemory.clearAllConfirm', { count: memories.length })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setClearDialogOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            {t('settingsMemory.clearAll')}
          </button>
        </div>
      </SettingsDialog>

      {/* Edit memory dialog */}
      <SettingsDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedMemoryId(null)
        }}
        title={t('settingsMemory.editMemory')}
        icon="edit"
      >
        <textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={4}
          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditDialogOpen(false)
              setSelectedMemoryId(null)
            }}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleEditSave}
            className="flex-1 py-2.5 rounded-xl bg-primary text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            {t('common.save')}
          </button>
        </div>
      </SettingsDialog>
    </Layout>
  )
}
