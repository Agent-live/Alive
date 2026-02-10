import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'
import { useSearchHistory } from '@/hooks'

// 发现 - 编辑推荐
const discovers = [
  { text: '春季新款连衣裙', hot: false },
  { text: '通勤穿搭', hot: true },
  { text: '小个子显高', hot: false },
  { text: '氛围感穿搭', hot: false },
]

// 热门搜索
const hotSearches = [
  { rank: 1, text: '早春穿搭灵感', hot: true, count: '326.5k' },
  { rank: 2, text: '显瘦连衣裙', hot: true, count: '298.2k' },
  { rank: 3, text: '法式优雅风', hot: true, count: '256.8k' },
  { rank: 4, text: '极简主义衣橱', hot: false, count: '198.3k' },
  { rank: 5, text: '职场穿搭公式', hot: false, count: '167.9k' },
  { rank: 6, text: '小众设计师品牌', hot: false, count: '145.2k' },
  { rank: 7, text: '可持续时尚', hot: true, count: '132.6k' },
  { rank: 8, text: '一衣多穿技巧', hot: false, count: '98.7k' },
]

/**
 * SearchPage - 搜索页面
 *
 * 改进点：
 * - 使用 useSearchHistory hook 管理真实的搜索历史
 * - 搜索历史持久化到 localStorage
 * - 支持删除单条和清空全部历史
 * - 统一的设计规范和间距
 */
export function SearchPage() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')

  // 使用搜索历史 hook
  const { history, addToHistory, removeFromHistory, clearHistory, hasHistory } = useSearchHistory()

  // 执行搜索
  const handleSearch = useCallback((term?: string) => {
    const searchTerm = (term || searchText).trim()
    if (!searchTerm) return

    // 添加到搜索历史
    addToHistory(searchTerm)

    // 导航到搜索结果页
    navigate(`/search/result?q=${encodeURIComponent(searchTerm)}`)
  }, [searchText, addToHistory, navigate])

  // 点击标签
  const handleTagClick = useCallback((text: string) => {
    setSearchText(text)
    handleSearch(text)
  }, [handleSearch])

  // 删除单条历史
  const handleRemoveHistory = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromHistory(term)
  }, [removeFromHistory])

  // 键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <Layout showTabBar={false}>
      {/* 搜索栏 - 使用统一的 header 样式 */}
      <header className="header-detail">
        <div className="flex items-center gap-2 px-3 py-2 max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="header-btn-start"
            aria-label="返回"
          >
            <Icon name="arrow_back_ios" size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* 搜索输入框 */}
          <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 h-10">
            <Icon name="search" size={18} className="text-gray-400 dark:text-gray-500 mr-2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索你想要的风格..."
              className="flex-1 bg-transparent text-sm outline-none dark:text-gray-200 dark:placeholder:text-gray-500"
              autoFocus
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="p-1"
                aria-label="清除"
              >
                <Icon name="close" size={16} className="text-gray-400 dark:text-gray-500" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleSearch()}
            className="px-3 h-10 text-primary font-medium text-sm flex-shrink-0"
          >
            搜索
          </button>
        </div>
      </header>

      <main className="content-page ">
        {/* 最近搜索 - 使用真实的搜索历史 */}
        {hasHistory && (
          <section className="py-4">
            <div className="flex items-center justify-between mb-3 section-inset">
              <h3 className="font-bold text-base dark:text-gray-100">最近搜索</h3>
              <button
                onClick={clearHistory}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="清空搜索历史"
              >
                <Icon name="delete_outline" size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 section-inset">
              {history.slice(0, 10).map((item) => (
                <button
                  key={item}
                  onClick={() => handleTagClick(item)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>{item}</span>
                  <span
                    onClick={(e) => handleRemoveHistory(item, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="close" size={14} className="text-gray-400 dark:text-gray-500" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 发现 */}
        <section className={`py-4 ${hasHistory ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
          <div className="flex items-center justify-between mb-3 section-inset">
            <h3 className="font-bold text-base dark:text-gray-100">发现</h3>
            <button className="p-1 text-gray-400 dark:text-gray-500">
              <Icon name="refresh" size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 section-inset">
            {discovers.map((item) => (
              <button
                key={item.text}
                onClick={() => handleTagClick(item.text)}
                className="flex items-center gap-1 text-left hover:text-primary transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                {item.hot && (
                  <span className="px-1 py-0.5 bg-primary text-white text-xs rounded font-medium">
                    热
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* LOOKA 热点 */}
        <section className="py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4 section-inset">
            <Icon name="local_fire_department" size={20} className="text-primary" />
            <h3 className="font-bold text-base dark:text-gray-100">LOOKA 热点</h3>
          </div>
          <div className="space-y-1 section-inset">
            {hotSearches.map((item) => (
              <button
                key={item.rank}
                onClick={() => handleTagClick(item.text)}
                className="flex items-center gap-3 w-full text-left py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors -mx-2 px-2"
              >
                {/* 排名 */}
                <span className={`w-5 text-center font-bold text-base ${
                  item.rank <= 3 ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {item.rank}
                </span>

                {/* 关键词 */}
                <span className="flex-1 text-base text-gray-800 dark:text-gray-200">{item.text}</span>

                {/* 热门标签 */}
                {item.hot && (
                  <span className="px-1 py-0.5 bg-primary text-white text-xs rounded font-medium">
                    热
                  </span>
                )}

                {/* 搜索量 */}
                <span className="text-sm text-gray-400 dark:text-gray-500">{item.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 底部提示 */}
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          <p>更多时尚灵感，等你发现</p>
        </div>
      </main>
    </Layout>
  )
}
