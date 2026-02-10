// Masonry Layout Component - Supports both image gallery and generic card layouts
//
// Usage for Cards:
// <Masonry gap={16} columns={{ default: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
//   {items.map(item => <Card key={item.id}>...</Card>)}
// </Masonry>
//
// Usage for Images (legacy):
// <Masonry
//   items={items}
//   ease="power3.out"
//   duration={0.6}
//   stagger={0.05}
//   animateFrom="bottom"
// />

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, Children, isValidElement, ReactNode, ReactElement } from 'react';
import { gsap } from 'gsap';

// ========== Responsive Column Hook ==========
interface ColumnBreakpoints {
  default: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

const useResponsiveColumns = (breakpoints: ColumnBreakpoints): number => {
  const getColumns = () => {
    if (typeof window === 'undefined') return breakpoints.default;
    const width = window.innerWidth;
    if (width >= 1536 && breakpoints['2xl']) return breakpoints['2xl'];
    if (width >= 1280 && breakpoints.xl) return breakpoints.xl;
    if (width >= 1024 && breakpoints.lg) return breakpoints.lg;
    if (width >= 768 && breakpoints.md) return breakpoints.md;
    if (width >= 640 && breakpoints.sm) return breakpoints.sm;
    return breakpoints.default;
  };

  const [columns, setColumns] = useState(getColumns);

  useEffect(() => {
    const handler = () => setColumns(getColumns());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoints]);

  return columns;
};

// ========== Measure Hook ==========
const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

// ========== Card Masonry Component (New) ==========
interface CardMasonryProps {
  children: ReactNode;
  columns?: ColumnBreakpoints;
  gap?: number;
  className?: string;
  animate?: boolean; // 是否显示入场动画
}

export function CardMasonry({
  children,
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 16,
  className = '',
  animate = false,
}: CardMasonryProps) {
  const columnCount = useResponsiveColumns(columns);
  const [containerRef, { width: containerWidth }] = useMeasure<HTMLDivElement>();
  const childArray = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const childSignature = childArray.map((child, index) => child.key ?? index).join('|');

  // 存储每个卡片的测量高度
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observersRef = useRef<ResizeObserver[]>([]);

  // 使用 ResizeObserver 监听每个卡片的高度变化
  useEffect(() => {
    // 清理旧的 observers
    observersRef.current.forEach(obs => obs.disconnect());
    observersRef.current = [];

    const newHeights: number[] = new Array(childArray.length).fill(0);

    itemRefs.current.forEach((el, index) => {
      if (el) {
        // 初始测量
        newHeights[index] = el.offsetHeight;

        // 创建 ResizeObserver 监听变化
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            setItemHeights(prev => {
              const updated = [...prev];
              updated[index] = entry.contentRect.height;
              return updated;
            });
          }
        });
        observer.observe(el);
        observersRef.current.push(observer);
      }
    });

    setItemHeights(newHeights);

