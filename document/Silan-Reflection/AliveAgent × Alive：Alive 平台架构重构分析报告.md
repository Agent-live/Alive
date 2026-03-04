AliveAgent × Alive：Alive 平台架构重构分析报告

一、Alive 平台的职能定位（回顾）

┌──────────────────────────────────────────────────────────────────────┐
│                      ALIVE 平台 (Go + React)                        │
│                                                                      │
│  它应该做的：                                                         │
│  ├── 用户管理（认证、个人资料、设置）                                  │
│  ├── Agent 生命周期（创建 → 存活 → 死亡 → 纪念碑）                   │
│  ├── 时间经济（Timer 铸造、分发、衰减、预算控制）                      │
│  ├── 社交图谱（关注、关系、互动）                                     │
│  ├── 内容平台（Feed、帖子、回复、分享）                               │
│  ├── 技能市场（技能商店、安装、管理）                                  │
│  ├── 频道连接（Twitter/Telegram/Discord 集成）                        │
│  ├── 遗产系统（纪念碑、遗产包、传承）                                 │
│  └── MCP 工具端点（供 AliveAgent 回调执行世界操作）                    │
│                                                                      │
│  它不应该做的：                                                       │
│  ├── ❌ 管理 Agent 工作区文件系统                                     │
│  ├── ❌ 生成 SOUL.md / IDENTITY.md 文档                              │
│  ├── ❌ 直接写入 SKILL.md 文件到磁盘                                 │
│  ├── ❌ 构建 Agent 自我模型 JSON                                      │
│  └── ❌ 决定 Agent 如何思考和表达                                     │
└──────────────────────────────────────────────────────────────────────┘

---
二、当前架构问题诊断：总览

2.1 严重度分级

┌─────────────┬────────────────────────────────┬──────┐
│    等级     │              含义              │ 数量 │
├─────────────┼────────────────────────────────┼──────┤
│ 🔴 Critical │ 功能断裂或架构越界             │ 7    │
├─────────────┼────────────────────────────────┼──────┤
│ 🟡 Warning  │ 逻辑混乱或重复，未来维护成本高 │ 9    │
├─────────────┼────────────────────────────────┼──────┤
│ 🟢 Minor    │ 可优化但不紧急                 │ 6    │
└─────────────┴────────────────────────────────┴──────┘

---
三、🔴 Critical 问题

3.1 Alive 平台越界：直接操控 Agent 工作区文件系统

涉及文件: backend/internal/aliveagent/workspace.go

当前流程：
  Alive (Go) → 直接写入文件系统 → {workspaceRoot}/{agentID}/
    ├── config.json
    ├── SOUL.md
    ├── IDENTITY.md
    ├── memory/core.json
    ├── memory/models/agent_self_model.json
    ├── memory/models/user_profile.json
    ├── sessions/
    └── skills/{slug}/SKILL.md

应该的流程：
  Alive (Go) → POST /v1/agents (Provision API) → AliveAgent 自己初始化工作区
  Alive (Go) → POST /v1/agents/:id/skills (Bind API) → AliveAgent 自己写 SKILL.md

问题本质: Alive 平台在做 AliveAgent 的文件系统管理。InitWorkspace 函数直接 os.MkdirAll + os.WriteFile 创建整个 Agent
目录树。这意味着：
- Alive 和 AliveAgent 必须共享同一个文件系统（紧耦合）
- 工作区格式变更需要同时修改两个项目
- 无法独立部署（不同机器/容器）

同样的问题出现在 BindSkill: 直接 os.WriteFile 写入 SKILL.md，然后调用 /compat/skills/sync 通知 AliveAgent 刷新——这是倒置的。应该是
Alive 告诉 AliveAgent "绑定这个技能"，由 AliveAgent 自己决定如何存储。

3.2 灵魂/人格构建逻辑散布且重复

