import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface StyleTag {
  id: string
  name: string
  selected: boolean
}

export function ContentPreferencesPage() {
  const navigate = useNavigate()
  const [styleTags, setStyleTags] = useState<StyleTag[]>([
    { id: '1', name: '极简', selected: true },
    { id: '2', name: '复古', selected: true },
    { id: '3', name: '街头', selected: false },
    { id: '4', name: '甜美', selected: false },
    { id: '5', name: '优雅', selected: true },
    { id: '6', name: '运动', selected: false },
    { id: '7', name: '商务', selected: false },
    { id: '8', name: '休闲', selected: true },
    { id: '9', name: '朋克', selected: false },
    { id: '10', name: '民族', selected: false },
  ])

  const toggleTag = (id: string) => {
    setStyleTags(prev =>
      prev.map(tag =>
        tag.id === id ? { ...tag, selected: !tag.selected } : tag
      )
    )
  }

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">内容偏好</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 风格偏好 */}
          <div className="mx-4 mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">风格偏好</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">选择你喜欢的风格，我们会为你推荐相关内容</p>
            <div className="flex flex-wrap gap-2">
              {styleTags.map((tag) => (
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

          {/* 推荐设置 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">推荐设置</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50">
                <Icon name="thumb_up" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">兴趣管理</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50">
                <Icon name="block" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">不感兴趣的内容</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors">
                <Icon name="restart_alt" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">重置推荐</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* 内容过滤 */}
          <div className="mx-4 mb-3">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">内容过滤</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50">
                <Icon name="filter_list" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">关键词屏蔽</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors">
                <Icon name="person_off" size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-800 dark:text-gray-200">屏蔽用户</span>
                <Icon name="chevron_right" size={20} className="text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
