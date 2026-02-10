import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

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
      name: 'AI 智能搭配',
      description: '根据你的衣柜自动推荐穿搭组合',
      icon: 'auto_awesome',
      enabled: true,
      isNew: true,
    },
    {
      id: '2',
      name: '3D 虚拟试衣间',
      description: '360度查看虚拟试穿效果',
      icon: 'view_in_ar',
      enabled: false,
      isNew: true,
    },
    {
      id: '3',
      name: '语音设计助手',
      description: '通过语音与洛卡对话设计',
      icon: 'mic',
      enabled: false,
    },
    {
      id: '4',
      name: '社区协作设计',
      description: '邀请好友一起参与设计',
      icon: 'group',
      enabled: false,
    },
    {
      id: '5',
      name: '智能面料推荐',
      description: '根据设计自动推荐最佳面料',
      icon: 'texture',
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
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">体验新功能</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 说明 */}
          <div className="mx-4 mb-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl">
            <div className="flex items-start gap-3">
              <Icon name="science" size={24} className="text-primary flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">实验性功能</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  这些功能正在测试中，可能存在不稳定的情况。欢迎提供反馈帮助我们改进！
                </p>
              </div>
            </div>
          </div>

          {/* 功能列表 */}
          <div className="mx-4">
            <div className="space-y-3">
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
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ml-3 ${
                        feature.enabled ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          feature.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 反馈入口 */}
          <div className="mx-4 mt-6">
            <button
              onClick={() => navigate('/help')}
              className="w-full py-3.5 border border-primary text-primary font-medium rounded-xl flex items-center justify-center gap-2 active:bg-primary/5 transition-colors"
            >
              <Icon name="feedback" size={20} />
              <span>提交反馈</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
