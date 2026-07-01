# sub2api 管理后台架构

## 目标

本项目交付一个管理员后台前端和腾讯云部署模板。真实后端、数据库、缓存、网关转发、计费、账户池、调度和限流由 sub2api 提供。

## 组件

- `src/`：React + Vite + TypeScript 管理后台。
- `src/api/client.ts`：sub2api typed API client，负责 JWT、错误处理和管理接口聚合。
- `deploy/tencent-cloud/docker-compose.yml`：sub2api、PostgreSQL、Redis。
- `deploy/tencent-cloud/nginx-api-relay-console.conf`：静态前端与 `/api`、sub2api 网关路径反代。
- `dist/`：生产前端静态文件。
- `release/sub2api-admin-console.tar.gz`：交付压缩包。

## 数据流

1. 管理员访问 `/login`。
2. 前端调用 `POST /api/v1/auth/login` 获取 sub2api JWT。
3. 前端保存 token，并读取 dashboard stats/realtime、users、accounts、groups、group api-keys、channels、usage、ops、payment、settings。
4. 如果后端返回 `423` 合规确认要求，前端进入 `/compliance`，管理员手动输入确认短语后再重新读取管理数据。
5. 管理页面以表格和指标卡展示 sub2api 数据。
6. AI 客户端调用 `/v1/*`、`/v1beta/*`、`/responses`、`/backend-api/*` 等网关路径，Nginx 直接代理到 sub2api。
7. sub2api 负责账户池调度、并发控制、限流、计费、用量日志和上游转发。

## 部署拓扑

```text
Browser
  |
  v
Nginx :80
  |-- /           -> /var/www/api-relay-console/dist/
  |-- /api/      -> 127.0.0.1:8080 sub2api
  |-- /v1/       -> 127.0.0.1:8080 sub2api
  |-- /v1beta/   -> 127.0.0.1:8080 sub2api
  |-- /responses -> 127.0.0.1:8080 sub2api
  |-- /backend-api/ -> 127.0.0.1:8080 sub2api

Docker Compose
  |-- sub2api:8080
  |-- postgres:5432
  |-- redis:6379
```

## 稳定性措施

- sub2api 容器配置 healthcheck。
- PostgreSQL 和 Redis 使用本地目录持久化，便于备份迁移。
- `JWT_SECRET` 和 `TOTP_ENCRYPTION_KEY` 必须固定，避免重启后会话和 2FA 失效。
- Nginx 对网关路径关闭 proxy buffering，并提高 read timeout，支持流式响应。
- Nginx 启用 `underscores_in_headers on;`，兼容 sub2api 粘性会话相关 header。
- Nginx 静态根目录只指向 `dist/`，部署配置、`.env` 和运行数据目录不暴露到公网静态文件服务。
- 前端遇到 `401` 会清除 token，避免过期态继续访问管理接口。
- 前端遇到 `423` 会进入管理员合规确认页，不会自动代替管理员提交确认。

## 边界

- 本仓库不 fork sub2api 后端源码，默认使用 `weishaw/sub2api:latest`。
- 本仓库不再维护 Node mock API。
- 第一版只覆盖管理员后台核心运营闭环，不做用户自助端。
- 支付、OAuth、账户池和上游模型配置遵循 sub2api 原生能力和第三方服务条款。
