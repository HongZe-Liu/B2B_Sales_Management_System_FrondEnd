# 环境变量与部署安全检查

本文档记录当前前端项目的环境变量位置、变量用途、安全级别和上线前部署注意事项。

## 当前结论

- 当前仓库只发现一个环境变量文件：项目根目录 `.env.local`。
- `.env.local` 已被 `.gitignore` 的 `*.local` 规则忽略，没有被 Git 跟踪。
- 当前代码只读取了一个 Vite 前端变量：`VITE_PUBLIC_FORM_ORIGIN`。
- 没有发现数据库密码、API Key、后端密钥、SMTP 密码等高敏感环境变量。
- 当前 `dist` 构建产物里已经编入了本地局域网地址。上线前必须使用生产环境变量重新执行 `npm run build`，不要直接部署旧的本地 `dist`。

## 环境变量位置

| 位置 | 当前状态 | 说明 |
| --- | --- | --- |
| `.env.local` | 存在，本地文件，Git 忽略 | 本机开发环境变量。当前用于配置客户表单二维码访问地址。 |
| `.env.example` | 存在，可提交 | 环境变量模板，不包含真实值。部署或新机器初始化时可参考。 |
| `.env` | 未发现 | 可用于提交非敏感默认值，但当前项目未使用。 |
| `.env.production` | 未发现 | 可用于生产默认值，但如果包含真实域名或敏感信息，建议改用部署平台环境变量。 |
| `.env.production.local` | 未发现 | 可用于本机生产构建覆盖值，应保持 Git 忽略。 |
| 部署平台环境变量 | 待配置 | 生产部署时推荐在平台控制台、CI/CD 或服务器环境中配置。 |

Vite 常见读取优先级包括 `.env`、`.env.local`、`.env.[mode]`、`.env.[mode].local`。其中 `.local` 文件应只保存在本机或服务器，不提交到 Git。

当前 `.gitignore` 已明确忽略 `.env` 和 `.env.*`，并只允许提交 `.env.example`、`.env.*.example` 这类模板文件。

## 当前变量清单

| 变量名 | 是否必填 | 安全级别 | 当前用途 | 读取位置 |
| --- | --- | --- | --- | --- |
| `VITE_PUBLIC_FORM_ORIGIN` | 可选，但生产建议配置 | 公开变量 | 生成客户表单二维码地址的 origin，最终地址为 `${VITE_PUBLIC_FORM_ORIGIN}/#/form-collection` | `src/pages/Quotation/Quotation.jsx` |

### `VITE_PUBLIC_FORM_ORIGIN`

用途：

- 用于报价页面的 `Form QR Code` 功能。
- 如果配置了该变量，二维码优先使用它生成客户表单链接。
- 如果没有配置，代码会回退到浏览器本地保存的地址，再回退到 `window.location.origin`。

格式：

```bash
VITE_PUBLIC_FORM_ORIGIN=https://your-frontend-domain.com
```

注意：

- 不要在末尾加路径，代码会自动拼接 `/#/form-collection`。
- 生产环境应使用 HTTPS 域名。
- 不建议在生产环境继续使用 `localhost`、`127.0.0.1`、局域网 IP 或开发端口 `5173`。
- 这是 `VITE_` 前缀变量，会在构建时打入浏览器 JS 包，因此它不是秘密，不能放任何密钥。

## 前端变量安全规则

Vite 只会把 `VITE_` 前缀的变量暴露给前端代码，例如：

```js
import.meta.env.VITE_PUBLIC_FORM_ORIGIN
```

因此请遵守以下规则：

- `VITE_` 变量全部视为公开信息。
- 不要把数据库密码、JWT 签名密钥、第三方 API Secret、SMTP 密码、云服务 Access Key 放进 `VITE_` 变量。
- 真正的密钥应只放在后端服务或部署平台的服务端环境变量中。
- 如果以后要新增后端 API 地址变量，可以命名为 `VITE_API_BASE_URL`，但它同样只能保存公开的 API 网关地址，不能保存认证密钥。

## API 地址部署说明

当前前端 API 请求都使用同源相对路径，例如：

```js
request('/api/auth/login')
request('/api/admin/quote-requests')
```

本地开发时，`vite.config.js` 配置了开发代理：

```js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
}
```

这个代理只在 `npm run dev` 时生效，生产部署不会生效。

生产部署推荐方式：

- 前端静态站点部署在 `https://your-frontend-domain.com`。
- 服务器或网关把 `https://your-frontend-domain.com/api/*` 反向代理到后端服务。
- 这样前端无需额外配置 API Base URL，也能继续使用现有 `/api/...` 请求。

如果生产环境前后端必须使用不同域名，则需要后端开启 CORS，并改造前端请求封装，让 `src/api/http.js` 支持公开的 `VITE_API_BASE_URL`。

## 上线前检查清单

- 确认 `.env.local`、`.env.production.local` 等本地文件没有被提交。
- 在部署平台配置生产变量：

```bash
VITE_PUBLIC_FORM_ORIGIN=https://your-frontend-domain.com
```

- 使用生产变量重新构建：

```bash
npm ci
npm run build
```

- 不要直接部署已有的本地 `dist`，因为它可能包含开发 IP 或开发端口。
- 确认生产域名支持 HTTPS。
- 确认服务器或网关已把 `/api/*` 转发到后端。
- 打开生产页面后，检查报价页面二维码是否指向生产域名。
- 在浏览器开发者工具里检查构建产物中没有出现本地 IP、测试域名或临时地址。

## 额外安全观察

当前登录 token 保存在浏览器 `localStorage`：

- 保存位置：`src/api/auth.js`
- 读取位置：`src/api/http.js`
- 请求时会加到 `Authorization: Bearer <token>`

这不是环境变量问题，但和上线安全有关。`localStorage` 方案可以工作，但需要注意 XSS 风险。上线时建议至少确保：

- 不渲染未经转义的用户输入。
- 开启 HTTPS。
- 后端设置合理的 token 过期时间。
- 后续如果安全等级提高，可以评估改为 `HttpOnly + Secure + SameSite` Cookie。
