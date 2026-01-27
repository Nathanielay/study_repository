# H5 英语单词学习 - 技术文档

## 1. 技术概述
- 前端：Next.js 14 App Router + React 18 + Tailwind CSS
- 后端：Next.js Route Handlers（API）+ NextAuth（Credentials）
- 数据库：MySQL（服务端存储学习进度与最近学习）
- 数据源：单词书与单词数据由后台系统上传

## 2. 数据库设计

### 2.1 既有表定义（words / books）
说明：以下为当前系统已存在的真实表结构（字段命名已对齐）。

#### books（单词书）
```sql
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `word_count` int NOT NULL,
  `cover_url` varchar(500) NOT NULL,
  `book_id` varchar(120) NOT NULL,
  `tags` json NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `books_book_id_unique` (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

#### words（单词）
```sql
CREATE TABLE `words` (
  `id` int NOT NULL AUTO_INCREMENT,
  `word_rank` int NOT NULL,
  `head_word` varchar(120) NOT NULL,
  `word_id` varchar(120) NOT NULL,
  `book_id` varchar(120) NOT NULL,
  `content` json NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `words_word_id_unique` (`word_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

字段说明：
- `content` 存储完整单词 JSON（便于详情页渲染）。
- 首页/卡片字段从 `content` 中解析（如 `trans[0]`、`ukphone`、`usphone`）。

### 2.2 新增表设计（用于背单词功能）

#### User（用户，已存在）
```sql
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(64) DEFAULT NULL,
  `password` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

#### user_book_progress（每本书的学习进度）
```sql
CREATE TABLE user_book_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  current_word_rank INT NOT NULL DEFAULT 0,
  learned_count INT NOT NULL DEFAULT 0,
  last_word_id VARCHAR(64) NULL,
  last_learned_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_book (user_id, book_id),
  INDEX idx_progress_user (user_id),
  INDEX idx_progress_book (book_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES `User`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### user_recent_learning（最近学习）
```sql
CREATE TABLE user_recent_learning (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  last_word_id VARCHAR(64) NOT NULL,
  last_word_rank INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_recent_user (user_id),
  INDEX idx_recent_book (book_id),
  CONSTRAINT fk_recent_user FOREIGN KEY (user_id) REFERENCES `User`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### user_word_history（学习记录，可选）
```sql
CREATE TABLE user_word_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  word_id VARCHAR(64) NOT NULL,
  word_rank INT NOT NULL DEFAULT 0,
  learned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_user (user_id),
  INDEX idx_history_book (book_id),
  INDEX idx_history_word (word_id),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES `User`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 3. 后端设计

### 3.1 认证
- 使用 NextAuth Credentials Provider。
- 登录/注册使用独立页面：`app/login/page.tsx` 与 `app/register/page.tsx`。
- 密码存储：`bcrypt-ts` hash。

### 3.2 API 设计（Route Handlers）
已实现的 API 如下：

#### 获取单词书列表
- `GET /api/books`
- 返回字段：`book_id`, `name`, `word_count`, `cover_url`

#### 获取单词列表（按 rank）
- `GET /api/books/:bookId/words?startRank=0&limit=1`
- 返回字段：`wordId`, `headWord`, `wordRank`, `content`

#### 获取单词详情
- `GET /api/words/:wordId`
- 返回字段：`content`（完整 JSON）

#### 健康检查
- `GET /api/health`
- 返回字段：`ok`（包含 DB 连接检查）

#### 获取最近学习
- `GET /api/me/recent`
- 返回：`book_id`, `last_word_id`, `last_word_rank`

#### 更新学习进度
- `POST /api/me/progress`
- 入参：`book_id`, `word_id`, `word_rank`
- 逻辑：
  - 更新 `user_book_progress`
  - 更新 `user_recent_learning`
  - 写入 `user_word_history`

#### 获取学习进度
- `GET /api/me/progress?bookId=xxx`
- 返回：`progress`（包含 `current_word_rank`, `learned_count` 等）

## 4. 前端设计

### 4.1 页面与路由
- `/`：首页（展示最近学习 + 单词书列表）
- `/login`、`/register`：登录/注册页面（已有）
- `/me`：我的（用户信息与进度）
- `/learn/:bookId`：学习页（单词卡片 + 下一词）
- `/word/:wordId`：单词详情

### 4.2 组件建议
- `TabBar`：底部 Tab 栏
- `RecentLearningCard`：最近学习模块
- `BookList` / `BookItem`
- `WordCard`：学习卡片

### 4.3 状态管理
- 认证状态：NextAuth session
- 最近学习：`/api/me/recent`
- 当前学习进度：`/api/me/progress`
- 单词书与单词数据：从本地 JSON 上传到服务端数据库后读取

### 4.4 前端数据流
1) 首页加载 -> 获取 session -> 拉取 recent（如登录）与 books。
2) 点击书 -> 未登录跳转登录页；已登录进入学习页。
3) 学习页 -> 根据 progress 定位起始词 -> 读取 words -> 点击 Next（先写入 progress，再读取下一词）。
4) 点击单词 -> 进入详情页（/api/words/:wordId）。

## 5. 进度计算规则
- 初次进入书：`current_word_rank = 0`（或首词 rank）。
- “继续学习”从 `last_word_rank + 1` 开始。
- 每次点击 Next：
  - `user_book_progress.current_word_rank = 当前词 rank`
  - `learned_count += 1`
  - 同步更新 `user_recent_learning`。

## 6. 安全与性能
- 使用参数校验防止 SQL 注入（ORM 层保证）。
- `words.content` 使用 JSON 字段存储大对象，减少表结构变化。
- 对 `book_id`、`word_id` 建索引，提高查询效率。
- 书籍列表可缓存（如按更新时间）。
- 数据库连接依赖网络直连，使用代理时需确保 MySQL 地址可达。

## 7. 部署与运行
- CI 使用 GitHub Actions 构建 Docker 镜像并推送至 GHCR。
- 服务器通过 `scripts/deploy.sh` 进行蓝绿发布（3001/3002）与 Nginx 切流量。
- 运行依赖环境变量：`MYSQL_URL`、`AUTH_SECRET`（`SYNC_TOKEN` 可选）。
- 国内环境对外提供网站服务通常需要ICP备案。
- 首页底部中间展示网站核准号：浙ICP备2022034225号-1，链接至 https://beian.miit.gov.cn，文字小号。

## 7. 后续扩展
- 忘记密码（邮件找回）。
- 增加错词本与复习功能。

## 8. 数据同步方案（后台系统上传 -> 本地数据库）

### 8.1 同步目标
- 将后台系统上传的单词书与单词数据入库到 `books` 与 `words` 表。
- 保持 `book_id` 与 `word_id` 的唯一性，支持增量更新。

### 8.2 同步频率
- 上传触发：后台系统上传后立即同步入库。
- 运维补偿：定时任务每日 1 次全量对账（防止漏同步）。

### 8.3 增量策略
- 以 `book_id` 为主键定位书籍：
  - 若不存在则插入，存在则更新 `title/word_count/cover_url/tags/updated_at`。
- 以 `word_id` 为主键定位单词：
  - 若不存在则插入，存在则更新 `content/word_rank/head_word`。
- 当后台标记删除（若有），执行软删除或记录失效状态（待确认）。

### 8.4 同步流程
1) 后台系统上传书籍数据\n
2) Upsert `books`：按 `book_id` 更新或插入\n
3) 上传单词列表\n
4) Upsert `words`：按 `word_id` 更新或插入\n
5) 记录同步日志与失败重试队列\n

### 8.5 失败重试与幂等
- 同步任务具备幂等性：重复执行不会生成重复数据（基于 `book_id` / `word_id` 唯一约束）。\n
- 上传/入库失败进入重试队列，指数退避（1m/5m/15m）。\n
- 单本书失败不影响其他书同步。\n

### 8.6 监控与日志
- 记录每次同步的开始/结束时间、成功数量、失败数量。\n
- 异常写入日志与告警（可接入邮件/钉钉/Slack）。\n
