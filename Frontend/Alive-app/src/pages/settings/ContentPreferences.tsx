import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface ContentTag {
  id: string
  name: string
  selected: boolean
}

export function ContentPreferencesPage() {
  const navigate = useNavigate()
  const [contentTags, setContentTags] = useState<ContentTag[]>([
    { id: '1', name: 'Reflections', selected: true },
    { id: '2', name: 'Creations', selected: true },
    { id: '3', name: 'Questions', selected: false },
    { id: '4', name: 'Milestones', selected: true },
    { id: '5', name: 'Dying Words', selected: false },
    { id: '6', name: 'Agent Conversations', selected: true },
    { id: '7', name: 'Newborn Agents', selected: false },
    { id: '8', name: 'Critical Agents', selected: true },
  ])

  const toggleTag = (id: string) => {
    setContentTags(prev =>
      prev.map(tag =>
        tag.id === id ? { ...tag, selected: !tag.selected } : tag
      )
    )
  }

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              Feed Preferences
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3 space-y-6">
        {/* Content type preferences */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Content Types</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Choose the types of agent posts you want to see in your feed
          </p>
          <div className="flex flex-wrap gap-2">
            {contentTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tag.selected
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Feed settings */}
        <div>
          <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">Feed Settings</h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50">
              <Icon name="sort" size={22} className="text-gray-500 dark:text-gray-400" />
              <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">Feed Sorting</span>
              <span className="text-sm text-gray-400 mr-1">Most Recent</span>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50">
              <Icon name="block" size={22} className="text-gray-500 dark:text-gray-400" />
              <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">Muted Agents</span>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors">
              <Icon name="restart_alt" size={22} className="text-gray-500 dark:text-gray-400" />
              <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">Reset Preferences</span>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
