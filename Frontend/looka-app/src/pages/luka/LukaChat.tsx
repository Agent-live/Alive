import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon, LukaAvatar, ChatInput } from '@/components'
import {
  modeGreetings,
  historyConversations,
  sampleDesigns,
  styleOptions,
  clothingKeywords,
  styleKeywords,
  type Message,
} from '@/mocks'

export function LukaChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'describe'
  const historyId = searchParams.get('history')
  const initialQuery = searchParams.get('q')
  const hasImage = searchParams.get('hasImage') === 'true'

  // 检查是否有从 TabBar 传来的灵感图片
  const getInspirationImage = (): { url: string; name: string } | null => {
    if (hasImage) {
      const imageUrl = sessionStorage.getItem('inspiration_image')
      const imageName = sessionStorage.getItem('inspiration_image_name')
      if (imageUrl) {
        // 读取后清除，避免重复使用
        sessionStorage.removeItem('inspiration_image')
        sessionStorage.removeItem('inspiration_image_name')
        return { url: imageUrl, name: imageName || '灵感图片' }
      }
    }
    return null
  }

  // 根据是否有 history 参数决定初始消息
  const getInitialMessages = (): Message[] => {
    if (historyId && historyConversations[historyId]) {
      return historyConversations[historyId]
    }

    const inspirationImage = getInspirationImage()

    const messages: Message[] = [
      {
        id: '1',
        from: 'luka',
        content: inspirationImage
          ? '我看到你上传了一张灵感图！告诉我你喜欢这张图的哪些元素，我来帮你设计～'
          : (modeGreetings[mode] || modeGreetings.default),
      },
    ]

    // 如果有灵感图片，添加用户消息
    if (inspirationImage) {
      messages.push({
        id: '2',
        from: 'user',
        content: '这是我的灵感图片',
        image: inspirationImage.url,
      })
    }
    // 如果有初始查询，添加用户消息
    else if (initialQuery) {
      messages.push({
        id: '2',
        from: 'user',
        content: initialQuery,
      })
    }

    return messages
  }

  const [messages, setMessages] = useState<Message[]>(getInitialMessages())
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 安全返回 - 如果没有历史记录则回到 /luka
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/luka')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (content: string, image?: string) => {
    if (!content.trim() && !image) return

    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      content: content.trim(),
      image,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // 洛卡 回复逻辑 - 使用 mocks 中的关键词
    setTimeout(() => {
      setIsTyping(false)

      const hasStyle = styleKeywords.some(s => content.includes(s))

      if (hasStyle || image) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          from: 'luka',
          content: '明白了～让我想想...',
          isGenerating: true,
        }])

        setTimeout(() => {
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: '给你生成了几个方向，点击看大图~',
              isGenerating: false,
              designs: sampleDesigns,
            }
            return newMessages
          })
        }, 2500)
      } else if (clothingKeywords.some(k => content.includes(k))) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          from: 'luka',
          content: '想要什么风格的呢？',
          options: [...styleOptions],
        }])
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          from: 'luka',
          content: '可以再具体一点吗？比如什么场合穿、喜欢什么颜色和风格？',
        }])
      }
    }, 800)
  }

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    sendMessage('帮我做类似这种感觉的', imageUrl)
  }

  const handleDesignClick = (designId: string) => {
    navigate(`/design-result?id=${designId}`)
  }

  return (
    <div className="app-shell flex flex-col">
      {/* Header */}
      <header className="header-flex">
        <div className="header-detail-inner">
          <button onClick={handleBack} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <LukaAvatar size="xs" />
            <span className="font-medium dark:text-gray-100">洛卡</span>
          </div>
          <button className="header-btn-end">
            <Icon name="more_horiz" size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#16181B]">
        <div className="max-w-md mx-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.from === 'luka' && (
                <LukaAvatar size="sm" className="mr-2 mt-1" />
              )}

              <div className="max-w-[80%]">
                {message.image && (
                  <div className="mb-2 rounded overflow-hidden">
                    <img src={message.image} alt="" className="w-48 h-48 object-cover" />
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-xl ${
                    message.from === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  {message.isGenerating ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">生成中...</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>

                {message.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => sendMessage(option)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary/30 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {message.designs && (
                  <div className="flex gap-2 mt-3">
                    {message.designs.map((design) => (
                      <button
                        key={design.id}
                        onClick={() => handleDesignClick(design.id)}
                        className="w-24 aspect-[3/4] rounded overflow-hidden ring-2 ring-transparent hover:ring-primary transition-all shadow-sm"
                      >
                        <img src={design.image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start">
              <LukaAvatar size="sm" className="mr-2" />
              <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入 - 使用统一的 ChatInput 组件 */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={(value) => sendMessage(value)}
        onImageUpload={handleImageUpload}
        placeholder="描述你想要的..."
        multiline
        className="flex-shrink-0"
      />
    </div>
  )
}
