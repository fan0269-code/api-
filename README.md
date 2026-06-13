# RelayHub API 中转站

RelayHub 是一个可交付的 API 中转站网站原型，包含公开官网首页和登录后的开发者控制台。公开首页参考 AICodeMirror 的产品官网框架组织内容，控制台提供 API Key、模型、用量、账单和接入文档等核心页面。

## 页面入口

- `/`：公开官网首页，包含卖点、模型支持、价格方案和企业信任背书。
- `/login`：登录/注册入口。
- `/overview`：登录后的控制台总览。
- `/keys`：API Key 管理。
- `/models`：模型接口与价格状态。
- `/usage`：用量统计。
- `/billing`：账单余额。
- `/docs`：接入文档和示例代码。

## 本地运行

```bash
npm install
npm run dev -- --host 127.0.0.1
```

访问：

```text
http://127.0.0.1:5173/
```

## 验收命令

```bash
npm run verify
npm run preview:prod
```

`npm run verify` 会执行测试和生产构建，`npm run preview:prod` 用 `dist/` 进行本地生产预览。

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

## 当前边界

- 当前版本是前端可交付原型，使用 mock 数据展示业务流程。
- 登录态仅存在前端内存中，刷新后需要重新登录。
- 真实 API 中转、用户体系、支付、计费结算和密钥加密存储需要后端服务承接。
