# RelayHub 交付说明

## 当前交付物

- 前端生产构建目录：`dist/`
- 可部署压缩包：`release/relayhub-api-relay-console.tar.gz`
- 可导入 Git 历史包：`release/relayhub-api-relay-console.bundle`

## 验证命令

```bash
npm run verify
npm run package:delivery
```

`npm run verify` 会执行前端测试、后端接口测试和生产构建。`npm run package:delivery` 会重新执行完整验证，并生成可部署压缩包。

## Git 上传

当前本地分支：

```bash
codex/api-relay-console
```

如果已有远端仓库，配置并推送：

```bash
git remote add origin git@github.com:OWNER/REPO.git
git push -u origin codex/api-relay-console
```

如果需要从 bundle 导入：

```bash
git clone relayhub-api-relay-console.bundle relayhub-api-relay-console
cd relayhub-api-relay-console
git remote add origin git@github.com:OWNER/REPO.git
git push -u origin codex/api-relay-console
```
