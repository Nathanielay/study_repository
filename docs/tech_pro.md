# H5 英语单词学习 - 技术实现详解

本文件补充说明前端、后端与数据库的交互逻辑、关键技术栈以及测试方案。

## 1. 前端实现与交互逻辑

### 1.1 页面与数据来源
- `/` 首页：
  - 服务端渲染获取 `session` 判断登录态。
  - 已登录时拉取最近学习与进度信息，未登录仅展示词书列表。
- `/login` 登录页：
  - 服务端 `action` 调用 NextAuth Credentials 登录。
  - 成功后跳转 `/me`，失败回传 error 参数显示提示。
- `/register` 注册页：
  - 服务端 `action` 校验邮箱是否存在。
  - 创建用户成功后跳转 `/login`，失败显示提示。
- `/me` 我的页：
  - 服务端拉取用户信息与学习进度。
  - 未登录显示登录/注册入口。
- `/learn/[bookId]` 学习页：
  - 依赖登录态，未登录重定向 `/login`。
  - 根据进度读取下一条单词并展示学习卡片。
- `/word/[wordId]` 详情页：
  - 根据单词 ID 读取完整 JSON 并解析展示。

### 1.2 主要前端组件
- `app/components/tab-bar.tsx`：底部导航。
- `app/components/learning-card.tsx`：学习卡片与“下一词”交互。
- `app/components/me-screen.tsx`：我的页登录态展示。

## 2. 后端实现与 API 交互

### 2.1 认证与会话
- 使用 NextAuth Credentials Provider，邮箱 + 密码登录。
- 登录成功后会话在服务端可通过 `auth()` 获取。
- 登录/注册为独立页面，通过 server actions 触发。

### 2.2 API 路由与职责
- 认证：
  - `POST /api/auth/[...nextauth]`：NextAuth 内部处理登录/会话。
  - `POST /api/auth/register`：注册接口（前端页面以 server action 为主）。
- 词书与单词：
  - `GET /api/books`：获取词书列表。
  - `GET /api/books/[bookId]/words?startRank=0&limit=1`：按进度获取词书单词。
  - `GET /api/words/[wordId]`：获取单词详情 JSON。
- 进度：
  - `GET /api/me/recent`：最近学习记录。
  - `GET /api/me/progress?bookId=xxx`：指定词书进度。
  - `POST /api/me/progress`：更新学习进度与历史。
- 后台同步：
  - `POST /api/admin/sync/books`：同步词书。
  - `POST /api/admin/sync/words`：同步单词。
  - 如设置 `SYNC_TOKEN`，需在请求头提供 `x-sync-token`。

## 3. 数据库交互逻辑

### 3.1 数据访问入口
- `app/db.ts` 作为统一的数据访问层。
- 通过 `drizzle-orm` + `mysql2` 进行查询与写入。

### 3.2 核心交互流程
- 登录：
  - `getUser(email)` 查询用户并比对密码哈希。
- 注册：
  - `getUser(email)` 校验是否存在。
  - `createUser(email, password)` 写入用户表，密码使用 `bcrypt-ts` 哈希。
- 获取词书：
  - `getBooks()` 返回全部词书。
- 学习进度：
  - `getProgress(userId, bookId)` 查询进度。
  - `updateProgress(...)` 更新进度、最近学习、历史记录。
- 最近学习：
  - `getRecentLearning(userId)` 获取最近学习书籍与进度。

### 3.3 数据表与迁移
- 表结构见 `drizzle/schema.ts`。
- 进度相关表可通过 `node scripts/run-migrations.js` 执行 SQL 迁移。

## 4. 技术栈与依赖说明

### 4.1 前端
- Next.js 14（App Router）
- React 18
- Tailwind CSS

### 4.2 后端
- NextAuth（Credentials 登录）
- Next.js Route Handlers（API）
- Drizzle ORM
- mysql2（MySQL 连接）
- bcrypt-ts（密码哈希）

## 5. 测试方案

### 5.1 手动测试（建议流程）
- 登录成功/失败提示是否正确。
- 注册成功跳转登录页，注册失败提示是否显示。
- 未登录访问学习页是否重定向 `/login`。
- 登录后首页是否展示最近学习（有数据时）。
- 学习页“下一词”是否更新进度。
- 单词详情是否能正确展示 JSON 内容。
 - “下一词”请求是否按顺序触发 `POST /api/me/progress` 与 `GET /api/books/[bookId]/words`。

### 5.2 脚本与静态检查
- `pnpm lint`：基础代码规范检查。

### 5.3 API 冒烟测试（示例）
- `GET /api/books` 是否返回词书列表。
- `GET /api/words/[wordId]` 是否返回详情 JSON。
- `POST /api/me/progress` 是否更新进度记录。

## 6. 运行注意事项
- 数据库连接依赖网络直连，系统代理可能导致 MySQL 请求超时。

## 7. 部署与运维
### 7.1 构建与运行
- 生产构建：`pnpm build`
- 生产运行：`pnpm start`
- 运行产物位于 `.next/`，服务模式为 Node（非纯静态站点）。

### 7.2 systemd 与 Nginx
- systemd 用于进程守护，`User=` 需为系统中存在的用户。
- Nginx 反向代理到 `127.0.0.1:3000`，提供域名与 HTTPS 入口。
- 国内环境对外提供网站服务通常需要ICP备案。
- 首页底部中间展示网站核准号：浙ICP备2022034225号-1，链接至 https://beian.miit.gov.cn，文字小号。
