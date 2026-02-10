/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 主题色 - 优雅玫瑰棕
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
          soft: "var(--color-primary-soft)",
        },
        // 状态色 (4个)
        status: {
          wishing: "var(--color-primary)", // 等于 primary
          making: "#D4A574",
          shipping: "#8BA4B4",
          owned: "#7BA688",
        },
        // 语义色
        success: {
          DEFAULT: "#10B981",
          light: "var(--color-success-light)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "var(--color-warning-light)",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "var(--color-error-light)",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "var(--color-info-light)",
        },
        // 背景色 - 干净简约
        background: {
          DEFAULT: "var(--color-bg)",
          secondary: "var(--color-bg-secondary)",
          light: "#F8F6F3",
          dark: "#16181B",
        },
        // 表面色
        surface: {
          DEFAULT: "var(--color-surface)",
          elevated: "var(--color-surface-elevated)",
          light: "#FFFFFF",
          dark: "#1E2126",
          "dark-elevated": "#252A31",
        },
        // 文字色
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          muted: "var(--color-text-muted)",
          "dark-primary": "#F5F6F7",
          "dark-secondary": "rgba(245,246,247,0.72)",
          "dark-muted": "rgba(245,246,247,0.46)",
        },
        // 边框色
        border: {
          DEFAULT: "var(--color-border)",
          light: "var(--color-border-light)",
        },
        divider: "var(--color-divider)",
        // 支付品牌色
        wechat: "#07C160",
        alipay: "#1677FF",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "PingFang SC", "Noto Sans SC", "sans-serif"],
        body: ["Noto Sans SC", "PingFang SC", "sans-serif"],
      },
      // 字体大小 (6个规范)
      fontSize: {
        'xs': ['10px', { lineHeight: '14px' }],   // 标签、辅助
        'sm': ['12px', { lineHeight: '18px' }],   // 小字、提示
        'base': ['14px', { lineHeight: '22px' }], // 正文
        'md': ['16px', { lineHeight: '24px' }],   // 中标题
        'lg': ['18px', { lineHeight: '26px' }],   // 大标题
        'xl': ['20px', { lineHeight: '28px' }],   // 页面标题
      },
      // 使用 CSS 变量的间距
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        'header': 'var(--header-height)',
        'header-detail': 'var(--header-height-detail)',
        'tabbar': 'var(--tabbar-height)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-top': 'var(--safe-area-top)',
        'card-gap': 'var(--spacing-card-gap)',
      },
      // 高度
      height: {
        'header': 'var(--header-height)',
        'header-detail': 'var(--header-height-detail)',
        'tabbar': 'var(--tabbar-height)',
        'bottom-action': 'var(--bottom-action-height)',
      },
      // 最大宽度
      maxWidth: {
        'app': 'var(--max-width)',
      },
      // 最小高度
      minHeight: {
        'header': 'var(--header-height)',
        'header-detail': 'var(--header-height-detail)',
      },
      // 定位
      inset: {
        'header': 'var(--header-height)',
        'header-detail': 'var(--header-height-detail)',
      },
      // 圆角 - 使用 CSS 变量
      borderRadius: {
        'sm': 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)',
      },
      // 阴影 - 使用 CSS 变量
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'soft': '0 8px 30px rgba(0,0,0,0.04)',
        'card': 'var(--shadow-card)',
        'button': 'var(--shadow-button)',
      },
      // 渐变背景
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
        'gradient-wish': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
      },
      // 卡片高度变体
      aspectRatio: {
        'card-1': '3/4',
        'card-2': '4/5',
        'card-3': '3/4.5',
        'card-4': '4/4.5',
      },
      // 动画
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // 过渡
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      // Z-Index
      zIndex: {
        'base': 'var(--z-base)',
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'header': 'var(--z-header)',
        'modal': 'var(--z-modal)',
        'toast': 'var(--z-toast)',
      },
    },
  },
  plugins: [],
}
