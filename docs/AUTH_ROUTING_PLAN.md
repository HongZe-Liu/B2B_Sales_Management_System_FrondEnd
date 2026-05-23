# React Router Auth Routing Implementation Plan

## 1. 目标

使用 React Router 实现前端访问控制：

- 用户访问后台 Dashboard 前必须先登录。
- 登录成功后才能进入后台页面。
- 未登录访问受保护页面时，自动跳转到登录页。
- 登录成功后回到用户原本想访问的页面。
- 登出后清除本地 token，并回到登录页。
- 客户公开表单 `form-collection` 保持无需登录。

## 2. 技术选择

采用 `react-router-dom`。

推荐第一阶段使用 `HashRouter`：

```jsx
import { HashRouter } from 'react-router-dom'
```

原因：

- 项目当前已经使用 hash 方式切页面。
- 本地和静态部署都不需要额外 history fallback 配置。
- 仍然可以使用 React Router 的标准能力：
  - `Routes`
  - `Route`
  - `Navigate`
  - `Outlet`
  - `useNavigate`
  - `useLocation`
  - protected route

如果后续部署环境能稳定支持 history fallback，可以再从 `HashRouter` 切换到 `BrowserRouter`。

## 3. 当前项目现状

当前前端状态：

- 已有登录页面：`src/pages/Login/Login.jsx`
- 当前 `src/App.jsx` 已使用 React Router
- 当前已安装 `react-router-dom`
- 当前接口层 `src/api/http.js` 已经支持读取 `accessToken`
- 当前公开表单是 `FormCollection`
- 当前后台页面包括：
  - `Quotation`
  - `Calculator`
  - `DataAnalysis`
  - `PersonalInformation`

当前后端 Auth API：

| 方法 | 路径 | 请求/响应 |
| --- | --- | --- |
| `POST` | `/api/auth/login` | 请求 `{ email, password }`，响应 `{ accessToken, tokenType, expiresIn, user }` |
| `POST` | `/api/auth/logout` | Bearer Token |
| `GET` | `/api/auth/me` | Bearer Token，校验当前 token 并返回当前用户 |

## 4. 路由设计

### 4.1 URL 结构

使用 `HashRouter` 后，浏览器地址会长这样：

```text
http://127.0.0.1:5173/#/login
http://127.0.0.1:5173/#/form-collection
http://127.0.0.1:5173/#/dashboard/quotation
```

推荐路由表：

| Path | 页面 | 是否需要登录 |
| --- | --- | --- |
| `/login` | Login | 否 |
| `/form-collection` | 客户公开提交表单 | 否 |
| `/dashboard/quotation` | Quotation Dashboard | 是 |
| `/dashboard/calculator` | Order Calculation | 是 |
| `/dashboard/data-analysis` | Data Analysis | 是 |
| `/dashboard/profile` | Personal Information | 是 |
| `/` | 自动跳转 | 按登录状态决定 |
| `*` | Not Found / Redirect | 可跳转合理默认页 |

默认跳转规则：

- 已登录访问 `/`：跳 `/dashboard/quotation`
- 未登录访问 `/`：跳 `/login`
- 已登录访问 `/login`：跳 `/dashboard/quotation`
- 未登录访问 dashboard：跳 `/login` 并携带 redirect state

### 4.2 公开路由

公开路由：

- `/login`
- `/form-collection`

说明：

- `form-collection` 是客户公开提交报价申请页面，不要求后台账号登录。
- Login 只负责后台用户登录，不负责客户提交。

### 4.3 受保护路由

受保护路由都放在 `/dashboard/*` 下：

```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard/quotation" element={<Quotation />} />
  <Route path="/dashboard/calculator" element={<Calculator />} />
  <Route path="/dashboard/data-analysis" element={<DataAnalysis />} />
  <Route path="/dashboard/profile" element={<PersonalInformation />} />
</Route>
```

`ProtectedRoute` 逻辑：

```jsx
function ProtectedRoute() {
  const location = useLocation()

  if (!getStoredAccessToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
```

登录成功后：

