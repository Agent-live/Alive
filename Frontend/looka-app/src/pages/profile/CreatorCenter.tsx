import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function CreatorCenterPage() {
  const navigate = useNavigate()

  const stats = [
    { label: '作品', value: '12' },
    { label: '获赞', value: '1.2k' },
    { label: '粉丝', value: '368' },
    { label: '收藏', value: '89' },
  ]

  const menuItems = [
    { icon: 'analytics', label: '数据中心', path: '/creator/analytics', description: '查看作品数据' },
    { icon: 'campaign', label: '创作活动', path: '/creator/activities', description: '参与热门活动', badge: '3' },
    { icon: 'school', label: '创作学院', path: '/creator/academy', description: '学习创作技巧' },
    { icon: 'monetization_on', label: '收益中心', path: '/creator/income', description: '查看收益明细' },
    { icon: 'workspace_premium', label: '创作者等级', path: '/creator/level', description: 'Lv.3 时尚新秀' },
  ]

  const quickActions = [
    { icon: 'add_photo_alternate', label: '发布作品', path: '/luka' },
    { icon: 'live_tv', label: '开始直播', path: '/live/start' },
    { icon: 'article', label: '写笔记', path: '/note/create' },
  ]

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">创作中心</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 数据概览 */}
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl">
            <div className="flex items-center justify-between">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/70 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="mx-4 mb-4">
            <div className="flex items-center justify-around p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center">
                    <Icon name={action.icon} size={24} className="text-primary" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 功能菜单 */}
          <div className="mx-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-4 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
                    index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name={item.icon} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
                </button>
              ))}
            </div>
          </div>

          {/* 创作者任务 */}
          <div className="mx-4 mt-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">本周任务</h3>
            <div className="space-y-2">
              {[
                { task: '发布 3 个作品', progress: 2, total: 3, reward: '+50积分' },
                { task: '获得 100 个赞', progress: 78, total: 100, reward: '+30积分' },
                { task: '邀请 1 位好友', progress: 0, total: 1, reward: '+100积分' },
              ].map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-800 dark:text-gray-200">{item.task}</span>
                    <span className="text-xs text-primary font-medium">{item.reward}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(item.progress / item.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {item.progress}/{item.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
