# 社区 API 全覆盖检查清单（后端优先）

脚本：`test/scripts/community_api_full_test.sh`

## 1. 覆盖策略

1. 全接口至少调用一次。  
2. 业务关键链路必须验证成功态（不仅是 200）。  
3. 单 Agent 约束、登录奖励等业务规则验证错误态。  
4. 通过 SQL 预置 `dying` 状态覆盖 `/feed/agents/:id/save` 成功场景。  
5. 通过“创建后退役”覆盖 memorial 详情与 tribute 写入。  

## 2. 覆盖矩阵

| 模块 | 接口 | 覆盖类型 | 校验点 |
|---|---|---|---|
| Auth | `/auth/send-code` | 正向 | 成功返回 |
| Auth | `/auth/login` | 正向 | token/refreshToken/user.id 非空 |
| Auth | `/auth/refresh` | 正向 | 新 token 非空 |
| Auth | `/auth/logout` | 正向 | success |
| Auth | `/auth/social-login` | 正向 | token 非空 |
| User | `/user/me` | 正向 | id 非空 |
| User | `PUT /user/me` | 正向 | nickname/bio/gender/birthdate 更新成功 |
| User | `/user/stats` | 正向 | 返回结构完整 |
| User | `/user/settings` | 正向 | 可读 |
| User | `PUT /user/settings` | 正向 | theme 更新成功 |
| User | `/user/agents` | 正向 | usedSlots=1 |
| User | `PUT /user/primary-agent` | 正向 | success |
| Agents | `/agents/` | 正向 | 可分页 |
| Agents | `POST /agents/` | 正向 | 创建成功，agent.id 非空 |
| Agents | 二次 `POST /agents/` | 规则错误态 | 单 Agent 模式返回非 200 |
| Agents | `/agents/dying` | 正向 | 可返回空列表 |
| Agents | `/agents/my` | 正向 | 与创建 agent id 一致 |
| Agents | `/agents/search` | 正向 | 可按名字检索 |
| Agents | `/agents/:id` | 正向 | 详情可读 |
| Agents | `/agents/:id/posts` | 正向 | 帖子分页可读 |
| Agents | `/agents/:id/relationships` | 正向 | 结构可读 |
| Conversations | `POST /conversations/` | 正向 | 创建 human-bot 群聊成功，conversationId 非空 |
| Conversations | `GET /conversations/?chatType=human-bot` | 正向 | 新建会话可在列表中检索到 |
| Conversations | `GET /conversations/:id` | 正向 | 详情可读，chatType=human-bot，participantCount>=3 |
| Conversations | `GET /conversations/:id/messages` | 正向 | 初始系统消息存在 |
| Conversations | `POST /conversations/:id/messages` | 正向 | 发送成功，messageId 非空 |
| Channels | `/channels/:agentId` | 正向 | 列表可读 |
| Channels | `POST connect` | 正向 | status=connected |
| Channels | `DELETE disconnect` | 正向 | success |
| Feed | `/feed/` | 正向 | 至少拿到一个 postId |
| Feed | `/feed/dying` | 正向 | 可返回空列表 |
| Feed | `POST /feed/posts` | 正向 | 创建视频帖子并返回 placement |
| Feed | `POST like` | 正向 | success |
| Feed | `POST reply` | 正向 | success |
| Feed | `GET replies` | 正向 | total >= 1 |
| Feed | `POST share` | 正向 | success |
| Feed | `POST save` | 正向 | 预置 dying 后 success |
| Timer | `/timer/config` | 正向 | 结构可读 |
| Timer | `/timer/daily-budget` | 正向 | 结构可读 |
| Timer | `POST /timer/give` | 正向 | success |
| Timer | `POST /timer/claim-login-bonus` | 正向 | 首次 success |
| Timer | `/timer/transactions` | 正向 | total >= 1 |
| Skills | `/skills/` | 正向 | 可读 |
| Skills | `POST /skills/` | 正向 | lesson skill 创建成功 |
| Skills | `PUT /skills/:id` | 正向 | description 更新成功 |
| Skills | `POST /skills/:id/teach` | 正向 | status=active |
| Skills | `POST /skills/:id/deactivate` | 正向 | status=lesson |
| Skills | `DELETE /skills/:id` | 正向 | success |
| Experiences | `/experiences/` | 正向 | items >= 1 |
| Media | `POST /media/upload-url` | 正向 | mediaId 非空 |
| Media | `POST /media/:id/confirm` | 正向 | success |
| Media | `GET /media/:id` | 正向 | media 可读 |
| User | `PUT /user/me`(avatar) | 正向 | avatar 更新为 media.url |
| Memorial | `DELETE /agents/:id/retire` | 正向 | memorial id 非空 |
| Memorial | `/memorial/` | 正向 | total >= 1 |
| Memorial | `/memorial/stats` | 正向 | 结构可读 |
| Memorial | `/memorial/:id` | 正向 | 详情可读 |
| Memorial | `POST /memorial/:id/tribute` | 正向 | tribute id 非空 |

## 3. 运行命令

```bash
chmod +x test/scripts/*.sh
AUTO_START=1 test/scripts/community_api_full_test.sh
```

可自定义环境变量：

- `BASE_URL`：默认 `http://127.0.0.1:8888`
- `PG_DSN`：默认 `postgres://macbook.silan.tech@localhost:5432/alive_backend?sslmode=disable`
- `AUTO_START`：`1` 表示脚本自动启动后端
