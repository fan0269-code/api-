# sub2api 管理后台

这是一个面向运营管理员的 sub2api 定制管理后台。前端使用 React + Vite + TypeScript，后端能力由 sub2api 官方 Docker 镜像提供，生产部署使用 PostgreSQL、Redis 和 Nginx。

## 功能范围

- `/login`：sub2api 管理员登录，使用 `/api/v1/auth/login` 获取 JWT。
- `/overview`：运营总览，请求量、成功率、活跃用户、账户池健康、余额和告警。
- `/users`：用户管理，查看用户、余额、角色和状态。
- `/keys`：API Key 管理，按用户和分组查看 Key、状态和 RPM。
- `/accounts`：订阅账户池，查看平台、账户类型、分组和调度状态。
- `/groups`：分组调度，查看倍率、RPM、账户数量和状态。
- `/channels`：模型渠道，查看平台、Base URL、模型数量和状态。
- `/usage`：调用日志，查看用户、模型、请求类型、Token、成本和状态。
- `/alerts`：告警任务，查看请求错误和上游异常。
- `/orders`：订单余额，查看支付订单、金额、渠道和状态。
- `/settings`：系统设置，查看版本、运行模式、网关入口和备份状态。

## 本地开发

前端开发服务器会把 `/api`、`/v1` 和其它 sub2api 网关路径代理到本地 sub2api：

```bash
npm install
npm run dev:web -- --host 127.0.0.1
```

另起终端启动 sub2api：

```bash
cd deploy/tencent-cloud
cp .env.example .env
# 编辑 .env，填写 ADMIN_PASSWORD、JWT_SECRET、TOTP_ENCRYPTION_KEY 等
docker compose --env-file .env up -d
```

访问：

```text
http://127.0.0.1:5173/login
```

## 验收命令

```bash
npm run verify
npm run package:delivery
```

`npm run verify` 会执行前端测试和生产构建。`npm run package:delivery` 会重新执行验证，并生成交付包：

```text
release/sub2api-admin-console.tar.gz
```

## 腾讯云部署

部署资产在：

```text
deploy/tencent-cloud/
```

核心文件：

- `docker-compose.yml`：sub2api、PostgreSQL、Redis。
- `.env.example`：生产环境变量模板。
- `nginx-api-relay-console.conf`：静态前端、管理接口和 sub2api 网关路径反向代理。
- `deploy.sh`：本地构建并上传到腾讯云 CVM。

详细说明见 [腾讯云部署文档](deploy/tencent-cloud/README.md)。

## 技术文档

- [API 对接说明](docs/API.md)
- [架构说明](docs/ARCHITECTURE.md)
- [交付说明](docs/DELIVERY.md)

## 当前边界

- 后端主链路已切换为 sub2api；本仓库不再提供 Node mock API 作为生产后端。
- 第一版只做管理员后台，不包含用户自助注册、用户充值中心和公开营销官网。
- 生产环境必须设置固定 `JWT_SECRET` 和 `TOTP_ENCRYPTION_KEY`，否则重启会影响登录会话和 2FA。
- sub2api 账号池和上游配置涉及第三方服务条款，部署方需要自行确认合规性。
