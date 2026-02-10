import { WishMilestone, WishStatus } from '@/types';
import { Sprout, Sparkles, Flame, PartyPopper, Target, Gift } from 'lucide-react';

// 根据图标名称或 emoji 返回对应的 Lucide 图标
const iconMap: Record<string, React.ReactNode> = {
  '🌱': <Sprout size={20} className="text-green-500" />,
  '✨': <Sparkles size={20} className="text-amber-500" />,
  '🔥': <Flame size={20} className="text-orange-500" />,
  '🎉': <PartyPopper size={20} className="text-pink-500" />,
  'sprout': <Sprout size={20} className="text-green-500" />,
  'sparkles': <Sparkles size={20} className="text-amber-500" />,
  'flame': <Flame size={20} className="text-orange-500" />,
  'party': <PartyPopper size={20} className="text-pink-500" />,
};

function getMilestoneIcon(icon: string): React.ReactNode {
  return iconMap[icon] || <Sparkles size={20} className="text-primary" />;
}

interface WishProgressTimelineProps {
  milestones: WishMilestone[];
  currentCount: number;
  targetCount: number;
  status?: WishStatus;
  className?: string;
}

export function WishProgressTimeline({
  milestones,
  currentCount,
  targetCount,
  className = '',
}: WishProgressTimelineProps) {
  const sortedMilestones = [...milestones].sort((a, b) => a.count - b.count);

  return (
    <div className={className}>
      {/* 里程碑列表 */}
      <div className="space-y-3">
        {sortedMilestones.map((milestone, index) => {
          const isNext = !milestone.reached && (index === 0 || sortedMilestones[index - 1].reached);

          return (
            <div
              key={milestone.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                milestone.reached
                  ? 'bg-primary/5'
                  : isNext
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-gray-50'
              }`}
            >
              {/* 图标 */}
              <div
                className={`size-10 rounded-full flex items-center justify-center ${
                  milestone.reached
                    ? 'bg-primary/10'
                    : isNext
                    ? 'bg-amber-100'
                    : 'bg-gray-100'
                }`}
              >
                {getMilestoneIcon(milestone.icon)}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      milestone.reached ? 'text-primary' : 'text-gray-900'
                    }`}
                  >
                    {milestone.title}
                  </span>
                  {milestone.reached && (
                    <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      已达成
                    </span>
                  )}
                  {isNext && (
                    <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full animate-pulse">
                      下一目标
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {milestone.reached
                    ? `达成于 ${formatDate(milestone.reachedAt!)}`
                    : `还差 ${milestone.count - currentCount} 人`}
                </p>
                {milestone.reward && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Gift size={12} /> {milestone.reward}
                  </p>
                )}
              </div>

              {/* 人数 */}
              <div className="text-right">
                <span
                  className={`text-lg font-bold ${
                    milestone.reached ? 'text-primary' : 'text-gray-300'
                  }`}
                >
                  {milestone.count}
                </span>
                <span className="text-xs text-gray-400">人</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 最终目标 */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
          <Target size={20} className="text-primary" />
          <span className="text-gray-700">
            目标 <span className="font-bold text-primary">{targetCount}</span> 人
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">
            已有 <span className="font-medium">{currentCount}</span> 人
          </span>
        </div>
      </div>
    </div>
  );
}

// 紧凑进度指示器
interface CompactProgressProps {
  currentCount: number;
  targetCount: number;
  className?: string;
}

export function CompactProgress({
  currentCount,
  targetCount,
  className = '',
}: CompactProgressProps) {
  const progress = (currentCount / targetCount) * 100;
  const remaining = targetCount - currentCount;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">
          {currentCount}/{targetCount} 人
        </span>
        <span className="text-xs text-primary font-medium">
          {remaining === 1
            ? '只差你一个！'
            : remaining <= 3
            ? `还差 ${remaining} 人`
            : `${Math.round(progress)}%`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-primary rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
