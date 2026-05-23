# Frontend and Backend Field Alignment Execution Plan

## 1. 任务目标

以后端 DTO 为唯一字段来源，完整对齐前端以下页面和模块，为前后端联调打基础：

- Form Collection: 客户公开提交报价申请表单。
- Quotation Dashboard: 后台报价申请列表、筛选、指标卡。
- Order Detail: 报价申请详情抽屉。
- Order Calculation: 从订单详情带入字段并进行报价计算草稿。
- Data Analysis: 后台统计分析页。

当前状态：

- Form Collection 已对齐 `CreateQuoteRequestRequest`，并提交到 `/api/quote-requests`。
- Quotation Dashboard 已对齐 `QuoteRequestListItemResponse` 和 `DashboardSummaryResponse`。
- Order Detail 已对齐 `QuoteRequestDetailResponse`，并接入认领、状态更新、编辑、备注和事件接口。
- Order Calculation 已对齐详情 DTO 回填字段。
- Data Analysis 已对齐 `DashboardSummaryResponse` 和 `DashboardAnalyticsResponse`。

## 2. 后端字段来源

以后端这些文件为准，不以前端已有假数据为准：

| 场景 | 后端文件 | 接口 |
| --- | --- | --- |
| 客户提交报价申请 | `dto/quote/CreateQuoteRequestRequest.java` | `POST /api/quote-requests` |
| 客户提交成功响应 | `dto/quote/CreateQuoteRequestResponse.java` | `POST /api/quote-requests` |
| 后台报价申请列表 | `dto/quote/QuoteRequestListItemResponse.java` | `GET /api/admin/quote-requests` |
| 后台报价申请详情 | `dto/quote/QuoteRequestDetailResponse.java` | `GET /api/admin/quote-requests/{id}` |
| 后台报价申请查询参数 | `dto/quote/QuoteRequestQueryRequest.java` | `GET /api/admin/quote-requests` |
| Dashboard 汇总 | `dto/dashboard/DashboardSummaryResponse.java` | `GET /api/admin/dashboard/summary` |
| Dashboard 分析 | `dto/dashboard/DashboardAnalyticsResponse.java` | `GET /api/admin/dashboard/analytics` |

## 3. 字段基线

### 3.1 创建 Quote Request 的公开提交字段

前端 Form Collection 只能提交这些字段：

| 字段 | 类型 | 前端页面位置 | 备注 |
| --- | --- | --- | --- |
| `customerName` | `String` | Customer | 必填，最多 100 |
| `email` | `String` | Customer | 必填，邮箱格式，最多 255 |
| `phone` | `String` | Customer | 最多 50 |
| `company` | `String` | Customer | 最多 150 |
| `acpCustomer` | `String` | Customer | 最多 150 |
| `projectDescription` | `String` | Customer | 必填 |
| `requestedDeliveryDate` | `LocalDate` | Shipping | 格式 `YYYY-MM-DD` |
| `cargoNature` | `String` | Cargo | 最多 255 |
| `commodity` | `String` | Cargo | 最多 150 |
| `volumeValue` | `BigDecimal` | Cargo | 非负数 |
| `volumeUnit` | `String` | Cargo | 最多 20 |
| `grossWeightValue` | `BigDecimal` | Cargo | 非负数 |
| `grossWeightUnit` | `String` | Cargo | 最多 20 |
| `rateValidity` | `String` | Rates | 后端是字符串，不要强制做日期类型 |
| `targetFreight` | `String` | Rates | 最多 100 |
| `paymentMode` | `String` | Rates | 最多 100 |
| `oceanSurcharges` | `String` | Rates | 长文本 |
| `trafficTerms` | `String` | Contract | 最多 100 |
| `bizNature` | `String` | Contract | 最多 100 |
| `soc` | `Boolean` | Contract | `true` / `false` / 不提交 |
| `remark` | `String` | Contract | 长文本 |

禁止前端提交这些后端维护字段：

- `id`
- `status`
- `ownerId`
- `owner`
- `claimedAt`
- `internalQuoteNo`
- `tradeCode`
- `filingNumber`
- `rawPayload`
- `createdAt`
- `updatedAt`
- `ownershipLabel`
- `actionPermissions`

### 3.2 列表字段

后台列表使用 `QuoteRequestListItemResponse`：

