import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react'
import { Icon } from './Icon'

/**
 * ChatInput 组件属性
 */
interface ChatInputProps {
  /** 输入值 */
  value?: string
  /** 输入变化回调 */
  onChange?: (value: string) => void
  /** 发送回调 */
  onSend?: (value: string) => void
  /** 图片上传回调 */
  onImageUpload?: (file: File) => void
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示图片上传按钮 */
  showImageUpload?: boolean
  /** 是否显示退出提示 */
  showExitHint?: boolean

  /** 退出回调 */
  onExit?: () => void
  /** 是否使用多行输入 */
  multiline?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * ChatInput - 统一的聊天输入组件
 *
 * 设计规范：
 * - 固定在底部，带白色背景和顶部边框
 * - 圆角输入框 (rounded-2xl)
 * - 图片上传按钮使用圆形灰色背景
 * - 发送按钮根据输入状态改变颜色
 * - 支持 Enter 发送，Shift+Enter 换行
 *
 * @example
 * ```tsx
 * <ChatInput
 *   value={input}
 *   onChange={setInput}
 *   onSend={handleSend}
 *   onImageUpload={handleImageUpload}
 *   placeholder="描述你想要的衣服..."
 *   showExitHint
 *   onExit={() => navigate('/')}
 * />
 * ```
 */
export function ChatInput({
  value: controlledValue,
  onChange,
  onSend,
  onImageUpload,
  placeholder = '描述你想要的...',
  disabled = false,
  showImageUpload = true,
  multiline = false,
  className = '',
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 支持受控和非受控模式
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const hasValue = value.trim().length > 0

  const handleSend = () => {
    if (!hasValue || disabled) return
    onSend?.(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImageUpload) {
      onImageUpload(file)
    }
    // 重置 input 以便可以选择相同文件
    e.target.value = ''
  }

  return (
    <div className={`bg-white dark:bg-[#16181B] border-t border-gray-100 dark:border-gray-800 ${className}`}>
      {/* 隐藏的文件输入 */}
      {showImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      <div className="max-w-md mx-auto p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="flex items-end gap-3">
          {/* 添加图片按钮 */}
          {showImageUpload && (
            <button
              onClick={handleImageClick}
              disabled={disabled}
              className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 disabled:opacity-50"
              aria-label="上传图片"
            >
              <Icon name="add_photo_alternate" size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}

          {/* 文字输入 */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
            {multiline ? (
              <textarea
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none disabled:opacity-50"
                style={{ minHeight: '20px', maxHeight: '100px' }}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none disabled:opacity-50"
              />
            )}
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={!hasValue || disabled}
            className={`
              size-10 flex items-center justify-center rounded-full flex-shrink-0
              transition-all active:scale-95
              ${hasValue && !disabled
                ? 'bg-primary text-white shadow-button'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }
            `}
            aria-label="发送"
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