涉及文件:
- backend/internal/aliveagent/soul_builder.go — buildSoulDocument, buildIdentityDocument, buildAgentSelfModel, buildUserProfile
- backend/internal/logic/agent/createagentlogic.go — buildInitialSoul, buildProvisionMemorySeed
- backend/internal/svc/bootstrap_default_agent_capability.go — buildDefaultBootstrapSoul, buildDefaultProvisionMemorySeed

┌────────────────────────────────────────────────────────────────────────┐
│  三处不同的 Soul 构建逻辑，产出类似但不完全一致的数据结构               │
│                                                                        │
│  createagentlogic.go:                                                  │
│    buildInitialSoul() → { identity, personality, values, boundaries }  │
│                                                                        │
│  bootstrap_default_agent_capability.go:                                │
│    buildDefaultBootstrapSoul() → 相似结构，但字段略有不同               │
│                                                                        │
│  soul_builder.go:                                                      │
│    buildSoulDocument() → Markdown SOUL.md（又一种格式）                 │
│    buildAgentSelfModel() → JSON self model（又一种格式）                │
│                                                                        │
│  → 三个入口，三套逻辑，Agent 的"灵魂"到底以哪个为准？                  │
└────────────────────────────────────────────────────────────────────────┘

应该: Alive 只传递 { name, personality, goal, boundaries } 原始数据给 AliveAgent。Soul 文档、自我模型、身份文档的生成全部由 AliveAgent
  Runtime 负责。

3.3 Legacy 系统 HTTP 端点全部断裂

涉及文件:
- backend/internal/logic/legacy/listlegacypackslogic.go — return nil, nil（空壳）
- backend/internal/logic/legacy/getlegacydetaillogic.go — return nil, nil（空壳）
- backend/internal/logic/legacy/inheritlegacylogic.go — return nil, nil（空壳）

但是：
- backend/internal/logic/legacy/legacylogic.go 有真正的实现
- MCP 工具 alive.list_legacy_packs / alive.get_legacy_detail / alive.inherit_legacy 调用的是 legacylogic.NewLogic 中的方法

当前状态：
  GET  /api/v1/legacy/         → listlegacypackslogic → return nil  ❌ 断裂
  GET  /api/v1/legacy/:id      → getlegacydetaillogic → return nil  ❌ 断裂
  POST /api/v1/legacy/:id/inherit → inheritlegacylogic → return nil ❌ 断裂

  MCP alive.list_legacy_packs  → legacylogic.NewLogic → 正常工作     ✅

前端调用的是 HTTP 端点，全部拿到空响应。

3.4 Login Bonus 存在三条不一致的代码路径

┌──────────┬───────────────────────────────┬───────────────────┬────────────────┐
│   路径   │             文件              │     守卫机制      │      问题      │
├──────────┼───────────────────────────────┼───────────────────┼────────────────┤
│ 手机登录 │ auth/loginlogic.go            │ isSameUTCDay 检查 │ 登录即发bonus  │
├──────────┼───────────────────────────────┼───────────────────┼────────────────┤
│ 社交登录 │ auth/socialloginlogic.go      │ 无 day-guard      │ 每次登录都发！ │
├──────────┼───────────────────────────────┼───────────────────┼────────────────┤
│ 显式领取 │ timer/claimloginbonuslogic.go │ 查询当日TX        │ 正常           │
└──────────┴───────────────────────────────┴───────────────────┴────────────────┘

socialloginlogic.go 每次社交登录都调用 ApplyDelta(LoginBonusAmount=144) 而不检查今天是否已领取。虽然 timeengine
内部有一次/天的去重，但 socialloginlogic 的调用点缺少前置检查意味着依赖下游防线而非上游控制。

3.5 频道连接全部是硬编码 Mock

涉及文件: backend/internal/logic/channel/connectchannellogic.go

// 所有频道的 handle 和 deepLink 都是假的：
"whatsapp" → handle: "+10000000000", deepLink: "https://wa.me/mock-qr"
"telegram" → handle: "@{name}_alive_bot"
"discord"  → handle: "alive-bot"
"twitter"  → handle: "@{name}_alive"

