import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function WalletPage() {
  const navigate = useNavigate()
  const [showBalance, setShowBalance] = useState(true)

  const balance = {
    total: 1288.50,
    available: 1188.50,
    frozen: 100.00,
  }

  const transactions = [
    { id: '1', type: 'income', title: '设计收益', amount: 88.00, time: '今天 14:30' },
    { id: '2', type: 'expense', title: '购买面料样品', amount: -35.00, time: '昨天 16:20' },
    { id: '3', type: 'income', title: '拼单返现', amount: 25.50, time: '昨天 10:15' },
    { id: '4', type: 'expense', title: '定制服装', amount: -299.00, time: '3天前' },
    { id: '5', type: 'income', title: '邀请奖励', amount: 50.00, time: '5天前' },
  ]

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">钱包</h1>
          <button onClick={() => navigate('/wallet/records')} className="text-[15px] text-gray-600 dark:text-gray-300">
            明细
          </button>
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4">
          {/* 余额卡片 */}
          <div className="mx-4 mb-4 p-5 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70 text-sm">账户余额</span>
              <button onClick={() => setShowBalance(!showBalance)}>
                <Icon
                  name={showBalance ? 'visibility' : 'visibility_off'}
                  size={20}
                  className="text-white/50"
                />
              </button>
            </div>
            <div className="text-3xl font-bold text-white mb-4">
              {showBalance ? `¥ ${balance.total.toFixed(2)}` : '¥ ****'}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-white/50">可用 </span>
                <span className="text-white">{showBalance ? `¥${balance.available.toFixed(2)}` : '****'}</span>
              </div>
              <div>
                <span className="text-white/50">冻结 </span>
                <span className="text-white">{showBalance ? `¥${balance.frozen.toFixed(2)}` : '****'}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/wallet/withdraw')}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform"
              >
                提现
              </button>
              <button
                onClick={() => navigate('/wallet/recharge')}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium rounded-xl active:scale-[0.98] transition-transform"
              >
                充值
              </button>
            </div>
          </div>

          {/* 快捷功能 */}
          <div className="mx-4 mb-4">
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              {[
                { icon: 'credit_card', label: '银行卡' },
                { icon: 'redeem', label: '优惠券' },
                { icon: 'card_giftcard', label: '礼品卡' },
                { icon: 'help_outline', label: '帮助' },
              ].map((item, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <Icon name={item.icon} size={24} className="text-gray-600 dark:text-gray-300" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 最近交易 */}
          <div className="mx-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">最近交易</h3>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <Icon
                        name={tx.type === 'income' ? 'add' : 'remove'}
                        size={20}
                        className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{tx.time}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    tx.type === 'income' ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
