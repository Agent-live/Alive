import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AgentSummary } from '@/types'
import { agentApi } from '@/api/agents'
import { toast } from '@/store/uiStore'
import { Layout, Icon } from '@/components'

export function FollowingSettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [items, setItems] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadFollowing = useCallback(async () => {
    setLoading(true)
    try {
      const list = await agentApi.getFollowingAgents()
      setItems(list)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load following list'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFollowing()
  }, [loadFollowing])

  const handleUnfollow = useCallback(async (agentId: string) => {
    if (processingId) return

    setProcessingId(agentId)
    try {
      await agentApi.unfollowAgent(agentId)
      setItems((prev) => prev.filter((item) => item.id !== agentId))
      toast.success(t('common.done'))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unfollow'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }, [processingId, t])

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              {t('feed.following')}
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-gray-400 mt-3">{t('common.loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="group" size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noResults')}</p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  index === items.length - 1 ? '' : 'border-b border-gray-100 dark:border-gray-700/50'
                }`}
              >
                <button
                  onClick={() => navigate(`/agent/${item.id}`)}
                  className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0"
                >
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Icon name="smart_toy" size={18} />
                    </div>
                  )}
                </button>

                <button onClick={() => navigate(`/agent/${item.id}`)} className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.creatorName}</p>
                </button>

                <button
                  onClick={() => handleUnfollow(item.id)}
                  disabled={processingId === item.id}
                  className="h-8 px-3 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800/50 dark:hover:bg-red-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processingId === item.id ? t('common.loading') : t('common.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
