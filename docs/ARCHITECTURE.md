# sub2api 管理后台架构

## 目标

本项目交付一个管理员后台前端和腾讯云部署模板。真实后端、数据库、缓存、网关转发、计费、账户池、调度和限流由 sub2api 提供。

## 组件

- `src/`：React + Vite + TypeScript 管理后台。
- `src/api/client.ts`：sub2api typed API client，负责 JWT、错误处理和管理接口聚合。
- `deploy/tencent-cloud/docker-compose.yml`：sub2api、PostgreSQL、Redis。
- `deploy/tencent-cloud/nginx-api-relay-console.conf`：静态前端与 `/api`、`/v1` 反代。
- `dist/`：生产前端静态文件。
- `release/sub2api-admin-console.tar.gz`：交付压缩包。

## 数据流

1. 管理员访问 `/login`。
2. 前端调用 `POST /api/v1/auth/login` 获取 sub2api JWT。
3. 前端保存 token，并并行读取 dashboard、users、api-keys、accounts、groups、channels、usage、ops、payment、settings。
4. 管理页面以表格和指标卡展示 sub2api 数据。
5. AI 客户端调用 `/v1/*`，Nginx 直接代理到 sub2api 网关。
6. sub2api 负责账户池调度、并发控制、限流、计费、用量日志和上游转发。

## 部署拓扑

```text
Browser
  |
  v
Nginx :80
  |-- /           -> dist/
  |-- /api/      -> 127.0.0.1:8080 sub2api
  |-- /v1/       -> 127.0.0.1:8080 sub2api

Docker Compose
  |-- sub2api:8080
  |-- postgres:5432
  |-- redis:6379
```

## 稳定性措施

- sub2api 容器配置 healthcheck。
- PostgreSQL 和 Redis 使用本地目录持久化，便于备份迁移。
- `JWT_SECRET` 和 `TOTP_ENCRYPTION_KEY` 必须固定，避免重启后会话和 2FA 失效。
- Nginx 对 `/v1/` 关闭 proxy buffering，并提高 read timeout，支持流式响应。
- Nginx 启用 `underscores_in_headers on;`，兼容 sub2api 粘性会话相关 header。
- 前端遇到 `401` 会清除 token，避免过期态继续访问管理接口。

## 边界

- 本仓库不 fork sub2api 后端源码，默认使用 `weishaw/sub2api:latest`。
- 本仓库不再维护 Node mock API。
- 第一版只覆盖管理员后台核心运营闭环，不做用户自助端。
- 支付、OAuth、账户池和上游模型配置遵循 sub2api 原生能力和第三方服务条款。