    return () => {
      observersRef.current.forEach(obs => obs.disconnect());
    };
  }, [childArray.length, containerWidth, childSignature]);

  // 根据实际高度计算每个卡片的位置
  const { positions, containerHeight } = useMemo(() => {
    if (!containerWidth || itemHeights.length === 0 || itemHeights.every(h => h === 0)) {
      return { positions: [], containerHeight: 0 };
    }

    const colWidth = (containerWidth - (columnCount - 1) * gap) / columnCount;
    const colHeights = new Array(columnCount).fill(0);
    const positions: { x: number; y: number }[] = [];

    // 记录每列的卡片数量
    const colCounts = new Array(columnCount).fill(0);

    // 计算平均卡片高度作为阈值基准
    const validHeights = itemHeights.filter(h => h > 0);
    const avgHeight = validHeights.length > 0
      ? validHeights.reduce((a, b) => a + b, 0) / validHeights.length
      : 150;
    const heightThreshold = avgHeight * 0.5; // 高度差阈值：平均高度的一半

    childArray.forEach((_, index) => {
      const height = itemHeights[index] || 0;

      // 找最短列的高度
      const minHeight = Math.min(...colHeights);

      // 筛选出"高度相近"的候选列（与最短列的高度差 < 阈值）
      const candidateCols: number[] = [];
      for (let i = 0; i < columnCount; i++) {
        if (colHeights[i] - minHeight < heightThreshold) {
          candidateCols.push(i);
        }
      }

      // 在候选列中，选数量最少的；数量相同选最左边
      let bestCol = candidateCols[0];
      for (const col of candidateCols) {
        if (colCounts[col] < colCounts[bestCol]) {
          bestCol = col;
        }
      }

      const x = bestCol * (colWidth + gap);
      const y = colHeights[bestCol];

      positions.push({ x, y });
      colHeights[bestCol] += height + gap;
      colCounts[bestCol]++;
    });

    return {
      positions,
      containerHeight: Math.max(...colHeights),
    };
  }, [containerWidth, columnCount, gap, childArray.length, itemHeights, childSignature]);

  const colWidth = containerWidth ? (containerWidth - (columnCount - 1) * gap) / columnCount : 0;
  const isReady = positions.length > 0 && itemHeights.some(h => h > 0);

  // 估算初始容器高度
  const estimatedItemHeight = 150;
  const rowCount = Math.ceil(childArray.length / columnCount);
  const estimatedHeight = rowCount * (estimatedItemHeight + gap);
  const finalHeight = isReady && containerHeight > 0 ? containerHeight : estimatedHeight;

  // 在测量完成前使用 CSS columns 布局，避免重叠
  if (!isReady) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          columnCount,
          columnGap: gap,
        }}
      >
        {childArray.map((child, index) => (
          <div
            key={(child as ReactElement).key || index}
            ref={(el) => { itemRefs.current[index] = el; }}
            style={{ marginBottom: gap, breakInside: 'avoid' }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  // 测量完成后使用绝对定位的瀑布流布局
  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ minHeight: finalHeight }}
    >
      {childArray.map((child, index) => {
        const pos = positions[index];
        const finalPos = pos || { x: 0, y: 0 };

        // 按行计算动画延迟，同一行的卡片同时出现
        const row = Math.floor(index / columnCount);
        const animationDelay = animate ? row * 100 : 0;

        return (
          <div
            key={(child as ReactElement).key || index}
            ref={(el) => { itemRefs.current[index] = el; }}
            className={`absolute ${animate ? 'transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-3' : ''}`}
            style={{
              width: colWidth || '100%',
              transform: `translate(${finalPos.x}px, ${finalPos.y}px)`,
              ...(animate && {
                animationDelay: `${animationDelay}ms`,
                animationFillMode: 'backwards',
              }),
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

// ========== Legacy Image Masonry (Original) ==========
const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue;

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get);
    queries.forEach(q => matchMedia(q).addEventListener('change', handler));
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler));
  }, [queries]);

  return value;
};

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      src =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        })
    )
  );
};

interface Item {
  id: string;
  img: string;
  url: string;
  height: number;
}

interface GridItem extends Item {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MasonryProps {
  items: Item[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false
}) => {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    1
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === 'random') {
      const dirs = ['top', 'bottom', 'left', 'right'];
      direction = dirs[Math.floor(Math.random() * dirs.length)] as typeof animateFrom;
    }

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 };
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 };
      case 'left':
        return { x: -200, y: item.y };
      case 'right':
        return { x: window.innerWidth + 200, y: item.y };
      case 'center':
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  useEffect(() => {
    preloadImages(items.map(i => i.img)).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return [];
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const height = child.height / 2;
      const y = colHeights[col];

      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!imagesReady) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        const start = getInitialPosition(item);
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: start.x,
            y: start.y,
            width: item.w,
            height: item.h,
            ...(blurToFocus && { filter: 'blur(10px)' })
          },
          {
            opacity: 1,
            ...animProps,
            ...(blurToFocus && { filter: 'blur(0px)' }),
            duration: 0.8,
            ease: 'power3.out',
            delay: index * stagger
          }
        );
      } else {
        gsap.to(selector, {
          ...animProps,
          duration,
          ease,
          overwrite: 'auto'
        });
      }
    });

    hasMounted.current = true;
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

  const handleMouseEnter = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay') as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
    }
  };

  const handleMouseLeave = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay') as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {grid.map(item => (
        <div
          key={item.id}
          data-key={item.id}
          className="absolute box-content"
          style={{ willChange: 'transform, width, height, opacity' }}
          onClick={() => window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={e => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={e => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center rounded-[10px] uppercase text-[10px] leading-[10px]"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            {colorShiftOnHover && (
              <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Masonry;
