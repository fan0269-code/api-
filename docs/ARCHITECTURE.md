# RelayHub 技术架构

## 目标

RelayHub 当前版本是可交付的前后端一体化网站，用于演示 API 中转站的公开官网、开发者控制台、API Key 管理、模型列表、渠道管理、用量统计、账单余额和接入文档。

## 组件

- `src/`：React + Vite 前端。
- `server/`：Node.js HTTP 后端，不依赖第三方服务。
- `server/data/db.json`：后端首次启动时生成的 JSON 数据文件。
- `dist/`：生产前端静态文件。
- `deploy/tencent-cloud/`：腾讯云 CVM 部署脚本、Nginx 配置和环境变量模板。

## 数据流

1. 用户访问 `/` 查看公开官网。
2. 用户进入 `/login` 并提交登录表单。
3. 前端调用 `POST /api/auth/login`，随后并行拉取账户、Key、模型、渠道、用量、账单和文档示例。
4. 控制台页面通过 React 状态渲染后端数据。
5. 创建或停用 API Key 时，前端调用后端接口，后端写入 `server/data/db.json`；Key 同时包含月配额、已用额度和 RPM 限制。
6. 控制台通过 `/api/channels` 展示上游渠道，通过 `PATCH /api/channels/:id` 启用或停用渠道。
7. 应用服务通过 `/v1/chat/completions` 使用 RelayHub Key 调用 OpenAI 兼容接口，后端校验 Key、月配额、RPM、模型状态和渠道可用性。
8. 如果配置了 `RELAY_UPSTREAM_BASE_URL` 和 `RELAY_UPSTREAM_API_KEY`，后端将请求转发给真实上游并透传响应；否则返回本地 mock completion。
9. 中转调用成功后，后端写入用量点、账单记录、Key 已用额度和最近使用时间。
10. 用户在账单页提交充值金额时，前端调用 `POST /api/billing/recharge`，后端更新账户余额并追加充值账单记录。

## 运行模式

### 开发

一个终端启动 API：

```bash
npm run dev:api
```

另一个终端启动前端：

```bash
npm run dev:web -- --host 127.0.0.1
```

Vite 将 `/api` 代理到 `http://127.0.0.1:8787`。

### 生产

先构建前端：

```bash
npm run build
```

再启动 Node 服务：

```bash
HOST=127.0.0.1 PORT=8787 npm run server
```

Node 服务提供 `/api/*` 和 `/v1/*`，也可以直接服务 `dist/` 静态文件。腾讯云部署推荐由 Nginx 服务静态文件，并把 `/api/`、`/v1/` 反向代理到 Node 服务。

真实上游转发启动示例：

```bash
RELAY_UPSTREAM_BASE_URL=https://api.openai.com/v1 \
RELAY_UPSTREAM_API_KEY=sk-your-upstream-key \
HOST=127.0.0.1 PORT=8787 npm run server
```

## 稳定性措施

- `/api/health` 用于健康检查。
- API 错误响应使用统一 `{ error: { code, message } }` 结构。
- 请求体限制为 64KB，避免异常大请求影响服务。
- `/v1/chat/completions` 使用每 Key 的月配额和进程内 RPM 窗口限制，超限时在请求上游前拒绝。
- JSON 文件写入串行化，避免并发写覆盖。
- 充值接口校验金额范围并和账单记录在同一次 JSON 写入中完成，避免余额和交易明细不一致。
- 后端读取旧版 `server/data/db.json` 时会自动补齐缺失的默认渠道和 Key 限制字段，降低演示数据升级风险。
- 静态资源使用长期缓存，HTML 禁用缓存以便发布后及时更新。
- `npm run verify` 覆盖前端测试、后端接口测试和生产构建。
- `/v1/chat/completions` 支持 OpenAI 兼容上游转发，并在真实转发模式下校验启用渠道；没有真实上游密钥时使用稳定 mock 响应，保证交付环境可独立验收。

## 边界

- 登录为演示登录，尚未接入真实用户认证和密码哈希。
- API Key 为演示密钥，生产环境需要加密存储和权限审计。
- 当前充值为演示余额充值闭环，尚未接入真实支付网关、发票和对账服务。
- 流式响应透传和生产级密钥加密存储尚未接入第三方服务；当前 `/v1/chat/completions` 已提供兼容接口、鉴权、渠道校验、上游转发、用量记录和 mock 兜底。