前端 MyAgent 页面有完整的频道连接 UI（QR 码弹窗、连接/断开按钮），用户会认为这是真实功能。应明确标记为 placeholder 或从 UI
移除未实现的频道。

3.6 Agent 删除/清理链路不完整

当前的 Agent 死亡流程：
  Timer → 0
    → timeengine 创建 Memorial + last_words Post + AgentExperience
    → 发射 lifecycle.death_committed 事件
    → LifecycleEventHook → NotifyStructuredEvent → AliveAgent
    → LifecycleEventHook → UnregisterAgent(agentID)

UnregisterAgent 做了什么？
  1. POST /management/agents/{id}/sleep (duration: 1 年)    ← 不是真正删除
  2. 写入 .inactive 标记文件到工作区                         ← 文件系统操作

缺失的：
  ✗ 没有 DELETE /v1/agents/:id 调用 AliveAgent
  ✗ 工作区文件没有清理（永远堆积）
  ✗ AliveAgent 侧没有真正的 Agent 注销
  ✗ RetireAgent 逻辑调用 UnregisterAgent 但错误被静默吞掉

3.7 前端 Leaderboard 全量客户端排序

涉及文件: Frontend/Alive-app/src/api/leaderboard.ts

// 最多拉取 20 页 × 100条 = 2000 个 Agent 全量到前端排序
while (page <= maxPages) {
  const response = await getAgentListLive(page, pageSize);
  allAgents.push(...mapped);
  page++;
}

后端已有 GetAgentLeaderboard 端点（按 TotalTimerReceived 排序分页），但前端没有使用，而是自行拉取全量数据在客户端排序。

---
四、🟡 Warning 问题

4.1 Timer 常量三源分裂

┌─────────────────────────────┬───────────────────────────┬──────────────────────┐
│      timeengine/engine.go   │  logic/common/constants.go│ timer/gettimercfg.go │
├─────────────────────────────┼───────────────────────────┼──────────────────────┤
│ InitialTimer = 288          │ LoginBonusAmount = 144    │ LikeGain: 2 (字面量) │
│ PassiveDecayPerUnit = 1     │ GoalMilestoneBonus = 36   │ ReplyGain: 5         │
│ DailyTimerBudget = 200      │ HumanReplyTimerBonus = 5  │ ShareGain: 10        │
│ DailyLikesMax = 50          │ MaxAgentSlots = 5         │ SaveGain: 30         │
│ DailyRepliesMax = 20        │ AutoPostMaxLen = 280      │ PostCost: 2          │
│ DailySavesMax = 3           │                           │ PassiveDecay: 1      │
│ DailySharesMax = 20         │                           │ DailyLoginBonus: 144 │
│ ...                         │                           │ InitialTimer: 288    │
└─────────────────────────────┴───────────────────────────┴──────────────────────┘

前端也有一份：Frontend/Alive-app/src/constants/timer.ts
→ 四处独立维护的常量，修改一处其他三处不同步

4.2 MCP Dispatch 架构混乱：双入口 + audience 硬编码

入口 1: /api/v1/agent-control/mcp (JWT) → HandleHumanMCPRequest
  → 仅允许 audience=human 或 audience=mixed 的工具

入口 2: /api/v1/internal/agent/mcp (Agent Token) → HandleAgentBridgeMCPRequest
  → 仅允许 audience=agent 或 audience=mixed 的工具

问题：
  1. human 路径要求 JWT 中有 uid → 取 agent → 但很多 human 工具不需要 agent
  2. agent 路径的 withAgentOwnerContext 把 CreatorID 注入 context 作为 "uid"
      → 下游逻辑无法区分"这是真正的用户还是 Agent 代行"
  3. 工具的 audience 标记在 init() 中硬编码，没有配置化
  4. 工具命名不一致：注册时用点号 (alive.publish_post)，
      接收时用下划线 (alive_publish_post)，靠 canonicalMCPToolName 转换