```jsx
const from = location.state?.from?.pathname || '/dashboard/quotation'
navigate(from, { replace: true })
```

## 5. 需要新增或修改的文件

### 5.1 安装依赖

执行：

```bash
npm install react-router-dom
```

验收：

- `package.json` 出现 `react-router-dom`
- `npm run build` 能正常解析路由依赖

### 5.2 新增 `src/api/auth.js`

职责：

- 登录
- 登出
- 获取当前用户
- 保存 token
- 清除 token
- 获取当前登录用户缓存

建议方法：

```js
login(payload)
logout()
getCurrentUser()
saveAuthSession(loginResponse)
clearAuthSession()
getStoredUser()
```

字段要求：

- 登录请求字段为 `email/password`
- token 保存 key 统一使用 `accessToken`
- user 保存 key 建议使用 `smUser`

### 5.3 修改 `src/api/http.js`

需要补充：

1. 后端返回 401 时抛出带 `status` 的错误。
2. 可选：提供一个全局 unauthorized callback。
3. 保持公开接口可设置 `auth: false`。

推荐错误对象：

```js
const error = new Error(result?.message || `Request failed with ${response.status}`)
error.status = response.status
throw error
```

后续在 App 或请求层统一处理：

```js
if (error.status === 401) {
  clearAuthSession()
  navigate('/login', { replace: true, state: { from: location } })
}
```

### 5.4 修改 `src/main.jsx`

用 `HashRouter` 包裹 `App`：

```jsx
import { HashRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
```

### 5.5 重写 `src/App.jsx`

替换当前手写 hash route。

目标结构：

```jsx
import { Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<PublicLoginRoute />} />
      <Route path="/form-collection" element={<FormCollection />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/quotation" element={<Quotation />} />
        <Route path="/dashboard/calculator" element={<Calculator />} />
        <Route path="/dashboard/data-analysis" element={<DataAnalysis />} />
        <Route path="/dashboard/profile" element={<PersonalInformation />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

需要新增组件：

- `RootRedirect`
- `ProtectedRoute`
- `PublicLoginRoute`

### 5.6 修改 `src/pages/Login/Login.jsx`

需要改动：

1. `ProFormText` 字段名从 `mobile` 改为 `email`。
2. `handleLogin` 调用 `login({ email, password })`。
3. 登录成功后保存：
   - `accessToken`
   - `user`
   - `expiresIn`
4. 登录成功后跳转：
   - 有 `location.state.from`：跳回原页面
   - 无来源：跳 `/dashboard/quotation`
5. 登录失败时展示后端错误。

登录提交 payload：

```json
{
  "email": "sales@example.com",
  "password": "password123"
}
```

后端成功响应中的核心数据：

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "name": "Helen Zhang",
    "email": "sales@example.com",
    "role": "sales"
  }
}
```

### 5.7 修改 `src/layouts/DashboardLayout/DashboardLayout.jsx`

需要接入 React Router 和 auth：

1. 菜单跳转改成 `useNavigate()`。
2. 当前菜单高亮可以从 `location.pathname` 推导。
3. 右上角用户名来自保存的 `user.name`。
4. 点击 Logout：
   - 调用 `/api/auth/logout`
   - 无论后端是否成功，都清除本地 token
   - `navigate('/login', { replace: true })`

当前 hash 跳转需要替换：

```js
window.location.hash = 'profile'
window.location.hash = key
```

改成：

```js
navigate('/dashboard/profile')
navigate(menuPathMap[key])
```

推荐映射：

```js
const menuPathMap = {
  quotation: '/dashboard/quotation',
  calculator: '/dashboard/calculator',
  'data-analysis': '/dashboard/data-analysis',
  profile: '/dashboard/profile',
}
```

### 5.8 修改跨页面跳转

需要替换所有 `window.location.hash`：

| 当前代码 | 新代码 |
| --- | --- |
| `window.location.hash = 'calculator'` | `navigate('/dashboard/calculator')` |
| `window.location.hash = 'form-collection'` | `navigate('/form-collection')` |
| `window.location.hash = 'profile'` | `navigate('/dashboard/profile')` |

