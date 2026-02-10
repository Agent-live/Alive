import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWishStore } from '@/store';
import { RecipePublicToggle } from '@/components/social/RemixButton';
import { X, Sparkles, Info } from 'lucide-react';

export default function WishCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createWish } = useWishStore();

  const designId = location.state?.designId || '';

  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [targetCount, setTargetCount] = useState(10);
  const [duration, setDuration] = useState(7);
  const [isPublic, setIsPublic] = useState(true);
  const [isRecipePublic, setIsRecipePublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const wishId = await createWish({
        designId,
        title,
        story,
        targetCount,
        duration,
        isPublic,
      });
      navigate(`/wish/${wishId}`, { replace: true });
    } catch (error) {
      console.error('Failed to create wish:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#16181B]">
      {/* Header */}
      <header
        className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#16181B]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-3 h-11 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-start">
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">发起愿望</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 主内容 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pb-8">
          {/* 头部说明 */}
          <div className="py-6 text-center">
            <div className="size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
              <Sparkles size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4">
              让更多人一起实现这个设计
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              当达到目标人数，设计将进入生产
            </p>
          </div>

          {/* 表单 */}
          <div className="space-y-5">
            {/* 愿望标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                愿望标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的愿望起个名字"
                maxLength={30}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {title.length}/30
              </p>
            </div>

            {/* 愿望故事 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                愿望故事
                <span className="text-gray-400 font-normal ml-1">（选填）</span>
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="分享一下你为什么想要这件衣服，或者背后的小故事..."
                maxLength={200}
                className="input-field h-24 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {story.length}/200
              </p>
            </div>

            {/* 目标人数 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                目标人数
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTargetCount(count)}
                    className={`py-3 rounded-xl text-center transition-colors ${
                      targetCount === count
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-lg font-bold">{count}</span>
                    <span className="text-xs block mt-0.5">人</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                人数越多，单件价格越优惠
              </p>
            </div>

            {/* 期限 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                愿望期限
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDuration(days)}
                    className={`py-3 rounded-xl text-center transition-colors ${
                      duration === days
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-lg font-bold">{days}</span>
                    <span className="text-xs block mt-0.5">天</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              {/* 公开设置 */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">公开愿望</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    让更多人发现并加入你的愿望
                  </p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isPublic ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className="absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: isPublic ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {/* 配方公开 */}
              <RecipePublicToggle
                isPublic={isRecipePublic}
                onToggle={setIsRecipePublic}
                className="mt-3"
              />
            </div>

            {/* 预估信息 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">预估信息</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">预估单价</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    ¥{targetCount <= 10 ? 399 : targetCount <= 20 ? 349 : 299}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">预计生产周期</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">7-14 天</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">截止日期</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toLocaleDateString(
                      'zh-CN',
                      { month: 'long', day: 'numeric' }
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 提示 */}
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                愿望发起后，如果在期限内未达到目标人数，已支付的金额将全额退还
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div
        className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#16181B] p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary/90 to-primary text-white font-bold text-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? '发起中...' : '发起愿望'}
          </button>
        </div>
      </div>
    </div>
  );
}