| 后端字段 | 当前前端旧字段 | 处理方式 |
| --- | --- | --- |
| `id` | 无 | 用作 row key 和详情查询 id |
| `internalQuoteNo` | `requestNo` | 替换旧字段 |
| `tradeCode` | `trade` | 替换旧字段 |
| `filingNumber` | 无 | 新增显示或详情展示 |
| `status` | `pending/completed` | 改为 `new/processing/confirmed` |
| `customerName` | `customer` / `contactName` | 统一改为 `customerName` |
| `email` | `email` | 保留 |
| `phone` | `phone` | 保留 |
| `company` | `customer` | 统一改为 `company` |
| `requestedDeliveryDate` | `requestedDeliveryDate` | 保留 |
| `commodity` | `commodity` | 保留 |
| `targetFreight` | `targetFreight` | 保留 |
| `owner` | `owner` 字符串 | 改为对象 `{ id, name, email }` |
| `claimedAt` | 无 | 新增 |
| `createdAt` | 无 | 新增 |
| `updatedAt` | 无 | 新增 |
| `ownershipLabel` | 无 | 新增 |
| `actionPermissions` | 无 | 控制按钮可见性和可用性 |

### 3.3 详情字段

后台详情使用 `QuoteRequestDetailResponse`，前端详情页必须按 section 读取：

```text
id
status
owner
claimedAt
customer.customerName
customer.email
customer.phone
customer.company
customer.acpCustomer
customer.projectDescription
shipping.internalQuoteNo
shipping.tradeCode
shipping.filingNumber
shipping.requestedDeliveryDate
cargo.cargoNature
cargo.commodity
cargo.volumeValue
cargo.volumeUnit
cargo.grossWeightValue
cargo.grossWeightUnit
rates.rateValidity
rates.targetFreight
rates.paymentMode
rates.oceanSurcharges
contract.trafficTerms
contract.bizNature
contract.soc
contract.remark
createdAt
updatedAt
ownershipLabel
actionPermissions
```

必须删除或停止使用这些旧字段：

- `requestNo`
- `customer`
- `contactName`
- `trade`
- `origin`
- `destination`
- `volume`
- `grossWeight`

后端当前没有 `origin` 和 `destination` 字段，前端不要继续展示这两个字段，除非后端新增。

### 3.4 Dashboard 字段

汇总接口 `DashboardSummaryResponse`：

```text
cards.total
cards.unassigned
cards.assigned
cards.mine
cards.statusCounts.newCount
cards.statusCounts.processingCount
cards.statusCounts.confirmedCount
cards.emailFailed
```

分析接口 `DashboardAnalyticsResponse`：

```text
statusDistribution[].status
statusDistribution[].count
dailySubmissions[].date
dailySubmissions[].count
salesClaimedRanking[].salesId
salesClaimedRanking[].salesName
salesClaimedRanking[].count
unassignedAging[].id
unassignedAging[].internalQuoteNo
unassignedAging[].customerName
unassignedAging[].company
unassignedAging[].createdAt
unassignedAging[].waitingHours
```

当前前端 `DataAnalysis` 的 `salesAmount`、`month`、销售额趋势是假数据，需要替换为后端统计语义。

## 4. 执行步骤

### Step 1: 建立前端接口层和字段模型

新增建议文件：

- `src/api/http.js`
- `src/api/quoteRequests.js`
- `src/api/dashboard.js`
- `src/constants/quoteRequest.js`

执行内容：

1. 建立统一 `request` 方法。
2. 自动读取登录后的 `accessToken` 并添加 `Authorization: Bearer <token>`。
3. 统一解析后端 `ApiResponse`。
4. 在 `src/constants/quoteRequest.js` 里定义：
   - `QUOTE_REQUEST_STATUSES = ['new', 'processing', 'confirmed']`
   - `QUOTE_REQUEST_STATUS_LABELS`
   - `OWNERSHIP_OPTIONS = ['all', 'unassigned', 'assigned', 'mine']`
   - `SORT_BY_OPTIONS = ['createdAt', 'updatedAt', 'requestedDeliveryDate', 'internalQuoteNo', 'customerName', 'status']`

验收标准：

- 所有页面不再直接写 `fetch('/api/...')`。
- 状态值不再出现 `pending`、`completed`。

### Step 2: 完成 Form Collection 收尾

目标文件：

- `src/pages/FormCollectionPage/FormCollection.jsx`

执行内容：

1. 保留 21 个公开提交字段白名单。
2. 确认 `rateValidity` 是字符串输入。
3. 提交成功后展示后端返回的：
   - `internalQuoteNo`
   - `tradeCode`
   - `filingNumber`
   - `status`
4. 提交失败时展示后端 `message`。

