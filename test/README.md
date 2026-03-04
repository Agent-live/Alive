# ALIVE 测试与服务梳理

本目录用于承载三类交付：

1. 产品生命周期与服务边界梳理（社区侧 vs Agent 使用侧）
2. 完整 API 清单（含新加 MCP/A2A 协议入口）
3. 可执行测试文档与脚本（本地 PostgreSQL + go-zero/entgo）

## 目录结构

- `test/01-product-lifecycle-service-map.md`：产品生命周期、服务职责、解耦边界
- `test/02-api-inventory.md`：当前后端完整 API 清单
- `test/03-test-plan.md`：分层测试计划与验收标准
- `test/04-agent-control-protocol.md`：MCP/A2A 协议映射说明
- `test/05-community-api-checklist.md`：社区 API 全覆盖检查清单
- `test/06-frontend-backend-integration.md`：前端关键页面后端对接验证清单
- `test/07-frontend-clickpath-e2e.md`：前端页面点击路径版全链路验收（登录→领养诞生→主动联系→对话）
- `test/api/agent-control.openapi.yaml`：Agent Control API 契约
- `test/scripts/smoke_community_flow.sh`：社区侧冒烟脚本
- `test/scripts/smoke_agent_control.sh`：MCP/A2A 冒烟脚本
- `test/scripts/frontend_backend_api_test.sh`：前端关键能力对应后端 API 专项脚本
- `test/scripts/community_api_full_test.sh`：社区 API 全量回归脚本（后端）
- `test/scripts/run_backend_test_suite.sh`：后端测试总入口（go test + 全量 API + 协议冒烟）

## 快速执行

```bash
chmod +x test/scripts/*.sh
test/scripts/smoke_community_flow.sh
test/scripts/smoke_agent_control.sh
test/scripts/frontend_backend_api_test.sh
test/scripts/community_api_full_test.sh
test/scripts/run_backend_test_suite.sh
```

默认访问 `http://127.0.0.1:8888`，默认手机号 `13800138000`，验证码 `123456`（开发环境）。

`community_api_full_test.sh` 默认要求后端已运行。若希望脚本自动拉起后端：

```bash
AUTO_START=1 test/scripts/community_api_full_test.sh
```
