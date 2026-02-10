import { ProductionStage } from '@/types';

interface ProductionTimelineProps {
  stages: ProductionStage[];
  className?: string;
}

export function ProductionTimeline({ stages, className = '' }: ProductionTimelineProps) {
  const completedCount = stages.filter((s) => s.status === 'completed').length;

  return (
    <div className={className}>
      {/* 头部统计 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">生产进度</h3>
        <span className="text-sm text-gray-500">
          {completedCount}/{stages.length} 完成
        </span>
      </div>

      {/* 时间线 */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'in_progress';
          const isPending = stage.status === 'pending';

          return (
            <div key={stage.id} className="relative flex gap-4">
              {/* 连接线 */}
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-[17px] top-9 w-0.5 h-[calc(100%+8px)] ${
                    isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* 状态图标 */}
              <div className="relative z-10 flex-shrink-0">
                {isCompleted ? (
                  <div className="size-9 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">
                      check
                    </span>
                  </div>
                ) : isCurrent ? (
                  <div className="size-9 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-white text-lg">
                      {getStageIcon(stage.name)}
                    </span>
                  </div>
                ) : (
                  <div className="size-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-lg">
                      {getStageIcon(stage.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-medium ${
                      isCompleted
                        ? 'text-emerald-600'
                        : isCurrent
                        ? 'text-primary'
                        : 'text-gray-400'
                    }`}
                  >
                    {stage.name}
                  </h4>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs animate-pulse">
                      进行中
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-1 ${
                    isPending ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {stage.description}
                </p>
                {/* 时间信息 */}
                <div className="flex items-center gap-3 mt-2">
                  {isCompleted && stage.completedAt && (
                    <span className="text-xs text-gray-400">
                      完成于 {formatDate(stage.completedAt)}
                    </span>
                  )}
                  {isCurrent && stage.startedAt && (
                    <span className="text-xs text-gray-400">
                      开始于 {formatDate(stage.startedAt)}
                    </span>
                  )}
                  {isPending && (
                    <span className="text-xs text-gray-400">
                      预计 {stage.estimatedDays} 天
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 紧凑进度条
interface CompactProductionProgressProps {
  stages: ProductionStage[];
  className?: string;
}

export function CompactProductionProgress({
  stages,
  className = '',
}: CompactProductionProgressProps) {
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const currentStage = stages.find((s) => s.status === 'in_progress');
  const progress = (completedCount / stages.length) * 100;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {currentStage ? currentStage.name : '等待开始'}
        </span>
        <span className="text-xs text-gray-400">
          {completedCount}/{stages.length}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* 阶段指示点 */}
      <div className="flex justify-between mt-1.5">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`size-1.5 rounded-full ${
              stage.status === 'completed'
                ? 'bg-emerald-500'
                : stage.status === 'in_progress'
                ? 'bg-primary animate-pulse'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// 预计交付卡片
interface DeliveryEstimateProps {
  estimatedDate: string;
  stages: ProductionStage[];
  className?: string;
}

export function DeliveryEstimate({
  estimatedDate,
  stages,
  className = '',
}: DeliveryEstimateProps) {
  const remainingDays = stages
    .filter((s) => s.status !== 'completed')
    .reduce((sum, s) => sum + s.estimatedDays, 0);

  return (
    <div className={`p-4 bg-sky-50 rounded-xl ${className}`}>
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-sky-600">local_shipping</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">预计送达</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">
            {formatDeliveryDate(estimatedDate)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            预计还需 {remainingDays} 天完成生产
          </p>
        </div>
      </div>
    </div>
  );
}

// 获取阶段图标
function getStageIcon(name: string): string {
  const icons: Record<string, string> = {
    设计确认: 'design_services',
    面料采购: 'inventory_2',
    裁剪: 'content_cut',
    缝制: 'edit',
    质检: 'verified',
    包装: 'package_2',
    发货: 'local_shipping',
  };
  return icons[name] || 'circle';
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatDeliveryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}
