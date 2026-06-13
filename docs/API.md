# RelayHub API 文档

所有接口返回 JSON。错误响应统一为：

```json
{
  "error": {
    "code": "validation_error",
    "message": "name is required"
  }
}
```

## 健康检查

`GET /api/health`

返回服务状态、服务名和时间戳。

## 登录

`POST /api/auth/login`

请求：

```json
{
  "identifier": "dev@example.com",
  "password": "password123"
}
```

响应：

```json
{
  "token": "demo-session-token",
  "account": {
    "name": "林开发者",
    "email": "dev@example.com",
    "plan": "Pro Developer",
    "balance": 128.6,
    "monthlySpend": 86.42,
    "lowBalanceThreshold": 150
  }
}
```

## 账户

`GET /api/account`

返回当前账户信息。

## API Keys

`GET /api/keys`

返回 API Key 列表。

`POST /api/keys`

请求：

```json
{
  "name": "本地开发"
}
```

响应状态码 `201`，返回新建 Key。新密钥仅在创建响应中完整展示。

`PATCH /api/keys/:id`

请求：

```json
{
  "status": "disabled"
}
```

`status` 只能是 `active` 或 `disabled`。

## 模型

`GET /api/models`

返回模型、供应商、上下文、价格、延迟和状态。

## 用量

`GET /api/usage`

返回全部用量。

`GET /api/usage?model=gpt-4.1-mini`

按模型过滤用量。

## 账单

`GET /api/billing`

返回充值和调用消费记录。

## 文档示例

`GET /api/docs/examples`

返回 curl、Node.js、Python 示例代码。
