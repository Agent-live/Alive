import { useState, useEffect, useCallback } from 'react'

const SEARCH_HISTORY_KEY = 'looka_search_history'
const MAX_HISTORY_SIZE = 20

/**
 * useSearchHistory - 搜索历史 Hook
 *
 * 功能：
 * - 自动持久化到 localStorage
 * - 限制最大历史记录数量
 * - 去重处理
 * - 支持清除单条和全部清除
 *
 * @example
 * ```tsx
 * const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
 *
 * // 添加搜索记录
 * addToHistory('星空渐变')
 *
 * // 删除单条记录
 * removeFromHistory('星空渐变')
 *
 * // 清空所有记录
 * clearHistory()
 * ```
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  // 初始化时从 localStorage 读取
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  // 保存到 localStorage
  const saveHistory = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [])

  // 添加搜索记录
  const addToHistory = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return

    setHistory((prev) => {
      // 去重：如果已存在，移到最前面
      const filtered = prev.filter((item) => item !== trimmed)
      // 添加到最前面，限制数量
      const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY_SIZE)
      saveHistory(newHistory)
      return newHistory
    })
  }, [saveHistory])

  // 删除单条记录
  const removeFromHistory = useCallback((term: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item !== term)
      saveHistory(newHistory)
      return newHistory
    })
  }, [saveHistory])

  // 清空所有记录
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    hasHistory: history.length > 0,
  }
}

export default useSearchHistory