涉及文件：

- `src/layouts/DashboardLayout/DashboardLayout.jsx`
- `src/pages/Quotation/Quotation.jsx`
- `src/pages/Quotation/components/RequestDetailDrawer.jsx`

## 6. 推荐实现步骤

### Step 1: 安装 React Router

执行：

```bash
npm install react-router-dom
```

验收：

- `package.json` 已包含 `react-router-dom`
- `package-lock.json` 已更新

### Step 2: 建立 auth API

新增 `src/api/auth.js`。

验收：

- 能调用 `/api/auth/login`
- 能保存 `accessToken`
- 能保存当前用户
- 能清除登录状态

### Step 3: 修改 `main.jsx` 和 `App.jsx`

执行内容：

- `main.jsx` 增加 `HashRouter`
- `App.jsx` 改成 `Routes/Route`
- 增加 `ProtectedRoute`
- 增加 `PublicLoginRoute`
- 增加 `RootRedirect`

验收：

- `/form-collection` 公开访问
- `/dashboard/quotation` 未登录会跳 `/login`
- 登录后访问 `/login` 会跳 `/dashboard/quotation`

### Step 4: 接入 Login

修改 `src/pages/Login/Login.jsx`。

验收：

- 登录字段为 `email/password`
- 登录成功保存 token
- 登录成功跳回原目标页
- 登录失败显示错误

### Step 5: 接入 DashboardLayout 路由跳转和登出

修改 `src/layouts/DashboardLayout/DashboardLayout.jsx`。

验收：

- 左侧菜单使用 React Router 跳转
- 右上角显示当前用户
- Logout 清除 token 并跳 `/login`

### Step 6: 替换剩余 hash 跳转

执行搜索：

```bash
rg -n "window.location.hash|hashchange|replace\\('#'" src
```

验收：

- 没有手写 hash routing 残留
- 页面间跳转都使用 `useNavigate`

### Step 7: 处理 401

最小方案：

- `http.js` 抛出 `error.status = 401`
- 页面请求捕获 401 时清除 auth 并跳登录

更完整方案：

- 在 `http.js` 支持注册 `onUnauthorized`
- 在 App 初始化时注册统一处理逻辑

验收：

- token 过期或无效时自动回登录页

### Step 8: 联调验证

前置：

- 后端运行在 `http://localhost:8080`
- 前端 Vite proxy 已配置 `/api -> http://localhost:8080`

验证路径：

1. 清空 localStorage/sessionStorage。
2. 打开 `/#/dashboard/quotation`。
3. 应跳转到 `/#/login`。
4. 输入后端账号密码登录。
5. 应跳转回 `/#/dashboard/quotation`。
6. 刷新页面。
7. 仍保持登录状态。
8. 点击 Logout。
9. 应回到 `/#/login`。
10. 再访问 `/#/dashboard/quotation`，应再次要求登录。
11. 打开 `/#/form-collection`，不要求登录。

## 7. 最终验收清单

- [x] 已安装 `react-router-dom`。
- [x] `main.jsx` 使用 `HashRouter` 包裹 `App`。
- [x] `App.jsx` 使用 `Routes/Route`。
- [x] 登录页接入 `/api/auth/login`。
- [x] 登录请求字段为 `email/password`。
- [x] 登录成功保存 `accessToken`。
- [x] 登录成功保存当前用户信息。
- [x] 未登录访问 `/dashboard/*` 自动跳转登录页。
- [x] 登录成功后返回原目标 dashboard 页面。
- [x] `/form-collection` 保持公开访问，但不作为默认首页。
- [x] DashboardLayout 使用 React Router 菜单跳转。
- [x] DashboardLayout 显示当前用户名称。
- [x] Logout 调用 `/api/auth/logout` 并清除本地状态。
- [x] 后端返回 401 时自动清除登录状态并跳转登录页。
- [x] 没有 `window.location.hash` 手写路由残留。
- [x] `npm run lint` 通过。
- [x] `npm run build` 通过。
