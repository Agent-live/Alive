import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWishStore } from '@/store';
import { WishProgressTimeline } from '@/components/wish/WishProgressTimeline';
import { ParticipantFeed } from '@/components/wish/ParticipantFeed';
import { AvatarStack } from '@/components/wish/WishCard';
import { ShareSheet, ShareButton } from '@/components/social/ShareSheet';
import { EmotionalBadge } from '@/components/common/EmotionalBadge';
import { WishDetailSkeleton } from '@/components/feedback';
import { Icon } from '@/components';
import { Flame, PartyPopper, Star, Heart, Sparkles, ChevronRight } from 'lucide-react';

export default function WishDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    currentWishDetail,
    wishDetailLoading,
    activities,
    fetchWishDetail,
    postActivity,
    hasJoinedGroupBuy,
    joinGroupBuy,
    clearWishDetail,
  } = useWishStore();

  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'progress' | 'feed'>('story');
  const [showTryOn, setShowTryOn] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWishDetail(id);
    }
    return () => clearWishDetail();
  }, [id, fetchWishDetail, clearWishDetail]);

  const handleJoin = () => {
    if (id) {
      joinGroupBuy(id, 'M', 'default');
    }
  };

  const handlePostComment = (content: string) => {
    if (id) {
      postActivity({ wishId: id, type: 'comment', content });
    }
  };

  if (wishDetailLoading || !currentWishDetail) {
    return <WishDetailSkeleton />;
  }

  const wish = currentWishDetail;
  const hasJoined = hasJoinedGroupBuy(wish.id);
  const remaining = wish.targetCount - wish.currentCount;

  return (
    <div className="app-shell app-shell--scroll">
      <div className="app-scroll">
        {/* Header */}
        <header className="header-detail">
          <div className="header-detail-inner">
            <button onClick={() => navigate(-1)} className="header-btn-start">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="header-title-center">愿望详情</h1>
            <ShareButton onClick={() => setShowShare(true)} variant="icon" className="!bg-transparent" />
          </div>
        </header>

        {/* 主内容 */}
        <div className="content-detail">
        {/* 商品图片 */}
        <div className="relative aspect-[3/4]">
          <img
            src={showTryOn ? wish.tryOnImage : wish.product.image}
            alt={wish.product.name}
            className="w-full h-full object-cover"
          />
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* 切换小图 - 右下角 */}
          {wish.tryOnImage && (
            <button
              onClick={() => setShowTryOn(!showTryOn)}
              className="absolute bottom-20 right-4 w-16 h-20 border-2 border-white shadow-lg overflow-hidden active:scale-95 transition-transform"
            >
              <img
                src={showTryOn ? wish.product.image : wish.tryOnImage}
                alt={showTryOn ? '商品图' : '试穿效果'}
                className="w-full h-full object-cover"
              />
            </button>
          )}

          {/* 底部信息 */}
          <div className="absolute bottom-4 left-4 right-24">
            <EmotionalBadge status="wishing" size="sm" />
            <h1 className="text-2xl font-bold text-white mt-2">{wish.product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <AvatarStack avatars={wish.participantAvatars || []} size="sm" light />
                <span className="text-white/80 text-sm">{wish.currentCount} 人已加入</span>
              </div>
              <span className="text-white/60 text-sm">
                {formatRemainingTime(wish.remainingTime || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* 进度概览 */}
        <div className="px-4 py-4 surface-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
              {remaining === 1 && <Flame size={16} className="text-orange-500" />}
              {remaining === 1 ? '只差最后一人！' : `还差 ${remaining} 人达成`}
            </span>
            <span className="text-primary font-bold">{wish.progress || 0}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${wish.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="sticky z-40 surface-panel border-b border-gray-100" style={{ top: 'calc(44px + env(safe-area-inset-top, 0px))' }}>
          <div className="flex justify-center gap-8 px-4">
            {[
              { key: 'story', label: '故事' },
              { key: 'progress', label: '里程碑' },
              { key: 'feed', label: '动态' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-3 text-sm relative ${
                  activeTab === tab.key
                    ? 'font-bold text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="px-4 py-4">
          {/* 故事 Tab */}
          {activeTab === 'story' && (
            <div className="space-y-6">
              {/* 愿望故事 */}
              {wish.story && (
                <div className="p-4 surface-muted rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-primary">
                      {wish.story.emotion === 'excited' && <PartyPopper size={18} />}
                      {wish.story.emotion === 'hopeful' && <Star size={18} />}
                      {wish.story.emotion === 'grateful' && <Heart size={18} />}
                      {wish.story.emotion === 'dreamy' && <Sparkles size={18} />}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{wish.story.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {wish.story.content}
                  </p>
                </div>
              )}

              {/* 价格信息 */}
              <div className="flex items-center justify-between p-4 surface-card rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">愿望达成价</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ¥{wish.groupPrice}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">原价</p>
                  <p className="text-lg text-gray-400 line-through mt-1">
                    ¥{wish.originalPrice}
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-red-50 rounded-full">
                  <span className="text-red-500 font-bold text-sm">
                    省 {wish.savingsPercent}%
                  </span>
                </div>
              </div>

              {/* 规则说明 */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">愿望规则</h3>
                <ul className="space-y-2">
                  {wish.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-primary">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 生产预览入口 */}
              {wish.status === 'success' && (
                <button
                  onClick={() => navigate(`/production/${wish.id}`)}
                  className="w-full p-4 bg-emerald-50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <PartyPopper size={24} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-700">愿望达成！</p>
                      <p className="text-sm text-emerald-600">查看生产进度</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-emerald-600" />
                </button>
              )}
            </div>
          )}

          {/* 里程碑 Tab */}
          {activeTab === 'progress' && (
            <WishProgressTimeline
              milestones={wish.emotionalMilestones}
              currentCount={wish.currentCount}
              targetCount={wish.targetCount}
              status={wish.status}
            />
          )}

          {/* 动态 Tab */}
          {activeTab === 'feed' && (
            <ParticipantFeed
              activities={activities}
              onPost={hasJoined ? handlePostComment : undefined}
            />
          )}
        </div>
      </div>
      </div>

      {/* 底部操作栏 */}
      <div className="bottom-action">
        <div className="bottom-action-inner">
          {/* 价格信息 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">¥{wish.groupPrice}</span>
              <span className="text-sm text-gray-400 line-through">¥{wish.originalPrice}</span>
            </div>
            <span className="text-xs text-gray-500">
              还差 <span className="text-primary font-bold">{remaining}</span> 人达成
            </span>
          </div>
          {/* 按钮组 */}
          <div className="flex items-center gap-3">
            {/* 试装按钮 */}
            <button
              onClick={() => navigate('/try-on')}
              className="h-12 w-12 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform"
              aria-label="试穿效果"
            >
              <Icon name="checkroom" size={22} />
            </button>
            {/* 加入按钮 */}
            <button
              onClick={handleJoin}
              disabled={hasJoined || wish.status !== 'active'}
              className={`flex-1 h-12 rounded-xl font-bold text-base relative overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-60 ${
                hasJoined ? 'bg-gray-200 text-gray-400' : 'bg-gradient-primary text-white shadow-button'
              }`}
            >
              {hasJoined ? '已加入' : remaining === 1 ? '成为最后一人' : '一起许愿'}
            </button>
          </div>
        </div>
      </div>

      {/* 分享面板 */}
      <ShareSheet
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={wish.product.name}
        description={`还差 ${remaining} 人就能达成愿望！`}
        image={wish.product.image}
      />
    </div>
  );
}

// 格式化剩余时间
function formatRemainingTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return `剩余 ${days} 天`;
  }
  if (hours > 0) {
    return `剩余 ${hours} 小时`;
  }
  return '即将结束';
}
