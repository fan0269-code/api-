# sub2api 管理后台 API 对接说明

前端直连 sub2api，默认 API Base URL：

```text
/api/v1
```

生产环境由 Nginx 将 `/api/` 和 `/v1/` 反向代理到 sub2api `:8080`。

## 鉴权

`POST /api/v1/auth/login`

请求：

```json
{
  "email": "admin@example.com",
  "identifier": "admin@example.com",
  "password": "your-password"
}
```

响应：

```json
{
  "access_token": "jwt-token",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "Admin",
    "role": "admin"
  }
}
```

后续管理接口请求头：

```text
Authorization: Bearer <access_token>
```

`401` 响应会清理本地登录态并要求重新登录。

## 管理接口

本后台第一版使用以下 sub2api 管理接口：

- `GET /api/v1/auth/me`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/api-keys`
- `GET /api/v1/admin/accounts`
- `GET /api/v1/admin/groups`
- `GET /api/v1/admin/channels`
- `GET /api/v1/admin/usage`
- `GET /api/v1/admin/ops/request-errors`
- `GET /api/v1/admin/payment/orders`
- `GET /api/v1/admin/settings`

列表接口按 sub2api 原生分页响应处理：

```json
{
  "items": [],
  "total": 0
}
```

## 网关接口

AI 客户端请求不经过本仓库 Node 服务，直接由 sub2api 处理。Nginx 需要代理：

```text
/v1/*
/openai/v1/*
/api/v1/*
```

当前 Nginx 模板覆盖 `/api/` 和 `/v1/`。如果启用 sub2api 的 `/openai/v1/*` WebSocket/Responses 路由，需要按实际域名增加对应 location。

## 错误处理

前端统一读取：

```json
{
  "error": {
    "message": "error message"
  }
}
```

如果 sub2api 返回 `{ "message": "..." }`，前端也会显示该 message。
