# sub2api 管理后台 API 对接说明

前端直连 sub2api，默认 API Base URL：

```text
/api/v1
```

生产环境由 Nginx 将 `/api/` 和 sub2api 网关路径反向代理到 sub2api `:8080`。

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
- `GET /api/v1/admin/dashboard/stats`
- `GET /api/v1/admin/dashboard/realtime`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/groups/:id/api-keys`
- `GET /api/v1/admin/accounts`
- `GET /api/v1/admin/groups`
- `GET /api/v1/admin/channels`
- `GET /api/v1/admin/usage`
- `GET /api/v1/admin/ops/request-errors`
- `GET /api/v1/admin/payment/orders`
- `GET /api/v1/admin/settings`

本后台已接入以下核心写操作：

- `POST /api/v1/admin/users/:id/balance`：管理员调整用户余额，支持 `set`、`add`、`subtract`。
- `PUT /api/v1/admin/api-keys/:id`：管理员绑定/解绑 API Key 分组，可同时重置限速用量。
- `POST /api/v1/admin/accounts/:id/schedulable`：暂停或恢复订阅账户调度。
- `POST /api/v1/admin/accounts/:id/test`：发起订阅账户连通性测试。

接口按 sub2api 标准响应包装处理，前端兼容 `{data: ...}` 与分页数据：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "page_size": 20
  }
}
```

## 网关接口

AI 客户端请求不经过本仓库 Node 服务，直接由 sub2api 处理。Nginx 需要代理：

```text
/v1/*
/v1beta/*
/backend-api/*
/antigravity/*
/openai/v1/*
/responses
/responses/*
/images/*
/chat/completions
/embeddings
```

当前 Nginx 模板已覆盖上述管理接口和网关入口，并对流式路径关闭 proxy buffering。

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
