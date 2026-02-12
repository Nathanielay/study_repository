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
- 健康检查：
  - `GET /api/health`：应用 + DB 连通性检查。
- 场景短文：
  - `POST /api/articles/generate`：生成短文（英文+中文意译+语法解析），包含 `glossary` 供中文高亮。
  - `GET /api/articles`：获取历史短文列表（场景、标题、时间）。
- 异步任务：
  - `POST /api/articles/tasks`：创建生成任务。
  - `GET /api/articles/tasks/[taskId]`：查询任务状态与结果。
- 默写与复盘：
  - `POST /api/dictations`：提交默写并评分。
  - `GET /api/review/word-network?articleId=xxx`：生成复盘词网。

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

### 3.4 场景短文与复盘数据
- 场景短文：存储英文、中文意译、语法解析、关联词列表与场景标签。
- 中文高亮：生成接口返回 `glossary`，按映射高亮中文翻译。
- 场景短文列表：从文章表读取最近生成记录用于列表展示。
- 默写记录：存储用户输入、评分结果与错词列表。
- 错题本：错词统计与最近错误时间。
- 复盘词网：核心词、短语、新词标记与来源标签。
- 异步任务：生成任务状态、失败原因与关联短文。

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
- `POST /api/articles/generate` 是否返回短文与语法解析。
- `POST /api/dictations` 是否返回评分与差异结果。

## 6. 运行注意事项
- 数据库连接依赖网络直连，系统代理可能导致 MySQL 请求超时。

## 6.1 场景短文生成规范
- 字数：150-2000 个英文单词，正式考试语体。
- 场景：需求评审、调试、代码评审、上线事故、写文档。
- 词库：收藏词库，单篇覆盖约 35 个词（最大 50），可小幅浮动。
- 输出包含英文短文、中文意译、中文逐句语法解析，覆盖词高亮。
- 允许手动指定场景词参与生成。

### 6.2 生成提示模板
```
你是计算机考研英语教练。

场景：{scene}
目标词列表（必须覆盖，约 50 个）：{wordList}
可选手动词：{manualWords}

要求：
1) 生成 150-2000 个英文单词英文短文，语气正式、符合考研阅读风格。
2) 短文必须覆盖目标词，必要时允许合理词形变化。
3) 其他句子使用常用词汇。
4) 输出必须包含三部分：
[EN] 英文短文
[ZH] 中文意译（自然意译）
[GRAMMAR] 逐句语法解析（每句一条，中文详细解释）
5) 覆盖词在英文与中文中使用 <mark> 标识。
```

## 7. 部署与运维
### 7.1 构建与运行
- 镜像构建：GitHub Actions 构建并推送至 GHCR（`ghcr.io/<owner>/<repo>`）。
- 运行方式：Docker 镜像蓝绿发布（3001/3002）。
- 发布脚本：`scripts/deploy.sh`（包含健康检查与切流量）。

### 7.2 systemd 与 Nginx
- Nginx 反向代理到 `127.0.0.1:3001/3002`，切流量使用 `nginx -t` + reload。
- 国内环境对外提供网站服务通常需要ICP备案。
- 首页底部中间展示网站核准号：浙ICP备2022034225号-1，链接至 https://beian.miit.gov.cn，文字小号。
