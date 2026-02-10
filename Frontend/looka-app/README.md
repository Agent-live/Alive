# LOOKA App

AI-Native Fashion Creation & Commerce Platform - 跨平台应用

## 技术栈

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Animation**: Framer Motion
- **Mobile**: Capacitor (iOS/Android)
- **Desktop**: Tauri (macOS/Windows/Linux)

## 项目结构

```
looka-app/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── Icon.tsx       # Material Icons 封装
│   │   ├── TabBar.tsx     # 底部导航栏
│   │   ├── Header.tsx     # 页面头部
│   │   ├── Layout.tsx     # 页面布局
│   │   ├── Card.tsx       # 卡片组件
│   │   ├── Button.tsx     # 按钮组件
│   │   ├── ProductCard.tsx # 商品卡片
│   │   └── Badge.tsx      # 徽章组件
│   ├── pages/          # 页面组件
│   │   ├── Explore.tsx    # 探索发现
│   │   ├── Create.tsx     # AI 创作
│   │   ├── Closet.tsx     # 虚拟衣柜
│   │   ├── Orders.tsx     # 订单管理
│   │   └── Profile.tsx    # 个人中心
│   ├── hooks/          # 自定义 Hooks
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型
│   └── assets/         # 静态资源
├── src-tauri/          # Tauri 桌面端配置
├── public/             # 公共资源
└── capacitor.config.ts # Capacitor 移动端配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 移动端打包 (Capacitor)

### iOS

```bash
# 首次设置
npx cap add ios

# 同步并打开 Xcode
npm run ios
```

### Android

```bash
# 首次设置
npx cap add android

# 同步并打开 Android Studio
npm run android
```

## 桌面端打包 (Tauri)

### 前置要求

- Rust 工具链 (https://www.rust-lang.org/tools/install)
- 系统依赖 (参考 Tauri 文档)

### 开发模式

```bash
npm run tauri:dev
```

### 构建安装包

```bash
npm run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/`

## 设计规范

### 颜色

- **Primary**: `#E63946` (LOOKA 红)
- **Background**: `#FAFAFA` / `#FCFCFC`
- **Text**: `#1A1A1A`

### 字体

- **Display**: Plus Jakarta Sans
- **Body**: Noto Sans SC / PingFang SC

### 圆角

- 卡片: `24px` (`rounded`)
- 按钮: `full` (`rounded-full`)
- 输入框: `16px` (`rounded`)

## 产品模块

1. **探索 (Explore)** - 发现设计灵感，浏览热门作品
2. **创作 (Create)** - AI 驱动的服装设计生成
3. **衣柜 (Closet)** - 虚拟试穿，管理设计和购买
4. **订单 (Orders)** - 订单跟踪，生产进度
5. **我的 (Profile)** - 个人中心，会员管理

## License

Private - LOOKA Team