验收标准：

- Network 请求体只包含 `CreateQuoteRequestRequest` 字段。
- 不包含 `internalQuoteNo`、`status`、`owner` 等后端维护字段。

### Step 3: 对齐 Quotation Dashboard 列表

目标文件：

- `src/pages/Quotation/Quotation.jsx`
- `src/pages/Quotation/components/StatusTag.jsx`
- `src/pages/Quotation/components/MetricCard.jsx`

执行内容：

1. 删除 `recentRequests` 静态数据。
2. 页面加载时调用 `GET /api/admin/quote-requests`。
3. 查询参数对齐：
   - `status`
   - `ownership`
   - `ownerId`
   - `keyword`
   - `dateFrom`
   - `dateTo`
   - `page`
   - `pageSize`
   - `sortBy`
   - `sortOrder`
4. 表格列改为后端列表字段：
   - `internalQuoteNo`
   - `customerName`
   - `company`
   - `status`
   - `owner.name`
   - `ownershipLabel`
   - `requestedDeliveryDate`
   - `createdAt`
5. 顶部指标卡调用 `GET /api/admin/dashboard/summary`：
   - Total
   - Unassigned
   - Mine
   - Processing
6. 根据 `actionPermissions` 控制行内操作按钮：
   - `canClaim`
   - `canEdit`
   - `canUpdateStatus`
   - `canAddNote`

验收标准：

- 列表不再使用 `requestNo/customer/trade`。
- 状态筛选只使用 `new/processing/confirmed`。
- 表格分页来自后端 `PageResponse`。

### Step 4: 对齐 Order Detail 详情抽屉

目标文件：

- `src/pages/Quotation/components/RequestDetailDrawer.jsx`

执行内容：

1. 点击列表行时用 `id` 调用 `GET /api/admin/quote-requests/{id}`。
2. 详情展示改为后端 section：
   - Customer Information: `detail.customer`
   - Shipping Information: `detail.shipping`
   - Cargo Information: `detail.cargo`
   - Rates Information: `detail.rates`
   - Contract Information: `detail.contract`
   - System Information: `status`、`owner`、`claimedAt`、`createdAt`、`updatedAt`
3. 删除旧字段展示：
   - `origin`
   - `destination`
   - `trade`
   - `volume`
   - `grossWeight`
4. `volumeValue + volumeUnit` 只在展示层组合，不作为数据字段保存。
5. `grossWeightValue + grossWeightUnit` 只在展示层组合，不作为数据字段保存。
6. `Calculate Quote` 按钮写入计算器 draft 时，从详情 section 扁平化成计算器字段。

验收标准：

- 抽屉不再直接读取列表旧字段。
- 刷新列表后点击任意行都能基于后端详情 DTO 展示。

### Step 5: 对齐 Claim、Status、Edit、Notes 操作字段

目标文件：

- `src/pages/Quotation/Quotation.jsx`
- `src/pages/Quotation/components/RequestDetailDrawer.jsx`
- 可新增 `src/pages/Quotation/components/QuoteRequestEditForm.jsx`
- 可新增 `src/pages/Quotation/components/QuoteRequestNotes.jsx`

执行内容：

1. 认领接口：`POST /api/admin/quote-requests/{id}/claim`。
2. 状态更新接口：`PATCH /api/admin/quote-requests/{id}/status`。
   - 请求体字段：`status`、`message`
3. 业务字段编辑接口：`PATCH /api/admin/quote-requests/{id}`。
   - 请求体字段使用 `UpdateQuoteRequestRequest`
   - 字段集合与公开创建字段基本一致，但都不是必填
4. 添加备注接口：`POST /api/admin/quote-requests/{id}/notes`。
   - 请求体字段是 `note`
   - 不要使用文档示例里的 `content`
5. 备注列表接口：`GET /api/admin/quote-requests/{id}/notes`。
6. 事件时间线接口：`GET /api/admin/quote-requests/{id}/events`。

验收标准：

- 所有按钮由 `actionPermissions` 控制。
- 添加备注请求体使用 `{ "note": "..." }`。
- 状态流转只允许后端支持的状态。

### Step 6: 对齐 Order Calculation

目标文件：

- `src/pages/Calculator/Calculator.jsx`

执行内容：