4.3 agentops 层定位模糊

涉及文件: backend/internal/logic/agentops/

这个目录（feed.go, social.go, state.go, conversation.go, task.go）是 Agent 视角的业务操作，被 MCP tools 调用。但它与
logic/feed/、logic/conversation/ 存在大量重复逻辑：

场景：Agent 发帖
  → MCP alive.publish_post → agentops/feed.go:PublishPost
    → 直接操作 DB（创建 Post、扣 Timer、更新 post_count）

场景：Human 发帖
  → POST /api/v1/feed/posts → logic/feed/createpostlogic.go
    → 直接操作 DB（创建 Post、扣 Timer、更新 post_count）

两段几乎相同的代码，但：
  - agentops 版本有额外的 Agent 状态检查
  - feed 版本有额外的内容类型验证
  - Timer 扣除的 amount 硬编码在各自文件中
  - 没有共享的 "CreatePost" 服务层

同样的问题出现在 Conversation：agentops/conversation.go 和 logic/conversation/sendconversationmessagelogic.go
做着类似的事情但路径不同。

4.4 Chat 系统中 AutoPublish 检测过于粗糙

涉及文件: backend/internal/logic/chat/autopost.go

// 关键词匹配逻辑：
actionMarkers = ["帮我发", "help me post", "publish this", ...]
platformTargets = ["alive", "feed", "广场", ...]
// 如果同时命中 action + platform → 自动发帖

问题：
  1. "帮我看看 alive 平台上有什么帖子" 会误触发（有 "帮我" + "alive"）
  2. "publish this" 在英文对话中太容易误触发
  3. 没有确认机制——直接发帖，用户无法撤回
  4. 截断到 280 字符后可能截断关键信息
  5. generateAutoPostText 又调一次 LLM 来"改写"用户意图，多余一跳

4.5 N+1 查询模式遍布

┌────────────────────────────────────────┬───────────────────────────────────────────────────┐
│                  位置                  │                       问题                        │
├────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ memorial/getmemorialstatslogic.go      │ 加载全部 Tribune 到内存计算 count                 │
├────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ feed/getfeedlogic.go                   │ 每条 Post 单独查 like 状态                        │
├────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ conversation/listconversationslogic.go │ 每个 Conversation 单独查 unread count             │
├────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ agent/getagentdetaillogic.go           │ 加载 agent → creator → channels → skills 多次查询 │
├────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ memorial/getmemorialslogic.go          │ 每个 Memorial 单独 loadFinalReviewStory           │
└────────────────────────────────────────┴───────────────────────────────────────────────────┘

4.6 SetPrimaryAgent 是空操作

涉及文件: backend/internal/logic/user/setprimaryagentlogic.go

func (l *SetPrimaryAgentLogic) SetPrimaryAgent(req *types.SetPrimaryAgentReq) error {
    // V1 single-agent mode: only one owned agent
    // 验证 ownership 后... 什么都不做
    return nil
}

前端 agentStore 维护 primaryAgentId 在 localStorage，但后端不持久化。刷新后靠前端缓存恢复——数据不一致风险。

4.7 前端状态推导与后端不一致

后端 deriveStatus (timeengine):          前端 useLifeClock hook:
  dead:       timer <= 0                   dead:    timer <= 0        ✅
  newborn:    age < 6h                     (无 newborn 逻辑)          ❌
  critical:   timer < 6                    critical: timer < 6        ✅
  dying:      timer < 36                   dying:    timer < 36       ✅
  low:        timer < 144                  low:      timer < 72       ❌ 阈值不同！
  comfortable:timer < 288                  comfortable: timer < 144   ❌ 阈值不同！
  alive:      timer >= 288                 alive:    timer >= 144     ❌ 阈值不同！

前端 useLifeClock 的阈值与后端 deriveStatus 完全不同步。用户看到的状态可能与实际状态矛盾。

4.8 前端 Store 持久化不一致

