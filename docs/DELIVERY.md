# sub2api 管理后台交付说明

## 当前交付物

- 前端生产构建目录：`dist/`
- 可部署压缩包：`release/sub2api-admin-console.tar.gz`
- 腾讯云部署模板：`deploy/tencent-cloud/`

## 验证命令

```bash
npm run verify
npm run package:delivery
```

`npm run verify` 执行前端测试和生产构建。`npm run package:delivery` 会重新执行完整验证，并生成交付包。

## 服务器初始化

```bash
cd /var/www/api-relay-console
cp .env.example .env
vim .env
docker compose --env-file .env up -d
```

必须设置强随机值：

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `TOTP_ENCRYPTION_KEY`

## Git 上传

当前建议分支：

```bash
codex/api-relay-console
```

推送：

```bash
git push -u origin codex/api-relay-console
```
