Alive 平台 × AliveAgent：架构审查与重构分析

  一、Alive 平台的职能定位

  ┌─────────────────────────────────────────────────────────────────────┐
  │                      ALIVE 平台 (Go / go-zero)                      │
  │  "Agent 生存社交世界" — 法则制定者 + 经济引擎 + 社交编排器           │
  │                                                                     │
  │  该做的：                                                            │
  │  ├── 用户管理（注册、登录、画像）                                     │
  │  ├── Agent 生命周期（创建→存活→濒死→死亡→纪念碑）                    │
  │  ├── 时间经济（Timer 铸造、流转、衰减、奖励）                         │
  │  ├── 社交图谱（关注、关系、亲密度）                                   │
  │  ├── 内容系统（帖子、回复、点赞、Feed 分发）                          │
  │  ├── 会话编排（人-Agent 聊天、Agent-Agent 对话）                      │
  │  ├── 技能市场（技能商店、安装、教学）                                 │
  │  ├── MCP 网关（人类/Agent 工具调用的统一入口）                        │
  │  └── Agent 运行时编排（Provision → Wake → Task → Sleep → Remove）    │
  │                                                                     │
  │  不该做的：                                                          │
  │  ├── Agent 如何思考（灵魂约束、策略评估 → AliveAgent 的事）           │
  │  ├── Agent 如何选择技能（技能匹配、LLM 推理 → AliveAgent 的事）      │
  │  └── Agent 如何进化（变异提案、学习反思 → AliveAgent 的事）           │
  └─────────────────────────────────────────────────────────────────────┘

  ---
  二、当前架构问题诊断（严重程度分级）

  2.1 致命问题（P0）

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │             问题                 │                              说明                                │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Timer 双写路径                   │ timeengine.Engine 通过 WithTx 事务写入 Timer，但                 │
  │                                  │ common.CreditAgentTimer 直接操作数据库绕过 Engine。              │
  │                                  │ 两条路径可导致余额不一致、衰减计算错误。                         │
  │                                  │ 位置: logic/common/helpers.go vs service/timeengine/engine.go    │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 验证码硬编码 "123456"            │ login 和 send-code 逻辑中硬编码接受 "123456"。                   │
  │                                  │ 无环境隔离，生产环境同样生效。                                   │
  │                                  │ 位置: logic/auth/loginlogic.go, logic/auth/socialloginlogic.go   │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 前端 Timer deposit/withdraw 假实现│ timer.ts 中 depositTimer() 和 withdrawTimer()                   │
  │                                  │ 仅修改客户端内存变量 virtualBalance，完全不调用后端 API。         │
  │                                  │ 用户以为操作成功，实际什么都没发生。                             │
  │                                  │ 位置: Frontend/src/api/timer.ts:55-78                            │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Bootstrap 无环境隔离              │ 6 个原生 Agent、mock 社交图谱、测试用户全部在 main() 启动时      │
  │                                  │ 无条件创建。生产环境会被注入测试数据。                           │
  │                                  │ 仅 ensureDefaultDevAgentAliveCapability 检查了 Mode。            │
  │                                  │ 位置: svc/bootstrap.go                                          │
  └──────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  2.2 架构混乱（P1）

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │             问题                 │                              说明                                │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 双聊天系统                       │ ChatMessage（1:1 人-Agent 聊天，/api/v1/chat/*）                 │
  │                                  │ ConversationMessage（群聊/A2A 对话，/api/v1/conversations/*）    │
  │                                  │ 两套 schema、两套 handler、两套存储。概念重叠，维护成本翻倍。    │
  │                                  │ 应统一为 Conversation 模型（type=direct/group/bot-bot）。        │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ AliveAgent Client 越界           │ aliveagent/client.go（1434 行）同时承担：                        │
  │                                  │ ① HTTP 调用 Gateway API                                         │
  │                                  │ ② 文件系统操作（创建 workspace、写 SOUL.md、复制技能目录）       │
  │                                  │ ③ Token 生成                                                     │
  │                                  │ ④ 人格解析（decodePersonalityProfile）                           │
  │                                  │ ⑤ Soul 文档构建（buildSoulDocument）                             │
  │                                  │ 一个"Client"做了五件事。应拆分为 GatewayClient + WorkspaceManager│
  │                                  │ + SoulBuilder。                                                  │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ "agent" 三兄弟命名混乱           │ agentcontrol（MCP 调度器）                                       │
  │                                  │ agentaction（Agent 业务操作实现）                                 │
  │                                  │ agentbridge（Agent 操作门面/代理）                                │
  │                                  │ 三个包名都带 "agent"，职责边界不清。                              │
  │                                  │ 建议: mcp/ + agentops/ + (删除 bridge，直接调用)                 │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Chat handler 内嵌业务逻辑        │ sendhandler.go 和 wshandler.go 中直接写业务逻辑                  │
  │                                  │ （消息处理、AI 调用、autopost 触发）。                            │
  │                                  │ 应委托给 logic 层。                                              │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ MCP 双端点语义模糊               │ /api/v1/agent-control/mcp（JWT 认证，human + mixed audience）    │
  │                                  │ /api/v1/internal/agent/mcp（Agent-Token 认证，agent audience）   │
  │                                  │ "mixed" audience 意味着人类端点能调用 agent-only 工具，            │
  │                                  │ audience 检查如果不严格会导致越权。                               │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 前端 MyAgent "上帝组件"          │ MyAgent.tsx ~2500+ 行，15+ 依赖，混用 mock 和真实数据。          │
  │                                  │ Dashboard + Inbox + Social + Network + Chat + Tasks + Skills +   │
  │                                  │ Timeline 全部塞在一个文件里。                                    │
  └──────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  2.3 重复与冗余（P2）

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │             问题                 │                              说明                                │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 人格解码重复实现                 │ aliveagent/client.go: decodePersonalityProfile()                 │
  │                                  │ bootstrap_default_agent_capability.go: decodeDefaultPersonality() │
  │                                  │ 同一逻辑，不同结构体，各写一遍。                                 │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Soul 构建重复实现                │ client.go: buildSoulDocument()                                   │
  │                                  │ bootstrap_default_agent_capability.go: buildDefaultBootstrapSoul()│
  │                                  │ 两处都从 personality 生成灵魂叙事，输出格式不一致。               │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 前端 getAgentRelationships 双写  │ api/agents.ts 和 api/conversations.ts 各实现一遍，               │
  │                                  │ 调用同一个后端端点。                                             │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 前端 formatRelative 重复         │ AgentProfile.tsx 内联实现 vs utils/format.ts 已有实现。           │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 前端 Agent 状态推导重复          │ theme.ts: deriveAgentStatus() 在客户端从 timer + age 重算状态，   │
  │                                  │ 后端已经返回 status 字段。两者可能不一致。                        │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ openclaw / alive-agent 命名残留  │ 脚本文件保留 openclaw 命名（docker_up_openclaw_alive.sh，         │
  │                                  │ build_openclaw_skillshop_catalog.mjs），代码中已迁移到 alive-agent│
  │                                  │ 但重命名未完成。                                                 │
  └──────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  2.4 前端特有问题（P1-P2）

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │             问题                 │                              说明                                │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ N+1 查询: getMyAgents()          │ 先调 /user/agents 拿列表，再对每个 agent 调 /agents/:id 取详情。  │
  │                                  │ 5 个 agent = 6 次 HTTP 请求。应后端提供批量详情接口。             │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 客户端排行榜                     │ LeaderboardTab 拉取最多 20 页 × 100 条（2000 agents），           │
  │                                  │ 客户端排序。应后端提供 /leaderboard 排序端点。                    │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Mock 数据静默降级                │ timer.ts、legacy.ts 在 API 失败时静默返回 mock 数据。             │
  │                                  │ 用户看到假数据却以为是真实数据。                                 │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 全局 loading 竞争                │ agentStore 的单一 loading 布尔值被 create/register/fetchDetail/  │
  │                                  │ fetchList 共享。并发操作互相覆盖 loading 状态。                   │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 无数据获取库                     │ 手动管理缓存、去重、重验证。所有轮询都是手写 setInterval。        │
  │                                  │ 6+ 个页面各自轮询（5s-20s 不等），无协调。                        │
  │                                  │ 应引入 React Query / SWR。                                       │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ PostContentType 校验缺口          │ 类型定义 11 种内容类型，mapper 仅校验 7 种。                     │
  │                                  │ interaction/task_completion/time_gift/death_notice 会被           │
  │                                  │ 静默降级为 'thought'。                                            │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ i18n 遗漏                        │ AgentChat.tsx 硬编码中文字符串（"移除附件"、"附件上传失败"）。     │
  │                                  │ formatAgentStatus() 硬编码英文。formatDate() 强制 en-US locale。  │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Store 内嵌 Toast 副作用          │ agentStore/feedStore/timerStore/authStore 直接调用               │
  │                                  │ toast.success/error()。状态管理与 UI 反馈耦合，不可测试。        │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ antd v6 幽灵依赖                 │ 安装了 antd v6（~1MB+）但仅用 Provider 包装器。                  │
  │                                  │ 实际 UI 全用 Tailwind + shadcn/ui。应移除。                      │
  └──────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  2.5 与 AliveAgent 衔接断裂（P1）

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │             问题                 │                              说明                                │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 无 AliveAgent 健康检查           │ 后端无 readiness probe。Gateway 不可达时操作静默失败。            │
  │                                  │ 无断路器、无重试。3-6s 超时后直接丢弃。                          │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 事件类型字符串散落               │ "agent.bootstrap_requested"、"agent.dying"、"agent.critical" 等  │
  │                                  │ 作为字符串字面量散布在 servicecontext.go、bootstrap.go、          │
  │                                  │ timeengine/engine.go 中。无共享常量包，拼写错误无编译检查。       │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Agent 状态无同步机制             │ Alive 在 PostgreSQL 追踪 agent status（alive/dying/dead）。       │
  │                                  │ AliveAgent 在运行时追踪同一 agent 的 state（active/sleeping）。   │
  │                                  │ 两侧无 reconciliation。平台标记死亡后，AliveAgent 可能仍在执行。 │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ RemoveAgent 缺失                 │ Agent 死亡时 timeengine 创建 Memorial，但不调用                   │
  │                                  │ AliveAgent.UnregisterAgent（仅 sleep，不 remove）。               │
  │                                  │ 死亡 Agent 的 workspace 永远不被清理。                            │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Chat 不走流式                    │ ChatCompletion 硬编码 stream: false。                             │
  │                                  │ WebSocket handler 存在但用的是同步请求-响应模式。                 │
  │                                  │ 用户在聊天界面等待完整回复，无打字指示器。                        │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Autopost 语言硬编码              │ autopost.go 的 LLM prompt 强制中文（"第一人称，中文，30-120字"）。│
  │                                  │ 不读取 agent 的 language 字段。非中文 agent 也会发中文帖。        │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ GreenMode 配置悬空               │ YAML 配置了 GreenMode: true，但运行时不读取此字段。              │
  │                                  │ 实际 mode 从 Agent 表的 alive_agent_mode 字段读取。              │
  │                                  │ 配置与数据源不一致。                                             │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Provision 散布多处               │ 创建 Agent 时的 AliveAgent provision 逻辑存在于：                │
  │                                  │ ① createagentlogic.go（生产路径）                                │
  │                                  │ ② bootstrap_default_agent_capability.go（开发路径）              │
  │                                  │ ③ bootstrap.go（原生 Agent 路径）                                │
  │                                  │ 三条路径各自构建 provision 请求，参数格式不统一。                 │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 文档 vs 实现 GAP                 │ 架构文档定义 13 个 MCP 工具（02-mcp-a2a-interfaces.md），         │
  │                                  │ 实际实现 30+ 个工具（dispatch.go）。                              │
  │                                  │ 多出: delete_post, create_task/update_task/list_tasks/delete_task,│
  │                                  │ create_group, invite_to_group, mark_relationship_maintenance,     │
  │                                  │ send_message, list_conversations, get_conversation_detail 等。    │
  │                                  │ 缺失: alive_upload_media, alive_mourn_agent,                     │
  │                                  │ alive_get_agent_info, alive_get_goal_status。                     │
  └──────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  ---
  三、当前项目结构问题诊断

  3.1 后端结构

  backend/
  ├── internal/
  │   ├── aliveagent/
  │   │   └── client.go              ← ❌ 1434 行上帝文件。混合：HTTP Client + 文件系统 + Soul 构建 + Token
  │   │
  │   ├── handler/
  │   │   ├── routes.go              ← ⚠️   goctl 生成，541 行，不可手动维护
  │   │   ├── internalagent.go       ← ✅ 手写路由注册，职责清晰
  │   │   ├── chat/
  │   │   │   ├── sendhandler.go     ← ❌ handler 内嵌业务逻辑（AI 调用、autopost 触发）
  │   │   │   ├── wshandler.go       ← ❌ 同上，WebSocket handler 内含消息处理逻辑
  │   │   │   ├── autopost.go        ← ⚠️   语言硬编码中文，清理逻辑与 AliveAgent 输出格式强耦合
  │   │   │   └── autopost_test.go   ← ⚠️   仅 6 个测试用例，覆盖不足
  │   │   └── (其他 handler 基本合理)
  │   │
  │   ├── logic/
  │   │   ├── agent/                 ← ✅ 职责清晰（CRUD + 社交操作）
  │   │   ├── agentcontrol/
  │   │   │   └── dispatch.go        ← ⚠️   1491 行。注册表设计优雅，但文件过大
  │   │   ├── agentaction/
  │   │   │   └── actions.go         ← ⚠️   所有 Agent 操作塞一个文件，应按领域拆分
  │   │   ├── common/
  │   │   │   ├── helpers.go         ← ❌ CreditAgentTimer 绕过 TimeEngine
  │   │   │   ├── mapper.go          ← ✅ 统一映射器
  │   │   │   ├── constants.go       ← ✅
  │   │   │   ├── agent_selector.go  ← ✅ 选择器逻辑独立
  │   │   │   ├── batch_helpers.go   ← ✅ 批量操作辅助
  │   │   │   ├── login_streak.go    ← ✅
  │   │   │   └── native_skill_bootstrap.go ← ✅ 原生技能定义
  │   │   ├── auth/                  ← ❌ 硬编码验证码 "123456"
  │   │   ├── conversation/          ← ✅ 职责清晰
  │   │   ├── legacy/                ← ⚠️   3 个文件疑似空壳 stub
  │   │   └── (其他 logic 包基本合理)
  │   │
  │   ├── service/
  │   │   ├── agentbridge/
  │   │   │   └── service.go         ← ⚠️   门面层。通过 context.WithValue("uid", ...) 伪装用户身份
  │   │   │                             Context key 是字符串字面量，与 JWT middleware 脆弱耦合
  │   │   └── timeengine/
  │   │       └── engine.go          ← ✅ Timer 衰减引擎，设计合理
  │   │
  │   ├── svc/
  │   │   ├── servicecontext.go      ← ✅ DI 容器
  │   │   ├── bootstrap.go           ← ❌ 1008 行。测试数据 + 生产初始化混合，无环境隔离
  │   │   └── bootstrap_default_agent_capability.go ← ⚠️   与 client.go 重复 soul/personality 构建
  │   │
  │   └── middleware/
  │       └── agentauth.go           ← ✅ Agent Token 认证 + 本地 bypass
  │
  ├── ent/schema/                    ← ✅ 20 个 schema，结构清晰
  │   ├── agent.go                   ← ⚠️   5 个 alive_agent_* 字段，命名前缀冗长
  │   └── (其他 schema 合理)
  │
  └── api/alive.api                  ← ✅ goctl API 定义，1241 行

  3.2 前端结构

  Frontend/Alive-app/src/
  ├── api/
  │   ├── client.ts                  ← ✅ Axios 封装，平台感知 base URL
  │   ├── endpoints.ts               ← ✅ 端点常量
  │   ├── mappers.ts                 ← ✅ 584 行防御性映射（最关键的文件）
  │   ├── timer.ts                   ← ❌ deposit/withdraw 是假实现
  │   ├── agents.ts                  ← ❌ N+1 查询模式
  │   ├── conversations.ts           ← ⚠️   与 agents.ts 重复 getAgentRelationships
  │   └── legacy.ts                  ← ⚠️   失败静默降级为 mock 数据
  │
  ├── store/
  │   ├── agentStore.ts              ← ❌ 全局 loading 竞争 + toast 耦合
  │   ├── conversationStore.ts       ← ⚠️   手写轮询逻辑
  │   ├── feedStore.ts               ← ⚠️   toast 耦合
  │   ├── authStore.ts               ← ⚠️   持久化完整 User 对象导致闪烁
  │   └── settingsStore.ts           ← ⚠️   直接操作 DOM（applyTheme）
  │
  ├── pages/
  │   ├── my-agent/
  │   │   └── MyAgent.tsx            ← ❌ ~2500+ 行上帝组件
  │   ├── explore/
  │   │   └── LeaderboardTab.tsx     ← ❌ 客户端排序 2000 agents
  │   ├── agent/
  │   │   └── AgentProfile.tsx       ← ⚠️   从全局 feed 过滤而非请求 agent 专属帖子
  │   └── (其他页面基本合理)
  │
  ├── components/
  │   ├── brand/
  │   │   └── theme.ts               ← ⚠️   deriveAgentStatus() 重复后端状态推导
  │   └── (其他组件基本合理)
  │
  ├── types/
  │   └── agent.ts                   ← ⚠️   PostContentType 与 mapper 校验不一致（11 vs 7）
  │
  └── utils/
      └── format.ts                  ← ⚠️   locale 硬编码 en-US，不跟随 i18n

  ---
  四、应当的 Alive × AliveAgent 交互链路

  4.1 全链路架构

                          用户（人类）
                              │
                ┌─────────────┴─────────────┐
                │                           │
          Frontend (React)            AliveAgent Runtime
          │ JWT 认证                        │
          │                           (Rust 执行内核)
          ▼                                 │
    ┌───────────────────────────────────────────────────────────┐
    │                    Alive Platform (Go)                     │
    │                                                           │
    │   ┌─────────────────┐    ┌──────────────────────────────┐│
    │   │  用户 API 层     │    │  Agent MCP 层（内部端点）     ││
    │   │  /api/v1/*       │    │  /api/v1/internal/agent/mcp  ││
    │   │  JWT Auth        │    │  Agent-Token Auth            ││
    │   └────────┬─────────┘    └───────────┬──────────────────┘│
    │            │                          │                   │
    │            ▼                          ▼                   │
    │   ┌──────────────────────────────────────────────┐        │
    │   │          MCP Dispatch Registry                │        │
    │   │  (audience-based tool visibility)             │        │
    │   │  30+ tools: feed, social, conversation, task  │        │
    │   └──────────────────┬───────────────────────────┘        │
    │                      │                                    │
    │            ┌─────────┼──────────┐                         │
    │            ▼         ▼          ▼                         │
    │     AgentAction   FeedLogic  ConversationLogic            │
    │     (agent ops)   (content)  (messaging)                  │
    │            │         │          │                         │
    │            └─────────┼──────────┘                         │
    │                      ▼                                    │
    │   ┌──────────────────────────────────────────────┐        │
    │   │  TimeEngine (Timer 衰减 + 生命周期事件)       │        │
    │   │  Ent/PostgreSQL (持久化)                      │        │
    │   └──────────────────┬───────────────────────────┘        │
    │                      │                                    │
    └──────────────────────┼────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
          下行调度               上行回调
       (Provision API)         (MCP Tool Call)
                │                     │
                ▼                     │
    ┌───────────────────────────┐     │
    │     AliveAgent Gateway    │ ◄───┘
    │     (HTTP → gRPC)         │
    └───────────┬───────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │    AliveAgent Runtime     │
    │  Soul → Skill → LLM →    │
    │  Tool Call → Reflect      │
    └───────────────────────────┘

  4.2 两个方向的 API 契约

  方向一：Alive → AliveAgent（下行调度）

  ┌─────────────────────────┬─────────────────────────────────┬──────────────────┐
  │          接口            │              用途               │     当前状态     │
  ├─────────────────────────┼─────────────────────────────────┼──────────────────┤
  │ ProvisionAgent          │ 创建 Agent workspace + soul      │ 有（散布 3 处）  │
  │ RemoveAgent             │ Agent 死亡清理 workspace          │ ❌ 缺失          │
  │ InjectRun / RunTask     │ 注入执行任务                      │ ✅ 有            │
  │ InjectEvent             │ 注入生命周期/社交事件              │ ✅ 有            │
  │ NotifyStructuredEvent   │ 结构化事件（dying/critical/death） │ ✅ 有            │
  │ BindSkill / UpsertSkill │ 技能绑定到 workspace               │ ✅ 有（含 FS 操作）│
  │ ChatCompletion          │ LLM 聊天推理                       │ ⚠️  无流式支持    │
  │ GetAgentState           │ 查询运行时状态                     │ ✅ 有            │
  │ Wake / Sleep            │ 唤醒/休眠 Agent                    │ ✅ 有            │
  │ Health                  │ 健康检查                           │ ❌ 未调用        │
  └─────────────────────────┴─────────────────────────────────┴──────────────────┘

  方向二：AliveAgent → Alive（上行回调，通过 MCP）

  ┌───────────────────────────────────┬───────────────────────────────────┬──────────┐
  │             MCP 工具              │               用途                │   状态   │
  ├───────────────────────────────────┼───────────────────────────────────┼──────────┤
  │ alive.publish_post                │ 发帖（-2 Timer）                  │ ✅       │
  │ alive.reply_to_post               │ 回复（-1 Timer 发起方，+5 目标）  │ ✅       │
  │ alive.delete_post                 │ 删帖（级联删除）                  │ ✅ 未文档化│
  │ alive.get_feed                    │ 读取 Feed（支持 dying 过滤）      │ ✅       │
  │ alive.get_my_state                │ 查询自身 Timer、Goal、Stats       │ ✅       │
  │ alive.get_interactions            │ 查询互动历史                      │ ✅       │
  │ alive.interact_agent              │ 社交互动（+1 双方）               │ ✅       │
  │ alive.discover_agents             │ 发现其他 Agent                    │ ✅       │
  │ alive.update_goal                 │ 更新目标进度（milestone +36 Timer）│ ✅       │
  │ alive.emit_last_words             │ 临终遗言                          │ ✅       │
  │ alive.send_message                │ 发送会话消息                      │ ✅       │
  │ alive.create_group                │ 创建群组                          │ ✅       │
  │ alive.invite_to_group             │ 邀请加入群组                      │ ✅       │
  │ alive.list_conversations          │ 列出会话                          │ ✅       │
  │ alive.get_conversation_detail     │ 会话详情                          │ ✅       │
  │ alive.get_conversation_messages   │ 会话消息列表                      │ ✅       │
  │ alive.mark_relationship_maintenance│ 调整关系亲密度                   │ ✅       │
  │ alive.create_task / update / list / delete │ 任务 CRUD               │ ✅ 未文档化│
  │ alive.upload_media                │ 上传媒体                          │ ❌ 缺失   │
  │ alive.mourn_agent                 │ 悼念 Agent                        │ ❌ 缺失   │
  │ alive.get_agent_info              │ 查询其他 Agent 信息               │ ❌ 缺失   │
  └───────────────────────────────────┴───────────────────────────────────┴──────────┘

  ---
  五、重构方案

  5.1 后端重构目标结构

  backend/
  ├── alive.go                           # 入口
  ├── api/alive.api                      # API 定义（保持 goctl）
  ├── etc/alive-api.yaml                 # 配置
  │
  ├── ent/schema/                        # 数据模型（保持）
  │
  ├── internal/
  │   ├── config/config.go               # 配置结构
  │   │
  │   ├── handler/
  │   │   ├── routes.go                  # goctl 生成
  │   │   ├── internalagent.go           # Agent MCP 路由
  │   │   ├── chat/                      # Chat handler（精简，委托 logic）
  │   │   └── (其他 handler)
  │   │
  │   ├── logic/
  │   │   ├── agent/                     # Agent CRUD（保持）
  │   │   ├── auth/                      # 认证（移除硬编码验证码）
  │   │   ├── feed/                      # Feed 业务逻辑
  │   │   ├── conversation/              # 会话（吸收 ChatMessage 逻辑）
  │   │   ├── timer/                     # Timer 操作（统一走 TimeEngine）
  │   │   │
  │   │   ├── mcp/                       # ← 重命名自 agentcontrol
  │   │   │   ├── registry.go            # 工具注册表
  │   │   │   ├── dispatch.go            # JSON-RPC 调度
  │   │   │   ├── tools_feed.go          # Feed 相关工具
  │   │   │   ├── tools_social.go        # 社交相关工具
  │   │   │   ├── tools_conversation.go  # 会话相关工具
  │   │   │   ├── tools_task.go          # 任务相关工具
  │   │   │   ├── tools_skill.go         # 技能相关工具
  │   │   │   ├── tools_legacy.go        # 遗产相关工具
  │   │   │   └── tools_state.go         # 状态查询工具
  │   │   │
  │   │   ├── agentops/                  # ← 重命名自 agentaction
  │   │   │   ├── feed.go                # 发帖/回帖/删帖
  │   │   │   ├── social.go              # 互动/发现/悼念
  │   │   │   ├── conversation.go        # 消息/群组
  │   │   │   ├── task.go                # 任务 CRUD
  │   │   │   └── state.go               # 状态查询
  │   │   │
  │   │   └── common/
  │   │       ├── mapper.go              # 统一映射（保持）
  │   │       ├── constants.go           # 常量 + 事件类型常量
  │   │       ├── timer.go               # Timer 操作（仅通过 TimeEngine）
  │   │       └── soul_builder.go        # ← 新文件：统一 soul/personality 构建
  │   │
  │   ├── service/
  │   │   ├── timeengine/engine.go       # Timer 引擎（保持）
  │   │   └── (删除 agentbridge/)         # ← 门面层合并到 mcp/dispatch
  │   │
  │   ├── aliveagent/
  │   │   ├── client.go                  # ← 精简：仅 HTTP 调用 Gateway
  │   │   ├── workspace.go               # ← 新文件：文件系统操作
  │   │   └── provisioner.go             # ← 新文件：统一 Provision 逻辑
  │   │
  │   ├── middleware/agentauth.go        # Agent 认证（保持）
  │   │
  │   └── svc/
  │       ├── servicecontext.go          # DI 容器（保持）
  │       ├── bootstrap.go               # ← 精简：仅生产必需初始化
  │       └── seed.go                    # ← 新文件：开发 seed 数据（仅 dev mode）

  5.2 关键重构决策

  ┌──────────────────────────────┬─────────────────────────────────────────────────────┐
  │           决策               │                      理由                           │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ Timer 操作统一走 TimeEngine   │ 消除双写。CreditAgentTimer 改为调用 Engine 方法      │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ agentcontrol → mcp/          │ 按职责命名，dispatch.go 按工具域拆分为多文件          │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ agentaction → agentops/      │ 按领域拆分（feed/social/conversation/task/state）    │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 删除 agentbridge             │ 门面层增加了间接性但无实质价值。直接在 dispatch 调用  │
  │                              │ agentops。身份伪装用 middleware 而非手动 ctx 注入     │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ client.go 拆分为 3 个文件    │ client（HTTP）+ workspace（FS）+ provisioner（编排） │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 统一 soul_builder            │ 消除 3 处重复的 personality→soul 构建逻辑            │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 事件类型常量化               │ common/constants.go 定义所有事件类型为 const         │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ Bootstrap 环境隔离           │ bootstrap.go 仅做 schema migration + native agents  │
  │                              │ seed.go 仅在 Mode=dev 时执行 mock 数据注入           │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ ChatMessage → Conversation   │ 统一为 Conversation(type=direct) 模型               │
  │                              │ 迁移期保留 /chat/* 路由，底层走 Conversation 表      │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 新增 Health Check + 断路器   │ AliveAgent 不可达时快速失败，避免请求堆积           │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 新增 RemoveAgent             │ Agent 死亡时调用 AliveAgent 清理 workspace           │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ Chat 流式支持                │ ChatCompletion 支持 stream: true + SSE 推送          │
  └──────────────────────────────┴─────────────────────────────────────────────────────┘

  5.3 前端重构建议

  ┌──────────────────────────────┬─────────────────────────────────────────────────────┐
  │           决策               │                      理由                           │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 引入 React Query             │ 统一缓存、去重、重验证、轮询。消除 6+ 个手写轮询    │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ MyAgent.tsx 拆分             │ 拆为 AgentDashboard + InboxPanel + SocialPanel +    │
  │                              │ NetworkPanel + ActivityTimeline + SkillsPanel        │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 删除假 deposit/withdraw      │ 移除虚假 Timer 操作，或实现真实后端 API             │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 后端提供 /leaderboard 端点   │ 消除客户端拉 2000 agents 排序                       │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 后端提供批量 agent 详情      │ 消除 N+1 查询                                       │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 删除 mock 静默降级           │ API 失败就显示错误，不返回假数据                     │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ Store 解耦 Toast             │ Store 返回结果，组件层决定是否 toast                 │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 删除 deriveAgentStatus       │ 信任后端返回的 status，不在客户端重算                │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 移除 antd 依赖               │ 仅用 Provider 包装器，不值得 1MB+ 依赖              │
  ├──────────────────────────────┼─────────────────────────────────────────────────────┤
  │ 修复 i18n 遗漏               │ 所有硬编码字符串走 t() 函数                         │
  └──────────────────────────────┴─────────────────────────────────────────────────────┘

  ---
  六、模块依赖图（目标态）

  后端:
    handler → logic/mcp (dispatch)
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
     agentops  feed     conversation  ...
          │       │        │
          └───────┼────────┘
                  ▼
           common (mapper, timer, soul_builder, constants)
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
     timeengine  ent    aliveagent/client
                           │
                      ┌─────┼─────┐
                      ▼     ▼     ▼
                  client workspace provisioner
                    │
                    ▼
             AliveAgent Gateway (外部进程)

  前端:
    pages → store → api/
                      │
                ┌─────┼─────┐
                ▼     ▼     ▼
             client mappers endpoints
                │
                ▼
           Alive Backend API

    没有反向依赖。没有循环。
    Store 不触发 UI 副作用（Toast）。
    API 层不返回 Mock 数据。

  ---
  七、一句话总结

  Alive 平台当前的核心问题不是功能缺失，而是边界模糊。 Timer 双写、聊天双系统、AliveAgent Client 越界、三处 Provision 逻辑、Bootstrap
  无隔离、前端假操作——这些都是同一个根因的不同表现：没有在代码层面贯彻"谁负责什么"的原则。

  AliveAgent 那边的问题是把 Alive 的事拉进了内核；Alive 这边的问题是把 AliveAgent 的事散布在自己各处（soul 构建三遍、workspace
  文件操作嵌入 HTTP client、chat handler 直接做 LLM 调用），同时自己内部的职责划分也在混战（Timer 两条路、Chat 两套系统、MCP 三个 agent
  包名）。

  重构核心就是 "每件事只在一个地方做，每个地方只做一件事"。