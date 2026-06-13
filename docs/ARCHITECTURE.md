# RelayHub 技术架构

## 目标

RelayHub 当前版本是可交付的前后端一体化网站，用于演示 API 中转站的公开官网、开发者控制台、API Key 管理、模型列表、用量统计、账单余额和接入文档。

## 组件

- `src/`：React + Vite 前端。
- `server/`：Node.js HTTP 后端，不依赖第三方服务。
- `server/data/db.json`：后端首次启动时生成的 JSON 数据文件。
- `dist/`：生产前端静态文件。
- `deploy/tencent-cloud/`：腾讯云 CVM 部署脚本、Nginx 配置和环境变量模板。

## 数据流

1. 用户访问 `/` 查看公开官网。
2. 用户进入 `/login` 并提交登录表单。
3. 前端调用 `POST /api/auth/login`，随后并行拉取账户、Key、模型、用量、账单和文档示例。
4. 控制台页面通过 React 状态渲染后端数据。
5. 创建或停用 API Key 时，前端调用后端接口，后端写入 `server/data/db.json`。

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

Node 服务提供 `/api/*`，也可以直接服务 `dist/` 静态文件。腾讯云部署推荐由 Nginx 服务静态文件，并把 `/api/` 反向代理到 Node 服务。

## 稳定性措施

- `/api/health` 用于健康检查。
- API 错误响应使用统一 `{ error: { code, message } }` 结构。
- 请求体限制为 64KB，避免异常大请求影响服务。
- JSON 文件写入串行化，避免并发写覆盖。
- 静态资源使用长期缓存，HTML 禁用缓存以便发布后及时更新。
- `npm run verify` 覆盖前端测试、后端接口测试和生产构建。

## 边界

- 登录为演示登录，尚未接入真实用户认证和密码哈希。
- API Key 为演示密钥，生产环境需要加密存储和权限审计。
- 账单、支付和真实上游模型转发尚未接入第三方服务。
