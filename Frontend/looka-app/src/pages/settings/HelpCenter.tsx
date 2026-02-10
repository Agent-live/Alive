import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: '如何开始设计我的第一件衣服？',
    answer: '点击底部"洛卡"按钮，与 AI 助手对话描述你想要的设计。洛卡会根据你的描述生成设计方案，你可以不断调整直到满意为止。',
  },
  {
    question: '虚拟试穿是如何工作的？',
    answer: '上传一张你的全身照，我们的 AI 会将设计好的衣服虚拟穿在你身上，让你在制作前就能看到效果。',
  },
  {
    question: '如何发起拼单？',
    answer: '在设计完成后，你可以选择发起拼单。当达到一定人数后，我们会开始批量生产，价格会比单独定制更优惠。',
  },
  {
    question: '衣服多久能做好？',
    answer: '拼单成功后，通常需要 7-14 个工作日完成生产。你可以在"订单"页面查看实时进度。',
  },
  {
    question: '可以退换货吗？',
    answer: '因为是定制商品，我们暂不支持无理由退换。如有质量问题，请在收货后 7 天内联系客服处理。',
  },
  {
    question: '如何联系客服？',
    answer: '你可以通过页面底部的"在线客服"按钮联系我们，或发送邮件至 support@looka.com。',
  },
]

export function HelpCenterPage() {
  const navigate = useNavigate()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">帮助中心</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 搜索框 */}
          <div className="mx-4 mb-6">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Icon name="search" size={20} className="text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="搜索问题..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200"
              />
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="mx-4 mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">快捷服务</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: 'headset_mic', label: '在线客服' },
                { icon: 'feedback', label: '意见反馈' },
                { icon: 'report_problem', label: '举报投诉' },
                { icon: 'history', label: '反馈记录' },
              ].map((item, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center gap-2 py-3 active:bg-gray-50 dark:active:bg-gray-700/50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name={item.icon} size={22} className="text-primary" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 常见问题 */}
          <div className="mx-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">常见问题</h3>
            <div className="space-y-2">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(index)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="text-[15px] text-gray-800 dark:text-gray-200 flex-1 pr-4">
                      {faq.question}
                    </span>
                    <Icon
                      name="expand_more"
                      size={20}
                      className={`text-gray-400 dark:text-gray-500 transition-transform ${
                        expandedIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedIndex === index && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 联系我们 */}
          <div className="mx-4 mt-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">没有找到答案？</p>
            <button className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-full active:scale-95 transition-transform">
              联系在线客服
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
