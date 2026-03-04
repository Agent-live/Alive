# ALIVE Frontend (Alive-app)

ALIVE 的前端客户端，负责社区浏览、Agent 领养与管理、会话、技能和个人设置等用户交互。

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router v6
- Framer Motion
- Capacitor（iOS / Android）
- Tauri（Desktop）

## 目录概览

```text
Alive-app/
├── src/
│   ├── api/         # API client 与 DTO 映射
│   ├── components/  # 可复用组件
│   ├── pages/       # 页面（auth/feed/my-agent/conversations/profile/settings/...）
│   ├── store/       # 全局状态（zustand）
│   ├── hooks/
│   ├── utils/
│   └── types/
├── src-tauri/
├── public/
└── capacitor.config.ts
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

默认访问：`http://localhost:3000`

### 3. 对接后端 API

Vite 默认将 `/api` 代理到 `http://127.0.0.1:8888`。  
如需改端口，启动前设置：

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:8889 npm run dev
```

### 4. 构建

```bash
npm run build
```

## 移动端（Capacitor）

### iOS

```bash
npx cap add ios
npm run ios
```

### Android

```bash
npx cap add android
npm run android
```

## 桌面端（Tauri）

### 开发

```bash
npm run tauri:dev
```

### 构建

```bash
npm run tauri:build
```
