import { FabricInfo } from '@/types';
import { useState } from 'react';

interface FabricCardProps {
  fabric: FabricInfo;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function FabricCard({
  fabric,
  expanded = false,
  onToggle,
  className = '',
}: FabricCardProps) {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div
      className={`surface-card rounded-xl overflow-hidden ${className}`}
    >
      {/* 头部 */}
      <div
        className={`flex items-center gap-3 p-4 ${onToggle ? 'cursor-pointer' : ''}`}
        onClick={onToggle}
      >
        {/* 面料预览图 */}
        <div className="size-14 rounded-lg overflow-hidden flex-shrink-0 surface-inset">
          {fabric.images.length > 0 ? (
            <img
              src={fabric.images[0]}
              alt={fabric.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-300">texture</span>
            </div>
          )}
        </div>

        {/* 基本信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900">{fabric.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{fabric.texture}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 surface-muted px-2 py-0.5 rounded-full">
              {fabric.origin}
            </span>
          </div>
        </div>

        {/* 展开图标 */}
        {onToggle && (
          <span
            className={`material-symbols-outlined text-gray-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        )}
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50">
          {/* 面料图片轮播 */}
          {fabric.images.length > 1 && (
            <div className="mt-3">
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden surface-inset">
                <img
                  src={fabric.images[currentImage]}
                  alt={`${fabric.name} ${currentImage + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-center gap-1.5 mt-2">
                {fabric.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`size-1.5 rounded-full transition-colors ${
                      index === currentImage ? 'bg-primary' : 'bg-black/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 成分 */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">成分</h4>
            <div className="flex flex-wrap gap-2">
              {fabric.composition.map((comp, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>

          {/* 特性 */}
          {fabric.features && fabric.features.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">特性</h4>
              <div className="grid grid-cols-2 gap-2">
                {fabric.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="text-emerald-500">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 洗涤说明 */}
          {fabric.careInstructions && fabric.careInstructions.length > 0 && (
            <div className="mt-4 p-3 surface-muted rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">local_laundry_service</span>
                洗涤建议
              </h4>
              <ul className="space-y-1">
                {fabric.careInstructions.map((instruction, index) => (
                  <li key={index} className="text-xs text-gray-500 flex items-start gap-1">
                    <span>•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 紧凑版面料标签
interface FabricTagProps {
  fabric: FabricInfo;
  onClick?: () => void;
}

export function FabricTag({ fabric, onClick }: FabricTagProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 surface-soft rounded-full hover:bg-amber-100 transition-colors"
    >
      <div className="size-5 rounded overflow-hidden bg-amber-100">
        {fabric.images.length > 0 ? (
          <img
            src={fabric.images[0]}
            alt={fabric.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-amber-400 text-sm">texture</span>
        )}
      </div>
      <span className="text-sm text-amber-700">{fabric.name}</span>
      {onClick && (
        <span className="material-symbols-outlined text-amber-400 text-sm">
          chevron_right
        </span>
      )}
    </button>
  );
}
