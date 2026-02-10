import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Card, ImageSwap } from '@/components'

// 评论列表
const comments = [
  { id: '1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', name: '小美', time: '2小时前', content: '一直在找这种感觉的裙子！终于看到了', likes: 23, isLiked: true },
  { id: '2', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', name: 'Luna', time: '3小时前', content: '颜色太美了，银河色绝绝子', likes: 18, isLiked: false },
  { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', name: '设计师小王', time: '5小时前', content: '这个版型绝了，很显腰线', likes: 12, isLiked: false },
  { id: '4', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', name: '穿搭日记', time: '6小时前', content: '请问面料会不会皱？日常好打理吗', likes: 8, isLiked: false },
]

export function GroupBuyPage() {
  const navigate = useNavigate()
  const [isFollowing, setIsFollowing] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set(['1']))
  const [commentText, setCommentText] = useState('')

  const toggleLike = (commentId: string) => {
    setLikedComments(prev => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">愿望详情</h1>
          <button className="header-btn-end">
            <Icon name="share" size={24} />
          </button>
        </div>
      </header>

      <div className="content-detail ">
        {/* 主图 */}
        <div className="pt-2">
          <div className="aspect-[4/5] relative rounded overflow-hidden">
            <ImageSwap
              mainImage="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800"
              thumbImage="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200"
              alt="星空渐变连衣裙"
              className="w-full h-full"
              thumbSize="lg"
            />
            {/* 右下角：想要人数 */}
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
              <Icon name="favorite" size={14} className="text-primary" filled />
              <span className="text-white text-xs font-medium">23</span>
            </div>
          </div>
        </div>

        {/* 设计信息 + 发起者 */}
        <div className="pt-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">星空渐变连衣裙</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">"想要一条像银河一样的裙子"</p>

          {/* 发起者信息 */}
          <div className="flex items-center justify-between mt-3 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">小美</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">许下了这个愿望</p>
              </div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                  : 'bg-primary text-white'
              }`}
            >
              {isFollowing ? '已关注' : '关注'}
            </button>
          </div>
        </div>

        {/* 设计详情 */}
        <div className="mt-2">
          <Card>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Icon name="auto_awesome" size={20} className="text-primary" />
              愿望详情
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 dark:text-gray-500">风格</span>
                <span>梦幻 · 日常可穿</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 dark:text-gray-500">面料</span>
                <span>轻薄雪纺</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 dark:text-gray-500">长度</span>
                <span>及膝</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 dark:text-gray-500">配色</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full bg-indigo-900" />
                  <div className="w-4 h-4 rounded-full bg-purple-600" />
                  <div className="w-4 h-4 rounded-full bg-pink-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 评论区 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Icon name="chat_bubble" size={20} className="text-primary" />
              讨论 ({comments.length})
            </h3>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{comment.name}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{comment.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className="flex items-center gap-1 mt-2"
                  >
                    <Icon
                      name={likedComments.has(comment.id) ? 'favorite' : 'favorite_border'}
                      size={14}
                      className={likedComments.has(comment.id) ? 'text-primary' : 'text-gray-400'}
                      filled={likedComments.has(comment.id)}
                    />
                    <span className={`text-xs ${likedComments.has(comment.id) ? 'text-primary' : 'text-gray-400'}`}>
                      {comment.likes + (likedComments.has(comment.id) && !comments.find(c => c.id === comment.id)?.isLiked ? 1 : 0)}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="bottom-action">
        <div className="bottom-action-inner">
          <div className="flex items-center gap-3">
            {/* 评论输入 */}
            <div className="input-comment">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="说点什么..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            {/* 试穿/发送按钮 */}
            <button
              onClick={() => commentText.trim() ? setCommentText('') : navigate('/try-on')}
              className="h-11 px-5 bg-primary text-white font-medium rounded-full flex items-center justify-center gap-1.5 active:scale-[0.95] transition-all duration-200"
            >
              <span
                className={`flex items-center justify-center transition-all duration-200 ${
                  commentText.trim() ? 'rotate-0 scale-100' : 'rotate-[-90deg] scale-0 w-0 overflow-hidden'
                }`}
              >
                <Icon name="send" size={18} />
              </span>
              <span
                className={`flex items-center justify-center transition-all duration-200 ${
                  commentText.trim() ? 'rotate-90 scale-0 w-0 overflow-hidden' : 'rotate-0 scale-100'
                }`}
              >
                <Icon name="checkroom" size={18} />
              </span>
              <span className="relative overflow-hidden h-5 flex items-center">
                <span
                  className={`block leading-5 transition-all duration-200 ${
                    commentText.trim() ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                  }`}
                >
                  发送
                </span>
                <span
                  className={`block absolute inset-0 leading-5 flex items-center justify-center transition-all duration-200 ${
                    commentText.trim() ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                  }`}
                >
                  试穿
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
