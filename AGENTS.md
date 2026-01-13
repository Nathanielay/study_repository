# 项目概述
这是一个基于 Next.js App Router 的 H5 英语单词学习应用，包含邮箱/密码登录注册、词书浏览、学习卡片、进度记录与单词详情。

# 安装与运行
## 环境变量（建议放在 `.env.local`）
- `MYSQL_URL`：MySQL 连接串，数据与进度存储依赖此项。
- `AUTH_SECRET`：NextAuth 使用的密钥，用于会话加密与签名。
- `SYNC_TOKEN`：后台同步接口的可选鉴权令牌（请求头 `x-sync-token`）。
 
## 环境注意事项
- 数据库连接依赖网络直连；如开启系统代理，请确保 `MYSQL_URL` 指向的地址不走代理或放行端口。

## 依赖安装
- `pnpm install`

## 本地运行
- `pnpm dev`

## 构建与启动
- `pnpm build`
- `pnpm start`

## 其他脚本
- `pnpm lint`
- `pnpm drizzle:push`（同步 Drizzle schema）
- `node scripts/run-migrations.js`（执行 `migrations/` SQL）

# 部署与运维
## 运行方式
- 生产环境使用 `pnpm build` + `pnpm start`。
- systemd 守护进程，反向代理使用 Nginx，入口指向 `127.0.0.1:3000`。

## 常见问题
- systemd 报错 `status=217/USER`：`User=` 配置为不存在的系统用户。
- Nginx 504：后端服务未启动或数据库连接超时。

## 合规注意事项
- 国内环境对外提供网站服务通常需要ICP备案，请提前准备备案材料并完成备案后再上线。

# 目录结构与路由
## 前端目录（UI/页面）
- `app/`：App Router 页面与布局
- `app/components/`：通用组件
- `app/globals.css`：全局样式

## 后端目录（API/数据）
- `app/api/`：Route Handlers API
- `app/db.ts`：数据库访问与业务查询
- `drizzle/`、`drizzle/schema.ts`：表结构与 ORM
- `migrations/`、`scripts/run-migrations.js`：SQL 迁移

## 页面路由
- `/`：首页（最近学习 + 全部词书）
- `/login`：登录
- `/register`：注册
- `/me`：我的（账号与进度）
- `/learn/[bookId]`：学习页
- `/word/[wordId]`：单词详情

## API 接口
- 认证：`/api/auth/[...nextauth]`、`/api/auth/register`
- 词书：`/api/books`、`/api/books/[bookId]/words`
- 单词：`/api/words/[wordId]`
- 进度：`/api/me/recent`、`/api/me/progress`
- 管理同步：`/api/admin/sync/books`、`/api/admin/sync/words`

# 技术栈与核心依赖
- 前端：Next.js 14（App Router）、React 18、Tailwind CSS
- 认证：NextAuth（Credentials）
- 数据库：MySQL + Drizzle ORM
- 密码：`bcrypt-ts`
