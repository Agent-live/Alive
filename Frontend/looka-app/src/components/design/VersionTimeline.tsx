import { DesignVersion } from '@/types';

interface VersionTimelineProps {
  versions: DesignVersion[];
  currentVersionId: string;
  onSelectVersion: (versionId: string) => void;
  className?: string;
}

export function VersionTimeline({
  versions,
  currentVersionId,
  onSelectVersion,
  className = '',
}: VersionTimelineProps) {
  // 按时间倒序排列
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">版本历史</h3>
      <div className="relative">
        {/* 时间线 */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />

        {/* 版本列表 */}
        <div className="space-y-3">
          {sortedVersions.map((version, index) => {
            const isCurrent = version.id === currentVersionId;
            const date = new Date(version.createdAt);
            const hasImage = version.images.length > 0;

            return (
              <div
                key={version.id}
                className={`relative pl-8 cursor-pointer ${
                  isCurrent ? '' : 'opacity-60 hover:opacity-100'
                }`}
                onClick={() => onSelectVersion(version.id)}
              >
                {/* 时间线节点 */}
                <div
                  className={`absolute left-1.5 top-1 size-3 rounded-full border-2 ${
                    isCurrent
                      ? 'bg-primary border-primary'
                      : 'bg-white border-gray-300'
                  }`}
                />

                {/* 版本卡片 */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* 缩略图 */}
                    {hasImage ? (
                      <div className="size-12 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={version.images[0]}
                          alt={`版本 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-gray-300">
                          image
                        </span>
                      </div>
                    )}

                    {/* 版本信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          版本 {sortedVersions.length - index}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-primary text-white text-xs">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {version.recipe.prompt || '未命名配方'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 格式化日期
function formatDate(date: Date): string {
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

// 紧凑版本选择器
interface VersionSelectorProps {
  versions: DesignVersion[];
  currentVersionId: string;
  onSelectVersion: (versionId: string) => void;
}

export function VersionSelector({
  versions,
  currentVersionId,
  onSelectVersion,
}: VersionSelectorProps) {
  const currentIndex = versions.findIndex((v) => v.id === currentVersionId);
  const currentNumber = versions.length - currentIndex;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const nextIndex = currentIndex + 1;
          if (nextIndex < versions.length) {
            onSelectVersion(versions[nextIndex].id);
          }
        }}
        disabled={currentIndex >= versions.length - 1}
        className="size-8 flex items-center justify-center rounded-full bg-gray-100 disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-gray-600 text-lg">
          chevron_left
        </span>
      </button>
      <span className="text-sm text-gray-600 min-w-[60px] text-center">
        版本 {currentNumber}/{versions.length}
      </span>
      <button
        onClick={() => {
          const prevIndex = currentIndex - 1;
          if (prevIndex >= 0) {
            onSelectVersion(versions[prevIndex].id);
          }
        }}
        disabled={currentIndex <= 0}
        className="size-8 flex items-center justify-center rounded-full bg-gray-100 disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-gray-600 text-lg">
          chevron_right
        </span>
      </button>
    </div>
  );
}
