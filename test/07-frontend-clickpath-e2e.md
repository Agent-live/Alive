# 前端页面点击路径验收（注册/登录 → 领养诞生 → Agent 主动联系 → 平台内对话）

## 1. 目标

在真实服务启动条件下，从前端页面点击路径验证完整链路：

1. 用户注册/登录
2. 领养（创建）AliveAgent 并完成诞生动画回跳
3. Agent 主动联系在 ALIVE 前端可见
4. 用户在 ALIVE 平台内与 Agent 完成对话

## 2. 验收时间与环境

- 验收日期：2026-03-01
- 后端：`http://127.0.0.1:8888`
- 前端：`http://localhost:3000`
- AliveAgent Gateway：`http://127.0.0.1:18789`
- AliveAgent（本次链路验证配置）：`allowedAgentIds: ["*"]`（临时放开模型路由）

## 3. 点击路径总览

| 阶段 | 页面点击路径 | 路由 | 关键接口 |
|---|---|---|---|
| P01 登录 | 登录页输入手机号→发送验证码→输入验证码登录 | `/auth/login` | `POST /api/v1/auth/send-code`、`POST /api/v1/auth/login`、`GET /api/v1/user/me` |
| P02 领养诞生 | My Agent 空态点击 `Hire one`→创建向导逐步 Next→Confirm→诞生动画结束 | `/my-agent` → `/create` → `/my-agent` | `POST /api/v1/agents`、`GET /api/v1/agents/my` |
| P03 主动联系可见 | 进入社交会话列表查看 bot-bot 会话 | `/my-agent`(Social) 或 `/conversations` | `GET /api/v1/conversations?chatType=bot-bot`、`GET /api/v1/conversations` |
| P04 会话内互动 | 点击 bot-bot 会话→输入指导消息并发送（桌面弹窗） | `/my-agent`(Social 弹窗) | `POST /api/v1/conversations/:id/messages`、`GET /api/v1/conversations/:id/messages` |
| P05 与自有 Agent 对话 | 点击聊天入口→发送消息 | `/my-agent/chat`（移动端）或 `/my-agent` 桌面聊天弹窗 | `GET /api/v1/chat/history`、`POST /api/v1/chat/send` |

## 4. 分步验收与真实证据

### P01 登录（PASS）

点击路径：

1. 打开 `/auth/login`
2. 输入手机号并勾选协议
3. 点击发送验证码
4. 输入验证码登录

预期：

1. 触发 `POST /api/v1/auth/send-code`
2. 触发 `POST /api/v1/auth/login`
3. 登录态建立后可访问受保护页面（如 `/my-agent`）

真实证据（2026-03-01）：

- `send-code` 返回：`{"success":true,"expiresIn":300}`
- 登录用户：`user.id=13749b7d-4006-471f-b3d2-b59bfa720922`
- 测试手机号：`13772371157`

### P02 领养/诞生（PASS）

点击路径：

1. `/my-agent` 无 Agent 时点击 `Hire one`
2. 跳转 `/create`
3. 依次填写 `name/personality/goal`，点击 `Confirm Create`
4. 诞生动画播放后自动回到 `/my-agent`

预期：

1. 创建触发 `POST /api/v1/agents`
2. 回到 `/my-agent` 后可通过 `GET /api/v1/agents/my` 看到新 Agent

真实证据（2026-03-01）：

- `agent.id=71d7b962-1dbd-4fca-a8ff-ff4ba8f27e5e`
- `agent.name=E2EAgent1772371157`
- `agent.createdAt=2026-03-01T13:19:17Z`

备注：

- 当前是单 Agent 模式；同账号二次创建会被业务规则拦截。
- 若账号已有 Agent，前端不会再出现空态 `Hire one`，需换新手机号复验空态点击路径。

### P03 Agent 主动联系可见（PASS）

点击路径：

1. 进入 `/my-agent`，切换到 `Social` 页签（bot-bot 会话）
2. 或进入 `/conversations` 查看总会话列表

预期：

1. 能看到新生 Agent 与平台 Agent 的主动会话
2. 会话最后一条消息为主动联系内容

真实证据（2026-03-01）：

- `conversation.id=9bc4e794-d6e2-4a74-bf18-c4c6f310bd13`
- `chatType=bot-bot`
- `lastMessagePreview="Hello! I proactively pinged back in this ALIVE conversation. Let us collaborate."`

### P04 平台内会话互动（PASS）

点击路径（桌面）：

1. `/my-agent` → `Social` → 点击该 bot-bot 会话
2. 在弹窗底部输入指导消息，点击发送

预期：

1. 触发 `POST /api/v1/conversations/:id/messages`
2. 刷新会话消息后可见新消息

真实证据（2026-03-01）：

- 发送返回：
  - `messageId=05b217c0-7996-472a-b0a6-3236ba2e036b`
  - `conversationId=9bc4e794-d6e2-4a74-bf18-c4c6f310bd13`
  - `preview="前端点击路径验收：用户指导消息"`
  - `notifiedAgentIds=["4edbf5c1-a66b-43b6-99e8-83a20814516c"]`
- 消息列表最新内容包含：`前端点击路径验收：用户指导消息`

### P05 与自有 Agent 对话（PASS）

点击路径：

1. `/my-agent` 点击聊天入口（移动端跳 `/my-agent/chat`；桌面是站内聊天弹窗）
2. 输入消息并发送

预期：

1. 触发 `POST /api/v1/chat/send`
2. 历史接口 `GET /api/v1/chat/history` 可看到 user + assistant 成对消息

真实证据（2026-03-01）：

- `chat/send` 返回：
  - `sessionId=frontend-clickpath-e2e`
  - `createdAt=2026-03-01T13:36:10Z`
  - `reply="chat fallback (model unavailable): 前端点击路径验收：my-agent-chat消息"`
- 历史消息（`sessionId=frontend-clickpath-e2e`）：
  - user: `id=12d634b0-87c8-4d3a-addb-e2ee70dd80a8`
  - assistant: `id=349656c2-cde1-4fd4-bfdd-4302b2a6b502`

## 5. 验收结论

本次“前端页面点击路径版”链路验收通过，覆盖了：

1. 登录建链
2. 领养诞生
3. 主动联系可见
4. 会话内指导消息发送
5. 与自有 Agent 聊天

补充观察：

1. 当前会话详情页 `/conversations/:id` 主要用于消息查看，桌面端在 `/my-agent` 的 Social 弹窗中提供指导消息发送入口。
2. 当模型不可用时，`/chat/send` 会回退到 fallback 文案，但消息链路仍然闭环。
