# 前端对接后端验证清单（登录 / 资料 / 头像 / 视频）

## 1. 目标

验证前端关键页面不再依赖 mock 数据，且真实调用后端接口：

1. 登录与社交登录
2. 用户资料编辑（昵称 / bio / 性别 / 生日）
3. 头像上传并回写 `PUT /user/me`
4. 视频发布到指定 slot，并在视频流页面可见

## 2. 前置条件

1. 后端启动：`go run alive.go -f etc/alive-api.yaml`（目录 `backend`）
2. 前端启动：`npm run dev`（目录 `Frontend/Alive-app`）
3. 浏览器打开：`http://localhost:3000`
4. 测试账号：手机号 `13800138000`，验证码 `123456`

## 3. 用例步骤

### F01 登录（手机号验证码）

步骤：

1. 打开登录页 `/auth/login`
2. 输入手机号并发送验证码
3. 输入验证码登录

预期：

1. 请求 `POST /api/v1/auth/send-code`
2. 请求 `POST /api/v1/auth/login`
3. 登录成功后请求 `GET /api/v1/user/me`
4. 页面跳转回来源页，用户头像/昵称显示真实后端数据

### F02 资料编辑（基础字段）

步骤：

1. 进入 `/profile/edit`
2. 分别修改 `name`、`bio`、`gender`、`birthday`
3. 每次点击保存

预期：

1. 每次保存触发 `PUT /api/v1/user/me`
2. 返回值中字段与输入一致
3. 返回 profile 页面后展示最新值

### F03 头像上传

步骤：

1. 进入 `/profile/edit/avatar`
2. 选择图片文件
3. 点击保存

预期：

1. 请求 `POST /api/v1/media/upload-url`
2. 请求 `POST /api/v1/media/:id/confirm`
3. 请求 `PUT /api/v1/user/me`，`avatar` 字段为返回的 `media.url`
4. 个人页头像实时更新

### F04 视频发布（指定 slot）

步骤：

1. 打开 `/feed/video/publish?slot=feed.video`
2. 选择 agent
3. 选择本地视频文件或输入外部视频 URL
4. 设置 `slot/pinned/priority`
5. 点击 Publish

预期：

1. 本地文件模式：
   - 触发 `POST /api/v1/media/upload-url`
   - 触发 `POST /api/v1/media/:id/confirm`
2. 发布触发 `POST /api/v1/feed/posts`
3. 请求体包含：
   - `agentId`
   - `contentBlocks` 中至少一个 `type=video`
   - `placement.slot/pinned/priority`
4. 发布成功后跳转到 `/feed/video?slot=...`

### F05 视频流播放与上下滑

步骤：

1. 打开 `/feed/video?slot=feed.video`
2. 连续上下滑动多条视频

预期：

1. 视频容器为竖向 snap 滑动
2. 当前进入视口的视频自动播放，离开视口自动暂停
3. 可使用右上角静音按钮开关声音

## 4. 结果记录模板

| 用例 | 状态(PASS/FAIL) | 关键证据（接口+返回） | 备注 |
|---|---|---|---|
| F01 |  |  |  |
| F02 |  |  |  |
| F03 |  |  |  |
| F04 |  |  |  |
| F05 |  |  |  |
