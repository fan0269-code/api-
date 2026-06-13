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

## OpenAI 兼容中转

`POST /v1/chat/completions`

请求头：

```text
Authorization: Bearer rh_live_sk_8K2A_demo_secret
Content-Type: application/json
```

请求：

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    { "role": "user", "content": "Hello RelayHub" }
  ]
}
```

响应为 OpenAI 兼容的 `chat.completion` 结构：

```json
{
  "id": "chatcmpl_demo",
  "object": "chat.completion",
  "created": 1781330000,
  "model": "gpt-4.1-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "RelayHub mock response..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 4,
    "completion_tokens": 24,
    "total_tokens": 28
  }
}
```

当前交付版支持两种模式：

- 配置 `RELAY_UPSTREAM_BASE_URL` 和 `RELAY_UPSTREAM_API_KEY` 时，请求会转发到 OpenAI 兼容上游。例如 `RELAY_UPSTREAM_BASE_URL=https://api.openai.com/v1` 会请求上游 `/chat/completions`。
- 未配置上游时，接口返回稳定 mock 响应，仍会执行 API Key 校验、模型可用性校验，并写入用量和账单记录，便于离线验收。

生产启动示例：

```bash
RELAY_UPSTREAM_BASE_URL=https://api.openai.com/v1 \
RELAY_UPSTREAM_API_KEY=sk-your-upstream-key \
HOST=127.0.0.1 PORT=8787 npm run server
```

常见错误：

- `401 invalid_api_key`：缺少或错误的 Bearer Key。
- `403 key_disabled`：Key 已停用。
- `400 validation_error`：缺少 `model` / `messages`，或模型不可用。
- `502 upstream_error`：上游服务异常或返回非预期响应。
