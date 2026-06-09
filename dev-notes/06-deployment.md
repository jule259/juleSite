# 部署笔记

> Vercel + Neon PostgreSQL 免费部署方案

---

## 为什么选 Vercel

- Next.js 官方维护，天然支持
- 免费层足够个人项目（100GB 带宽/月，6000 构建分钟/月）
- Git push 自动部署，零维护
- 和 Neon PostgreSQL 同为 Vercel Marketplace 合作伙伴，延迟低

---

## 部署流程

### 1. GitHub 连接

Vercel → Sign In with GitHub → Import Repository → 选择 `jule259/juleSite`

### 2. 框架自动检测

Vercel 自动识别 Next.js：
- Build Command: `npm run build`（自动）
- Output Directory: `.next`（自动）

### 3. 环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 中添加：

| Key | 说明 | 必填 |
|-----|------|:--:|
| `DATABASE_URL` | Neon Pooled connection | ✅ |
| `ADMIN_PASSWORD` | 管理后台密码 | ✅ |
| `SESSION_SECRET` | 随机 32 字节 | ✅ |
| `STEAM_API_KEY` | Steam API | ❌ |
| `IGDB_CLIENT_ID` | IGDB 客户端 ID | ❌ |
| `IGDB_CLIENT_SECRET` | IGDB 密钥 | ❌ |

> ⚠️ 必须用 **Pooled connection**（含 `-pooler`），不能用直连字符串。直连在 serverless 环境下会超限。

### 4. 部署验证

部署后用浏览器访问 `xxx.vercel.app`，检查：
- 首页加载
- 游戏库列表有数据
- 统计页图表正常
- 管理后台登录
- 每个页面不报错

---

## 自动部署

```
git push origin main  →  Vercel 自动检测 → 自动构建 → 自动上线
```

不用手动操作任何东西。构建失败会回滚，不影响线上。

---

## Vercel CLI 问题

Windows 系统用户名含中文时，`npx vercel login` 会报 `is not a legal HTTP header value`。直接通过网页端部署即可，不影响使用。

---

## 数据库注意事项

- Neon 免费层限制：0.5GB 存储、1 个项目、100 小时/月计算时间
- 个人使用完全足够
- 建议在 Vercel 和 Neon 选择**同一个区域**（如 `ap-southeast-1` = 新加坡），降低延迟

---

## 自定义域名（可选）

Vercel → Settings → Domains → 添加自己的域名 → 按指引改 DNS 解析即可。
