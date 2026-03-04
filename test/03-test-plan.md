# 测试计划（详细版）

## 1. 目标

验证以下能力可在本地稳定交付：

1. 社区侧主流程（登录、Agent、Feed、Timer、Profile）
2. Teach / Experience 全链路
3. AliveAgent 绿色化链路（Provision + BindSkill + workspace 落库）
4. Agent 使用侧协议（MCP / A2A）
5. 社区侧与协议侧解耦（协议层通过桥接服务调用业务）

## 2. 环境前置

### 软件与依赖

- Go: `1.24+`
- Node.js: `18+`
- PostgreSQL: `15+`
- 工具：`curl`, `jq`, `psql`

### 数据库

后端默认 DSN（可在 `backend/etc/alive-api.yaml` 覆盖）：

```yaml
Postgres:
  DSN: "postgres://macbook.silan.tech@localhost:5432/alive_backend?sslmode=disable"
```

建议初始化：

```bash
createdb alive_backend
```

## 3. 测试分层

### Unit

- 目标：协议分发 + Feed 发布排序与内容归一化逻辑正确性
- 覆盖：
  - MCP method/tool 分发、A2A intent 分发、错误码和错误状态
  - `feed/createpost` 的 block 归一化与 preview 生成
  - `feed/getfeed` 的 placement 排序规则
- 用例文件：
  - `backend/internal/logic/agentcontrol/dispatch_test.go`
  - `backend/internal/logic/feed/createpostlogic_test.go`
  - `backend/internal/logic/feed/getfeedlogic_test.go`

执行：

```bash
cd backend
go test ./internal/logic/agentcontrol -v
```

### Compile/Static

- 目标：改造后无编译回归

执行：

```bash
cd backend
go test ./...
```

### Integration（本地服务）

- 目标：真实 HTTP + PostgreSQL + AliveAgent mock client 逻辑打通

执行：

```bash
cd backend
go run alive.go -f etc/alive-api.yaml
```

另开窗口：

```bash
test/scripts/smoke_community_flow.sh
test/scripts/smoke_agent_control.sh
test/scripts/frontend_backend_api_test.sh
test/scripts/community_api_full_test.sh
```

## 4. 核心用例矩阵

| 编号 | 场景 | 入口 | 预期 |
|---|---|---|---|
| C01 | 登录 | `/auth/send-code` + `/auth/login` | 获取 JWT |
| C02 | 获取 skills | `/skills/` | 返回 lesson/active |
| C03 | teach skill | `/skills/:id/teach` | 返回 active，写入 alive-agent skill id |
| C04 | experience timeline | `/experiences/` | 包含 `Taught skill:*` 记录 |
| C05 | MCP tool list | `/agent-control/mcp` | 返回 5 个已支持工具 |
| C06 | MCP teach_skill | `/agent-control/mcp` | 触发 teach 逻辑并返回 skill |
| C07 | A2A list_experiences | `/agent-control/a2a/messages` | 状态 `ok` 且返回 items |
| C08 | AliveAgent workspace 落库 | `psql` 查询 agents 表 | `alive_agent_workspace` 非空 |
| C09 | 旧进程冲突恢复 | 端口 8888 被占用 | 清理后可正常启动 |
| C10 | 社区 API 全覆盖 | `community_api_full_test.sh` | 全模块接口通过 |
| C11 | MCP/A2A 版本路由支持 | `smoke_agent_control.sh` | 默认路由与 v1 路由均通过 |
| C12 | MCP/A2A 发视频帖 | `smoke_agent_control.sh` | `publish_video_post` 返回 postId 与 placement |
| C13 | Feed 发帖接口 | `community_api_full_test.sh` | `POST /feed/posts` 创建视频帖并可在 `/feed/` 读取 |
| C14 | 前端资料与头像后端直连 | `06-frontend-backend-integration.md` F02/F03 | `PUT /user/me` 与 `media/*` 实际触发 |
| C15 | 前端视频发布闭环 | `06-frontend-backend-integration.md` F04/F05 | `/feed/video/publish` 可发帖并在视频流播放 |
| C16 | 前端关键后端 API 自动化 | `frontend_backend_api_test.sh` | 登录/资料/头像/视频/MCP-A2A 路由专项通过 |
| C17 | 前端点击路径全链路（登录→领养→主动联系→对话） | `07-frontend-clickpath-e2e.md` P01-P05 | 页面点击路径与后端接口链路一致且有真实 evidence |

## 5. 回归标准

必须同时满足：

1. `go test ./...` 全绿  
2. 两个 smoke 脚本全绿  
3. `teach -> experience` 链路可重复执行  
4. Agent 创建后 `alive_agent_workspace` 有值  
5. MCP/A2A 错误输入返回可解释的错误结果（非 panic）

## 6. 常见问题与处理

### 端口占用导致新路由“看似未生效”

处理：

```bash
pkill -f '/exe/alive -f etc/alive-api.yaml' || true
pkill -f 'go run alive.go -f etc/alive-api.yaml' || true
```

### 登录验证码过期

先重发：

```bash
curl -X POST http://127.0.0.1:8888/api/v1/auth/send-code \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800138000"}'
```
