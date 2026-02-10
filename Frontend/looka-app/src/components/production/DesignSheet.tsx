import { DesignView, SpecificationItem } from '@/types';
import { useState } from 'react';

interface DesignSheetProps {
  views: DesignView[];
  specifications?: SpecificationItem[];
  className?: string;
}

export function DesignSheet({ views, specifications, className = '' }: DesignSheetProps) {
  const [activeView, setActiveView] = useState(0);

  return (
    <div className={className}>
      {/* 图纸展示 */}
      <div className="relative aspect-square surface-inset rounded-xl overflow-hidden">
        {views.length > 0 ? (
          <img
            src={views[activeView].image}
            alt={views[activeView].label || views[activeView].type}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl">image</span>
          </div>
        )}

        {/* 视图标签 */}
        {views[activeView]?.label && (
          <div className="absolute top-3 left-3 px-3 py-1 surface-glass rounded-full">
            <span className="text-sm font-medium text-gray-700">
              {views[activeView].label}
            </span>
          </div>
        )}

        {/* 缩放按钮 */}
        <button className="absolute bottom-3 right-3 size-10 surface-glass rounded-full flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-gray-600">zoom_in</span>
        </button>
      </div>

      {/* 视图切换 */}
      {views.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {views.map((view, index) => (
            <button
              key={index}
              onClick={() => setActiveView(index)}
              className={`size-14 rounded-lg overflow-hidden border-2 transition-colors ${
                index === activeView
                  ? 'border-primary'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <img
                src={view.image}
                alt={view.label || view.type}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 规格信息 */}
      {specifications && specifications.length > 0 && (
        <div className="mt-4 p-4 surface-muted rounded-xl">
          <h4 className="text-sm font-medium text-gray-700 mb-3">制作规格</h4>
          <div className="grid grid-cols-2 gap-3">
            {specifications.map((spec, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{spec.label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {spec.value}
                  {spec.unit && <span className="text-gray-400 ml-0.5">{spec.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 设计图纸网格
interface DesignSheetGridProps {
  views: DesignView[];
  onViewClick?: (index: number) => void;
  className?: string;
}

export function DesignSheetGrid({
  views,
  onViewClick,
  className = '',
}: DesignSheetGridProps) {
  const viewLabels: Record<string, string> = {
    front: '正面',
    back: '背面',
    side: '侧面',
    detail: '细节',
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {views.map((view, index) => (
        <div
          key={index}
          onClick={() => onViewClick?.(index)}
          className={`aspect-square surface-inset rounded-lg overflow-hidden relative ${
            onViewClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
          }`}
        >
          <img
            src={view.image}
            alt={view.label || viewLabels[view.type]}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-white text-xs">
            {view.label || viewLabels[view.type]}
          </div>
        </div>
      ))}
    </div>
  );
}

// 规格卡片
interface SpecificationCardProps {
  specifications: SpecificationItem[];
  title?: string;
  className?: string;
}

export function SpecificationCard({
  specifications,
  title = '规格参数',
  className = '',
}: SpecificationCardProps) {
  return (
    <div className={`surface-card rounded-xl p-4 ${className}`}>
      <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2.5">
        {specifications.map((spec, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
          >
            <span className="text-sm text-gray-500">{spec.label}</span>
            <span className="text-sm font-medium text-gray-900">
              {spec.value}
              {spec.unit && (
                <span className="text-gray-400 font-normal ml-0.5">{spec.unit}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