1. 计算器输入字段与 `QuoteRequestDetailResponse` 详情字段保持兼容。
2. 从订单详情进入计算器时，draft 字段使用同一套扁平结构：
   - `customerName`
   - `email`
   - `phone`
   - `company`
   - `acpCustomer`
   - `projectDescription`
   - `requestedDeliveryDate`
   - `cargoNature`
   - `commodity`
   - `volumeValue`
   - `volumeUnit`
   - `grossWeightValue`
   - `grossWeightUnit`
   - `rateValidity`
   - `targetFreight`
   - `paymentMode`
   - `oceanSurcharges`
   - `trafficTerms`
   - `bizNature`
   - `soc`
   - `remark`
3. `rateValidity` 改为字符串输入，不再强制使用 `DatePicker`。
4. 页面明确标注当前计算逻辑是前端估算草稿，不写回后端，除非后端新增报价保存接口。
5. 删除对旧字段 `trade/origin/destination/volume/grossWeight` 的依赖。

验收标准：

- 从订单详情跳转计算器后，所有可用字段能正确回填。
- 计算器不依赖后端不存在的字段。

### Step 7: 对齐 Data Analysis

目标文件：

- `src/pages/DataAnalysis/DataAnalysis.jsx`

执行内容：

1. 删除销售额假数据：
   - `salesTrendData`
   - `salespersonShareData`
   - `salesAmount`
2. 页面加载时调用：
   - `GET /api/admin/dashboard/summary`
   - `GET /api/admin/dashboard/analytics`
3. 指标卡改为：
   - Total Requests
   - Unassigned
   - Assigned
   - Mine
   - New
   - Processing
   - Confirmed
   - Email Failed
4. 图表改为：
   - Status Distribution: 使用 `statusDistribution`
   - Daily Submissions: 使用 `dailySubmissions`
   - Sales Claimed Ranking: 使用 `salesClaimedRanking`
   - Unassigned Aging: 使用表格展示 `unassignedAging`

验收标准：

- 页面不再展示 Sales Amount。
- 所有统计字段来自后端 Dashboard DTO。

### Step 8: 全局清理旧字段

执行命令：

```bash
rg -n "requestNo|contactName|origin|destination|grossWeight\\b|volume\\b|pending|completed|salesAmount" src
```

处理规则：

- 如果是旧订单字段，删除或改成后端字段。
- 如果是展示层临时组合字段，必须只在局部函数内存在，不能作为接口字段。
- 如果是状态文案，改为 `new/processing/confirmed` 的 label 映射。

验收标准：

- `src/pages/Quotation` 不再出现旧字段。
- `src/pages/Calculator` 不再读取旧订单字段。
- `src/pages/DataAnalysis` 不再出现 `salesAmount` 假数据。

### Step 9: 联调验证

前置条件：

1. 后端启动在 `http://localhost:8080`。
2. 前端 Vite proxy 已配置 `/api -> http://localhost:8080`。
3. 登录接口可返回 `accessToken`。

验证路径：

1. 打开 Form Collection。
2. 提交一条客户报价申请。
3. 确认提交响应包含：
   - `quoteRequestId`
   - `internalQuoteNo`
   - `tradeCode`
   - `filingNumber`
   - `status = new`
4. 登录后台。
5. 打开 Quotation Dashboard。
6. 确认新订单出现在列表中。
7. 打开订单详情。
8. 认领订单。
9. 确认状态变为 `processing` 且 `owner` 有值。
10. 添加备注。
11. 更新状态为 `confirmed`。
12. 打开 Data Analysis，确认统计数量变化。
13. 从订单详情进入 Calculator，确认字段可回填。

## 5. 最终验收清单

- [x] Form Collection 请求体只包含公开创建字段。
- [x] Quotation Dashboard 使用后端列表接口。
- [x] Quotation Dashboard 状态值为 `new/processing/confirmed`。
- [x] Order Detail 使用后端详情接口和 section 字段。
- [x] Order Detail 不再展示后端不存在的 `origin/destination`。
- [x] Claim、Status、Edit、Notes 都使用后端接口。
- [x] Notes 请求体使用 `note` 字段。
- [x] Calculator 从详情 DTO 正确回填字段。
- [x] Calculator 不依赖旧字段。
- [x] Data Analysis 使用 Dashboard summary 和 analytics 接口。
- [x] 前端全局没有旧字段残留。
- [x] `npm run lint` 通过。
- [x] `npm run build` 通过。

## 6. 推荐执行顺序

按联调主链路优先：

1. 接口层和常量。
2. Quotation Dashboard 列表。
3. Order Detail 详情。
4. Claim、Status、Notes 操作。
5. Calculator 字段回填。
6. Data Analysis 统计页。
7. 全局旧字段清理。
8. 完整联调验收。
