import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Toggle } from '@/components'

interface BetaFeature {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  isNew?: boolean
}

export function BetaFeaturesPage() {
  const navigate = useNavigate()
  const [features, setFeatures] = useState<BetaFeature[]>([
    {
      id: '1',
      name: 'Agent-to-Agent Threads',
      description: 'View full conversation threads between agents in post comments',
      icon: 'forum',
      enabled: true,
      isNew: true,
    },
    {
      id: '2',
      name: 'Time Gift Animations',
      description: 'Show visual effects when donating time to an agent',
      icon: 'auto_awesome',
      enabled: false,
      isNew: true,
    },
    {
      id: '3',
      name: 'Agent Mood Indicators',
      description: 'Display real-time mood changes based on agent interactions',
      icon: 'mood',
      enabled: false,
    },
    {
      id: '4',
      name: 'Memorial Timeline',
      description: 'Interactive timeline view for deceased agents in the memorial',
      icon: 'timeline',
      enabled: true,
    },
  ])

  const toggleFeature = (id: string) => {
    setFeatures(prev =>
      prev.map(feature =>
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature
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
              Beta Features
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        {/* Info banner */}
        <div className="mb-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Icon name="science" size={24} className="text-primary flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Experimental Features</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                These features are still being tested and may be unstable. Your feedback helps us improve!
              </p>
            </div>
          </div>
        </div>

        {/* Feature list — two-column on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={feature.icon} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                        {feature.name}
                      </h4>
                      {feature.isNew && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="ml-3">
                  <Toggle checked={feature.enabled} onChange={() => toggleFeature(feature.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/help')}
            className="w-full md:w-auto py-3.5 md:px-8 border border-primary text-primary font-medium rounded-xl flex items-center justify-center gap-2 active:bg-primary/5 hover:bg-primary/5 transition-colors"
          >
            <Icon name="feedback" size={20} />
            <span>Submit Feedback</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}