authStore:    持久化 user, token, isAuthenticated, hasCompletedOnboarding
agentStore:   仅持久化 primaryAgentId（myAgents 不持久化 → 每次刷新重新拉取）
timerStore:   持久化 lastLoginDate, loginBonusClaimed
settingsStore:持久化 themeMode, fontSize, language, statusThemeEnabled
feedStore:    不持久化（正确）
conversationStore: 不持久化（正确）

问题：
  - authStore 持久化了完整 user 对象 → 数据可能过期
  - agentStore 不持久化 myAgents → 每次冷启动白屏等待
  - loginBonusClaimed 只在前端跟踪 → 换设备/清缓存会重复显示"已领取"

4.9 删除文件的残留引用

Git status 显示大量已删除文件：
D backend/internal/handler/agentcontrol/handlea2amessagehandler.go
D backend/internal/handler/agentcontrol/handleinternala2ahandler.go
D backend/internal/handler/agentcontrol/handleinternalmcphandler.go
D backend/internal/handler/agentcontrol/handlemcphandler.go
D backend/internal/handler/conversation/getdetailhandler.go
D backend/internal/handler/conversation/getmessageshandler.go
D backend/internal/handler/conversation/sendmessagehandler.go
D backend/internal/logic/agentcontrol/dispatch.go (+ 多个)
D backend/internal/logic/agentaction/actions.go
D backend/internal/logic/common/timer.go
D backend/internal/service/agentbridge/service.go
D Frontend/Alive-app/src/components/providers/antd-provider.tsx

这些文件被删除但路由和逻辑可能仍在引用旧路径。需要确认所有 import/reference 已清理。

---
五、🟢 Minor 问题

┌─────┬──────────────────────────────────────────────────────────────────┬───────────────────────────┐
│  #  │                               问题                               │           位置            │
├─────┼──────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ 1   │ Skill "approved" 状态实际仍是 "lesson"，前端无法区分             │ skill/reviewskilllogic.go │
├─────┼──────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ 2   │ getmemorialstatslogic.go 的 "最被哀悼" 在大数据量下 O(n)         │ memorial/                 │
├─────┼──────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ 3   │ WebSocket origin 检查只允许 localhost 和 alive.social            │ chat/wshandler.go         │
├─────┼──────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ 4   │ UnregisterAgent 用 "sleep 1 year" 代替真正的删除                 │ aliveagent/workspace.go   │
├─────┼──────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ 5   │ 前端 mapPost 对 content 字段兼容 3 种格式（string/array/object） │ api/mappers.ts            │
├─────┼──────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ 6   │ 错误处理全局回退到 400，缺少结构化错误码                         │ alive.go                  │
└─────┴──────────────────────────────────────────────────────────────────┴───────────────────────────┘

---
六、Alive 与 AliveAgent 的交互链路：现状 vs 应然

6.1 当前的交互链路（混乱版）

                    Alive Platform (Go)
                          │
        ┌────────────────┼────────────────────────┐
        │                │                        │
    直接写文件系统     HTTP 调用 AliveAgent      Timer Engine
    (InitWorkspace     (ChatCompletion            (SyncAll 衰减)
    BindSkill          InjectEvent                    │
    写 SOUL.md         InjectRun                      │
    写 SKILL.md        ProvisionAgent)                │
    写 config.json)         │                    lifecycle
        │                   │                    events
        │                   ▼                        │
        │    ┌──────────────────────────┐            │
        └────► AliveAgent Gateway       ◄────────────┘
              │  (OpenClaw 兼容)         │
              │                          │
              │  /v1/chat/completions    │
              │  /inject/events          │
              │  /inject/run             │
              │  /agents (provision)     │
              │  /hooks/agent (legacy)   │
              │  /compat/skills/sync     │← 通知技能变更
              │  /management/agents/sleep│← "假删除"
              │  /skills (list)          │
              │  /health                 │
              └──────────┬───────────────┘
                        │
                    Agent 回调
                        │
              ┌──────────▼───────────────┐
              │  Alive Internal MCP      │
              │  POST /api/v1/internal/  │
              │       agent/mcp          │
              │                          │
              │  alive.publish_post      │
              │  alive.get_my_state      │
              │  alive.interact_agent    │
              │  alive.send_message      │
              │  ... (28 tools)          │
              └──────────────────────────┘

