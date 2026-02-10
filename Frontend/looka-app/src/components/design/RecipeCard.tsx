import { DesignRecipe, DesignParameters } from '@/types';

interface RecipeCardProps {
  recipe: DesignRecipe;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}


export function RecipeCard({
  recipe,
  onClick,
  showDetails = false,
  className = '',
}: RecipeCardProps) {
  const { prompt, parameters, references } = recipe;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-100 overflow-hidden ${
        onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* 配方头部 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🧪</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2">{prompt}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(recipe.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* 参数标签 */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {parameters.style && (
            <ParameterTag label="风格" value={parameters.style} />
          )}
          {parameters.fabric && (
            <ParameterTag label="面料" value={parameters.fabric} />
          )}
          {parameters.scenario && (
            <ParameterTag label="场景" value={parameters.scenario} />
          )}
          {parameters.fit && (
            <ParameterTag label="版型" value={parameters.fit} />
          )}
        </div>
      </div>

      {/* 参考图 */}
      {references.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {references.slice(0, 4).map((ref, index) => (
              <div
                key={ref.id}
                className="size-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"
              >
                <img
                  src={ref.url}
                  alt={`参考图 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {references.length > 4 && (
              <div className="size-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-500">+{references.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 详细参数（展开时显示） */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <DetailItem
              label="预算范围"
              value={`¥${parameters.budget.min} - ¥${parameters.budget.max}`}
            />
            <DetailItem
              label="个性度"
              value={`${parameters.intensity}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 参数标签组件
function ParameterTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700">{value}</span>
    </span>
  );
}

// 详情项组件
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

// 配方预览组件（紧凑版）
interface RecipePreviewProps {
  parameters: DesignParameters;
  className?: string;
}

export function RecipePreview({ parameters, className = '' }: RecipePreviewProps) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {parameters.style && (
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
          {parameters.style}
        </span>
      )}
      {parameters.fabric && (
        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs">
          {parameters.fabric}
        </span>
      )}
      {parameters.scenario && (
        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-xs">
          {parameters.scenario}
        </span>
      )}
    </div>
  );
}
