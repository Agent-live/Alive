import { WishActivity, WishActivityType } from '@/types';
import { useState } from 'react';

interface ParticipantFeedProps {
  activities: WishActivity[];
  onPost?: (content: string) => void;
  className?: string;
}

export function ParticipantFeed({
  activities,
  onPost,
  className = '',
}: ParticipantFeedProps) {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (comment.trim() && onPost) {
      onPost(comment.trim());
      setComment('');
    }
  };

  return (
    <div className={className}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">许愿动态</h3>
        <span className="text-xs text-gray-400">{activities.length} 条动态</span>
      </div>

      {/* 评论输入 */}
      {onPost && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="说点什么..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!comment.trim()}
              className="text-primary text-sm font-medium disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* 动态列表 */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>

      {/* 空状态 */}
      {activities.length === 0 && (
        <div className="py-8 text-center">
          <span className="text-4xl">💬</span>
          <p className="text-gray-400 text-sm mt-2">还没有动态，快来第一个留言吧</p>
        </div>
      )}
    </div>
  );
}

// 活动项组件
interface ActivityItemProps {
  activity: WishActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const { type, user, content, createdAt } = activity;
  const config = getActivityConfig(type);

  // 系统消息特殊处理
  if (type === 'milestone') {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="px-4 py-2 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full">
          <span className="text-sm text-gray-600">{content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* 头像 */}
      <div className="size-9 rounded-full overflow-hidden flex-shrink-0">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.nickname}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-sm font-medium">
              {user.nickname.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">{user.nickname}</span>
          <span className="text-xs text-gray-400">{formatTimeAgo(createdAt)}</span>
        </div>
        <div className="flex items-start gap-1 mt-0.5">
          <span className="text-sm">{config.icon}</span>
          <span className="text-sm text-gray-600">
            {type === 'comment' ? content : config.text}
          </span>
        </div>
      </div>
    </div>
  );
}

// 活动类型配置
function getActivityConfig(type: WishActivityType): { icon: string; text: string } {
  const configs: Record<WishActivityType, { icon: string; text: string }> = {
    join: { icon: '🎉', text: '加入了愿望' },
    comment: { icon: '💬', text: '' },
    like: { icon: '❤️', text: '喜欢了这个愿望' },
    share: { icon: '🔗', text: '分享了这个愿望' },
    milestone: { icon: '🏆', text: '' },
  };
  return configs[type];
}

// 格式化时间
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 参与者头像墙
interface ParticipantWallProps {
  participants: { id: string; nickname: string; avatar?: string }[];
  max?: number;
  className?: string;
}

export function ParticipantWall({
  participants,
  max = 12,
  className = '',
}: ParticipantWallProps) {
  const displayed = participants.slice(0, max);
  const remaining = participants.length - max;

  return (
    <div className={className}>
      <h3 className="font-bold text-gray-900 mb-3">
        参与者 <span className="text-gray-400 font-normal">({participants.length})</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayed.map((participant) => (
          <div key={participant.id} className="flex flex-col items-center">
            <div className="size-10 rounded-full overflow-hidden">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm font-medium">
                    {participant.nickname.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-1 max-w-[40px] truncate">
              {participant.nickname}
            </span>
          </div>
        ))}
        {remaining > 0 && (
          <div className="flex flex-col items-center">
            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 text-xs font-medium">+{remaining}</span>
            </div>
            <span className="text-xs text-gray-400 mt-1">更多</span>
          </div>
        )}
      </div>
    </div>
  );
}
