import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface GuidelineSection {
  title: string
  icon: string
  items: string[]
}

const guidelines: GuidelineSection[] = [
  {
    title: '内容规范',
    icon: 'article',
    items: [
      '发布原创、真实的设计作品',
      '尊重他人知识产权，不盗用他人设计',
      '不发布虚假、误导性内容',
      '图片清晰、信息准确完整',
    ],
  },
  {
    title: '行为准则',
    icon: 'groups',
    items: [
      '友善交流，尊重每一位用户',
      '不进行人身攻击、歧视或骚扰',
      '不发布垃圾信息或恶意刷屏',
      '不进行恶意举报或诽谤',
    ],
  },
  {
    title: '交易安全',
    icon: 'verified_user',
    items: [
      '所有交易通过平台进行',
      '不私下交易或诱导站外支付',
      '如实描述商品信息',
      '遵守平台退换货政策',
    ],
  },
  {
    title: '禁止行为',
    icon: 'block',
    items: [
      '发布违法违规内容',
      '出售假冒伪劣商品',
      '利用平台进行欺诈',
      '传播恶意软件或链接',
    ],
  },
]

export function CommunityGuidelinesPage() {
  const navigate = useNavigate()

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">社区规范</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 头部说明 */}
          <div className="mx-4 mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl">
            <div className="flex items-start gap-3">
              <Icon name="favorite" size={24} className="text-primary flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">共建美好社区</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  LOOKA 致力于打造一个友好、创意、真实的时尚设计社区。请遵守以下规范，与我们一起维护良好的社区环境。
                </p>
              </div>
            </div>
          </div>

          {/* 规范列表 */}
          <div className="mx-4 space-y-4">
            {guidelines.map((section, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name={section.icon} size={18} className="text-primary" />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-200">{section.title}</h3>
                </div>
                <div className="px-4 py-3">
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* 违规处理 */}
          <div className="mx-4 mt-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Icon name="warning" size={18} className="text-red-500" />
              违规处理
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              违反社区规范的用户将面临警告、限制功能、删除内容、封禁账号等处罚。严重违规者将被永久封禁，并保留追究法律责任的权利。
            </p>
          </div>

          {/* 举报入口 */}
          <div className="mx-4 mt-6">
            <button
              onClick={() => navigate('/report')}
              className="w-full py-3.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
            >
              <Icon name="flag" size={20} />
              <span>举报违规内容</span>
            </button>
          </div>

          {/* 更新时间 */}
          <div className="mx-4 mt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">最后更新：2024年1月1日</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
