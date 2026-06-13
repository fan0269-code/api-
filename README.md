# RelayHub API 中转站

RelayHub 是一个可交付的 API 中转站网站，包含公开官网首页、登录后的开发者控制台和 Node.js 后端 API。公开首页参考 AICodeMirror 的产品官网框架组织内容，控制台提供 API Key、模型、渠道、用量、账单和接入文档等核心页面。

## 页面入口

- `/`：公开官网首页，包含卖点、模型支持、价格方案和企业信任背书。
- `/login`：登录/注册入口。
- `/overview`：登录后的控制台总览。
- `/keys`：API Key 管理。
- `/models`：模型接口与价格状态。
- `/channels`：上游渠道管理，可查看供应商、Base URL、权重、模型覆盖并启用/停用渠道。
- `/usage`：用量统计。
- `/billing`：账单余额。
- `/docs`：接入文档和示例代码。
- `/v1/chat/completions`：OpenAI 兼容中转接口，支持真实上游转发；未配置上游时默认 mock 响应并记录用量。

## 本地运行

启动后端 API：

```bash
npm install
npm run dev:api
```

如需转发真实模型，在启动后端前配置 OpenAI 兼容上游：

```bash
export RELAY_UPSTREAM_BASE_URL="https://api.openai.com/v1"
export RELAY_UPSTREAM_API_KEY="sk-your-upstream-key"
npm run dev:api
```

另一个终端启动前端：

```bash
npm run dev:web -- --host 127.0.0.1
```

访问：

```text
http://127.0.0.1:5173/
```

## 验收命令

```bash
npm run verify
npm run preview:prod
npm run package:delivery
```

`npm run verify` 会执行测试和生产构建，`npm run preview:prod` 用 `dist/` 进行本地生产预览。`npm run package:delivery` 会生成可移交的压缩包：

```text
release/relayhub-api-relay-console.tar.gz
```

## 部署到腾讯云 CVM

先在本地构建并通过 SSH/rsync 上传到服务器：

```bash
export DEPLOY_HOST="your.server.ip"
export DEPLOY_USER="ubuntu"
export DEPLOY_PATH="/var/www/api-relay-console"
export DEPLOY_KEY="$HOME/.ssh/tencent-cloud.pem"

npm run deploy:tencent
```

如果 SSH key 已经加入 `ssh-agent`，可以不设置 `DEPLOY_KEY`。

也可以复制模板后按实际服务器修改：

```bash
cp deploy/tencent-cloud/.env.example deploy/tencent-cloud/.env.local
```

Nginx 配置模板在：

```text
deploy/tencent-cloud/nginx-api-relay-console.conf
```

详细部署说明见：

```text
deploy/tencent-cloud/README.md
```

## 技术文档

- [API 文档](docs/API.md)
- [架构说明](docs/ARCHITECTURE.md)

## 当前边界

- 当前版本包含前端和后端 API，后端使用 JSON 文件保存演示数据。
- OpenAI 兼容中转接口已具备 Key 鉴权、模型校验、渠道可用性校验、真实上游转发、mock 兜底、用量和账单记录。
- 登录是演示登录，尚未接入真实用户体系、密码哈希和权限审计。
- 支付、发票、流式响应透传和生产级密钥加密存储需要继续接入外部服务。
