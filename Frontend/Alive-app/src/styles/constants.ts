/**
 * 设计系统常量
 * 与 index.css 中的 CSS 变量保持同步
 * 用于在 JavaScript/TypeScript 中使用设计规范
 */

// 间距系统 (4px 基准)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

// 布局尺寸
export const LAYOUT = {
  headerHeight: 56,
  headerHeightDetail: 56,
  tabbarHeight: 56,
  bottomActionHeight: 76,
  maxWidth: 448,
  contentMaxWidth: 448,
  pageBottomPadding: 128,
  pageBottomPaddingAction: 144,
} as const;

// 圆角
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// 字体大小
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 15,
  lg: 18,
  xl: 20,
} as const;

// Z-Index 层级
export const Z_INDEX = {
  base: 1,
  dropdown: 10,
  sticky: 40,
  header: 50,
  modal: 100,
  toast: 200,
} as const;

// 过渡时间 (ms)
export const TRANSITION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

// 颜色（仅用于 JS 中需要的场景，优先使用 CSS 变量）
export const COLORS = {
  primary: '#3A4A5E',
  primaryLight: '#5E6C7D',
  primaryDark: '#2B3645',
  secondary: '#D6C9BC',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// 状态颜色
export const STATUS_COLORS = {
  wishing: '#3A4A5E',
  making: '#C9A27B',
  shipping: '#7B93A4',
  owned: '#6F8F7D',
  draft: '#9AA2AA',
} as const;

// 卡片宽高比
export const ASPECT_RATIOS = {
  card1: '4/5',    // aspect-card-1
  card2: '3/4',    // aspect-card-2
  card3: '4/5',    // aspect-card-3
  card4: '5/6',    // aspect-card-4
  square: '1/1',
  video: '16/9',
} as const;

// 类型导出
export type SpacingKey = keyof typeof SPACING;
export type RadiusKey = keyof typeof RADIUS;
export type FontSizeKey = keyof typeof FONT_SIZE;
export type ZIndexKey = keyof typeof Z_INDEX;
export type TransitionKey = keyof typeof TRANSITION;
export type StatusColorKey = keyof typeof STATUS_COLORS;