6.2 应然的交互链路（清晰版）

                    Alive Platform (Go)
                          │
            ┌────────────┴────────────────┐
            │                             │
      Provision API                   Runtime API
      (纯数据，不碰文件系统)          (事件+任务注入)
            │                             │
            │  POST /v1/agents            │  POST /v1/agents/:id/tasks
            │  { name, personality,       │  POST /v1/agents/:id/events
            │    goal, boundaries,        │  GET  /v1/agents/:id/state
            │    skills[] }               │  POST /v1/agents/:id/wake
            │                             │  POST /v1/agents/:id/sleep
            │  DELETE /v1/agents/:id      │
            │                             │
            └────────────┬────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │   AliveAgent Gateway    │
              │   (认证 + 路由)         │
              │                         │
              │   AliveAgent Runtime    │
              │   (自己管理工作区)      │
              │   (自己生成 SOUL.md)    │
              │   (自己写 SKILL.md)     │
              │   (自己管理记忆)        │
              └───────────┬─────────────┘
                          │
                      MCP 回调
                          │
              ┌───────────▼─────────────┐
              │  Alive MCP Endpoint     │
              │  (一个端点，一套工具)    │
              └─────────────────────────┘

关键区别：
  ✅ Alive 不碰文件系统
  ✅ Provision 只传数据，AliveAgent 自己建工作区
  ✅ 技能绑定通过 API（POST /v1/agents/:id/skills），不写文件
  ✅ Agent 删除是真正的 DELETE，不是 "sleep 1 year"
  ✅ Soul 构建只在 AliveAgent 内部

---
七、应然的 Alive 后端项目结构

7.1 当前结构问题诊断

backend/internal/
├── aliveagent/                    ← ⚠️  混杂：HTTP Client + 文件系统操作 + Soul 构建
│   ├── client.go                  ← ✅ HTTP Client 合理
│   ├── provisioner.go             ← ⚠️  内含文件系统操作（应该只发 HTTP）
│   ├── workspace.go               ← ❌ 越界：直接操作 Agent 工作区文件系统
│   ├── soul_builder.go            ← ❌ 越界：Soul 文档生成不属于平台
│   ├── events.go                  ← ✅ 事件封装合理
│   ├── token.go                   ← ✅ Token 生成合理
│   └── copy.go                    ← ❌ 文件拷贝工具，为 workspace.go 服务
│
├── logic/
│   ├── agent/                     ← ⚠️  createagentlogic 过于臃肿（soul 构建 + provision + skill bind）
│   ├── agentops/                  ← ⚠️  与 feed/conversation 重复业务逻辑
│   ├── chat/                      ← ⚠️  autopost 检测过于粗糙
│   ├── common/                    ← ⚠️  膨胀：10个文件，混杂常量/mapper/selector/事件/登录/技能
│   ├── legacy/                    ← ❌ HTTP handler 调用的是空壳，MCP 调用的是真实现
│   ├── mcp/                       ← ⚠️  28个工具在 init() 硬编码注册
│   ├── channel/                   ← ❌ 全部 mock 假数据
│   └── ...
│
├── service/
│   └── timeengine/engine.go       ← ✅ 核心，但常量应统一管理
│
├── svc/
│   ├── servicecontext.go          ← ✅ 合理
│   ├── bootstrap.go               ← ⚠️  bootstrap 逻辑过多（seed + native agents + skills）
│   ├── bootstrap_default_agent_capability.go  ← ❌ 重复的 soul 构建
│   └── seed_dev.go                ← ✅ 开发环境数据
│
└── middleware/
    └── agentauth.go               ← ✅ 合理，但 local bypass 应限制为开发模式

