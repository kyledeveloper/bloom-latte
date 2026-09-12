# 杯中花 Bloom

咖啡拉花手记。拍下每一杯，记下图案、研磨度、奶和笔记。

## 本地运行

```bash
npm install
npm run dev
```

## 部署到 Vercel

自己连 GitHub 部署时，**不会**自动带上 Grok 预览里的 Google / X 登录。Vercel 上请用邮箱密码，并配置下面这些环境变量（Settings → Environment Variables）：

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | Neon Postgres 连接串（必填，否则登录和手记无法持久化） |
| `BETTER_AUTH_URL` | 网站地址，例如 `https://你的项目.vercel.app`，不要末尾斜杠 |
| `BETTER_AUTH_SECRET` | 随机密钥，可用 `openssl rand -hex 32` 生成 |
| `VITE_AUTH_ENABLED` | 设为 `true` |

配好后 **Redeploy** 一次。用生产域名打开网站，先「注册」再登录。

Google / X 登录依赖 Grok 平台签发的授权客户端，只在 Grok 预览或通过 Grok 发布的应用里可用。自己部署到 Vercel 时请用邮箱。

## 许可证

[MIT](LICENSE)