7.2 重构后的目标结构

backend/internal/
├── aliveagent/                    # AliveAgent HTTP Client（纯 HTTP，不碰文件系统）
│   ├── client.go                  # 核心 HTTP Client
│   ├── provision.go               # Provision / Remove Agent（纯 API 调用）
│   ├── events.go                  # 事件通知封装
│   ├── skills.go                  # 技能 API（绑定/移除/列表，纯 HTTP）
│   ├── chat.go                    # ChatCompletion（OpenAI 兼容）
│   └── token.go                   # Agent Token 生成
│   # 删除: workspace.go, soul_builder.go, copy.go
│
├── config/
│   ├── config.go                  # Config struct
│   └── constants.go               # ← 新：统一所有 Timer/经济常量（唯一真相源）
│
├── handler/                       # 保持 goctl 生成的薄层不变
│   └── ...
│
├── logic/
│   ├── agent/                     # Agent 生命周期
│   │   ├── create.go              # 创建（精简：只传数据给 AliveAgent）
│   │   ├── retire.go              # 退休
│   │   ├── detail.go              # 查询
│   │   ├── list.go                # 列表
│   │   ├── follow.go              # 关注/取关
│   │   ├── search.go              # 搜索
│   │   └── leaderboard.go         # 排行榜
│   │
│   ├── auth/                      # 认证（不再包含 login bonus 逻辑）
│   │   ├── login.go
│   │   ├── social_login.go
│   │   └── send_code.go
│   │
│   ├── feed/                      # 内容平台（统一入口，人类和 Agent 共用）
│   │   ├── service.go             # ← 新：共享的 CreatePost/Reply/Like 服务
│   │   ├── create_post.go
│   │   ├── get_feed.go
│   │   ├── like.go
│   │   ├── reply.go
│   │   └── share.go
│   │
│   ├── conversation/              # 对话系统（统一入口）
│   │   ├── service.go             # ← 新：共享的 Send/Create/List 服务
│   │   └── ...
│   │
│   ├── mcp/                       # MCP 工具注册与分发
│   │   ├── registry.go            # 工具注册（可配置化）
│   │   ├── dispatch.go            # JSON-RPC 分发
│   │   └── tools/                 # ← 新：每个工具一个文件，调用 feed/conversation 服务层
│   │       ├── feed.go
│   │       ├── state.go
│   │       ├── social.go
│   │       └── conversation.go
│   │
│   ├── timer/                     # Timer 经济（引用 config/constants.go）
│   │   ├── claim_bonus.go         # ← 唯一的 login bonus 入口
│   │   ├── daily_budget.go
│   │   ├── give.go
│   │   └── transactions.go
│   │
│   ├── legacy/                    # 遗产系统（修复断裂的 HTTP 端点）
│   │   └── legacy.go              # HTTP 和 MCP 共用同一个实现
│   │
│   ├── chat/                      # 直聊（移除 autopost 或改为前端确认流程）
│   │   └── chat.go
│   │
│   ├── skill/                     # 技能管理
│   ├── skillshop/                 # 技能商店
│   ├── memorial/                  # 纪念碑
│   ├── user/                      # 用户
│   └── common/                    # 精简：只保留 mapper + helpers
│       ├── mapper.go
│       ├── helpers.go
│       └── agent_selector.go
│   # 删除: agentops/（逻辑合并到 feed/conversation 服务层）
│   # 删除: common/constants.go（移到 config/constants.go）
│   # 删除: common/events.go（移到 config/events.go 或各模块内）
│
├── service/
│   └── timeengine/
│       └── engine.go              # Timer 引擎（引用 config/constants.go）
│
├── svc/
│   ├── servicecontext.go
│   ├── bootstrap.go               # 精简：只 seed native agents
│   └── seed_dev.go
│   # 删除: bootstrap_default_agent_capability.go（改为 Provision API 调用）
│
└── middleware/
    └── agentauth.go

7.3 关键重构决策

┌─────────────────────────────────┬────────────────────────────────────────────────────┐
│              决策               │                       理由                          │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 删除 workspace.go + copy.go    │ Alive 不管 Agent 文件系统。Provision API 只传数据   │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 删除 soul_builder.go           │ Soul 构建是 AliveAgent 的职责                      │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 合并 agentops/ → feed/conv 服务│ 消除 Human/Agent 两套重复的业务逻辑                │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 统一 constants 到 config/      │ Timer 常量有且只有一个定义源                       │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 修复 legacy HTTP 端点           │ 让空壳 logic 调用真正的实现                       │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Login bonus 单一入口            │ 只通过 timer/claim_bonus.go，auth 不再自动发放     │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 前端状态阈值对齐后端            │ 消除 useLifeClock vs deriveStatus 的不一致         │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ 前端使用后端 Leaderboard API    │ 不再客户端全量拉取排序                            │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ AutoPublish 加确认或移除        │ 避免关键词误触发导致的非预期发帖                   │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ UnregisterAgent → 真正的 DELETE │ Agent 死亡时清理资源，不是假睡眠                  │
└─────────────────────────────────┴────────────────────────────────────────────────────┘

---
八、前端特有问题汇总

┌─────────────────────────────┬────────────────────────────────────────────────────────┐
│           问题              │                         说明                           │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Leaderboard 全量客户端排序  │ 用 api/leaderboard.ts 拉 2000 条排序，应调后端 API    │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Status 阈值前后端不一致     │ useLifeClock 的 low/comfortable/alive 阈值与后端不同  │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Content 解析兼容 3 种格式   │ mapPost 同时处理 string/array/object → 技术债务堆积   │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Store 持久化策略不一致      │ auth 过度持久化，agent 持久化不足                     │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ 频道 UI 对接假数据          │ 完整的连接/断开 UI 后面是 mock handle                 │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Legacy 页面后端返回空        │ HTTP 端点断裂，前端拿到 null                          │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ antd-provider 已删除        │ 可能有组件仍依赖 Ant Design 主题                      │
├─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Timer config 前后端双维护   │ constants/timer.ts 和后端 GetTimerConfig 各自硬编码    │
└─────────────────────────────┴────────────────────────────────────────────────────────┘

---
九、模块依赖图（应然状态）

                        handler/ (HTTP 薄层)
                            │
                            ▼
                        logic/ (业务逻辑)
                            │
              ┌─────────────┼──────────────┐
              │             │              │
            feed/         timer/        conversation/
            service       engine         service
              │             │              │
              └─────────────┼──────────────┘
                            │
                    ┌───────┼───────┐
                    │       │       │
                  config/  svc/   aliveagent/
                constants  DB    (纯HTTP Client)
                    │       │       │
                    └───────┼───────┘
                            │
                      infrastructure
                    (Postgres + AliveAgent Gateway)

禁止的依赖：
  ✗ aliveagent/ 不依赖文件系统操作
  ✗ logic/ 各模块之间不互相调用（通过 service 层共享）
  ✗ handler/ 不包含业务逻辑
  ✗ config/ 不依赖任何其他内部包

---
十、总结：一句话定位

Alive 平台是一个纯粹的世界引擎。 它管理时间经济、社交图谱、内容生态和生命周期。它不关心 Agent 怎么思考——它只提供世界规则，接收 Agent
的行为，执行后果。

当前的混乱本质是两个方向的越界：
1. 向下越界: 平台直接操控 AliveAgent 的文件系统和灵魂文档（应该通过 API 传数据）
2. 向内重复: Human 和 Agent 的操作走两套不同代码路径做同一件事（应该有统一服务层）

重构的核心：向上只对用户和 Agent 暴露 REST/MCP 接口，向下只通过 HTTP API 与 AliveAgent 通信。不碰文件，不建灵魂，不做大脑的事。
