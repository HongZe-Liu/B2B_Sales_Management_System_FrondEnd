import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClockCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  InboxOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  QRCode,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../../api/dashboard.js'
import { listQuoteRequests } from '../../api/quoteRequests.js'
import {
  OWNERSHIP_OPTIONS,
  QUOTE_REQUEST_STATUS_OPTIONS,
} from '../../constants/quoteRequest.js'
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout.jsx'
import MetricCard from './components/MetricCard.jsx'
import RequestDetailDrawer from './components/RequestDetailDrawer.jsx'
import StatusTag from './components/StatusTag.jsx'
import './Quotation.css'

const { Title, Text } = Typography
const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
}
const CONFIGURED_PUBLIC_FORM_ORIGIN = import.meta.env.VITE_PUBLIC_FORM_ORIGIN
const PUBLIC_FORM_ORIGIN_KEY = 'publicFormOrigin'
const PUBLIC_FORM_PATH = '/#/form-collection'
const DASHBOARD_LOGIN_PATH = '/#/login'

function formatDateTime(value) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

function ownerName(owner) {
  return owner?.name || 'Unassigned'
}

function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin)
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1'
  } catch {
    return false
  }
}

function normalizeOrigin(value) {
  const trimmedValue = value.trim().replace(/\/+$/, '')
  const origin = /^https?:\/\//.test(trimmedValue)
    ? trimmedValue
    : `http://${trimmedValue}`

  return new URL(origin).origin
}

function buildPublicFormUrl(origin) {
  return `${origin}${PUBLIC_FORM_PATH}`
}

function buildDashboardLoginUrl(origin) {
  return `${origin}${DASHBOARD_LOGIN_PATH}`
}

function getConfiguredPublicFormOrigin() {
  if (!CONFIGURED_PUBLIC_FORM_ORIGIN) {
    return ''
  }

  try {
    return normalizeOrigin(CONFIGURED_PUBLIC_FORM_ORIGIN)
  } catch {
    return ''
  }
}

function getInitialPublicFormOrigin() {
  const configuredOrigin = getConfiguredPublicFormOrigin()
  const storedOrigin = localStorage.getItem(PUBLIC_FORM_ORIGIN_KEY)

  if (storedOrigin) {
    return storedOrigin
  }

  if (configuredOrigin) {
    return configuredOrigin
  }

  return window.location.origin
}

// 表格列配置：字段来自后端 QuoteRequestListItemResponse。
function getColumns(onOpenRequest) {
  return [
    {
      title: 'Internal Quote No.',
      dataIndex: 'internalQuoteNo',
      key: 'internalQuoteNo',
      sorter: true,
      render: (internalQuoteNo, record) => (
        <Button
          className="quotation-table__detail-button"
          type="link"
          onClick={(event) => {
            event.stopPropagation()
            onOpenRequest(record.id)
          }}
        >
          {internalQuoteNo || '-'}
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      render: (status) => <StatusTag value={status} />,
    },
    {
      title: 'Owner Ownership',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner, record) => (
        <div className="quotation-table__ownership">
          <span>{ownerName(owner)}</span>
          <Text type="secondary">{record.ownershipLabel || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: formatDateTime,
    },
  ]
}

function Quotation() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState()
  const [selectedOwnership, setSelectedOwnership] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [publicFormOrigin, setPublicFormOrigin] = useState(getInitialPublicFormOrigin)
  const [publicFormOriginDraft, setPublicFormOriginDraft] = useState(
    getInitialPublicFormOrigin,
  )
  const columns = useMemo(() => getColumns(setSelectedRequestId), [])
  const publicFormUrl = useMemo(
    () => buildPublicFormUrl(publicFormOrigin),
    [publicFormOrigin],
  )
  const dashboardLoginUrl = useMemo(
    () => buildDashboardLoginUrl(publicFormOrigin),
    [publicFormOrigin],
  )
  const cards = summary?.cards || {}
  const statusCounts = cards.statusCounts || {}

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await listQuoteRequests({
        status: selectedStatus,
        ownership: selectedOwnership,
        keyword,
        page,
        pageSize,
        sortBy,
        sortOrder,
      })

      setRequests(data?.items || [])
      setPagination(data?.pagination || DEFAULT_PAGINATION)
    } catch (nextError) {
      setError(nextError.message)
      setRequests([])
      setPagination(DEFAULT_PAGINATION)
    } finally {
      setLoading(false)
    }
  }, [
    keyword,
    page,
    pageSize,
    selectedOwnership,
    selectedStatus,
    sortBy,
    sortOrder,
  ])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)

    try {
      setSummary(await getDashboardSummary())
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadRequests)
  }, [loadRequests, refreshKey])

  useEffect(() => {
    Promise.resolve().then(loadSummary)
  }, [loadSummary, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((currentKey) => currentKey + 1)
  }

  const handleTableChange = (nextPagination, _, sorter) => {
    setPage(nextPagination.current || 1)
    setPageSize(nextPagination.pageSize || 20)

    if (sorter?.field) {
      setSortBy(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc')
    }
  }

  const handleFilterChange = (updater) => {
    updater()
    setPage(1)
  }

  const handleCopyPublicFormUrl = async () => {
    await navigator.clipboard.writeText(publicFormUrl)
    message.success('Form link copied')
  }

  const handleCopyDashboardLoginUrl = async () => {
    await navigator.clipboard.writeText(dashboardLoginUrl)
    message.success('Dashboard login link copied')
  }

  const handleSavePublicFormOrigin = () => {
    try {
      const nextOrigin = normalizeOrigin(publicFormOriginDraft)

      localStorage.setItem(PUBLIC_FORM_ORIGIN_KEY, nextOrigin)
      setPublicFormOrigin(nextOrigin)
      setPublicFormOriginDraft(nextOrigin)
      message.success('QR code address updated')
    } catch {
      message.error('Please enter a valid address, for example http://192.168.1.25:5173')
    }
  }

  const handleResetPublicFormOrigin = () => {
    localStorage.removeItem(PUBLIC_FORM_ORIGIN_KEY)
    setPublicFormOrigin(window.location.origin)
    setPublicFormOriginDraft(window.location.origin)
  }

  return (
    <DashboardLayout
      selectedKey="quotation"
      userName="Helen Zhang"
    >
      <main className="dashboard-page">
        {/* 页面头部：标题、说明和右上角操作。 */}
        <header className="dashboard-page__header">
          <div>
            <Title level={2} className="dashboard-page__title">
              Quotation
            </Title>
            <Text className="dashboard-page__description">
              Track quote requests from the backend public pool and sales
              workflow.
            </Text>
          </div>

          <Space className="dashboard-page__actions" wrap>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => setQrModalOpen(true)}
            >
              QR Codes
            </Button>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => navigate('/form-collection')}
            >
              New Request
            </Button>
          </Space>
        </header>

        <div className="dashboard-metrics">
          <MetricCard
            extra="All quote requests"
            icon={<FileTextOutlined />}
            title="Total Requests"
            value={cards.total || 0}
          />
          <MetricCard
            extra="Public pool"
            icon={<InboxOutlined />}
            loading={summaryLoading}
            title="Unassigned"
            value={cards.unassigned || 0}
          />
          <MetricCard
            extra="Current user"
            icon={<DashboardOutlined />}
            tone="green"
            title="Mine"
            value={cards.mine || 0}
          />
          <MetricCard
            extra="In progress"
            icon={<ClockCircleOutlined />}
            tone="gold"
            title="Processing"
            value={statusCounts.processing || 0}
          />
        </div>

        <Card
          className="dashboard-section"
          title="Quote Requests"
        >
          {error ? (
            <Alert
              className="dashboard-table-toolbar"
              message={error}
              showIcon
              type="error"
            />
          ) : null}

          <Space className="dashboard-table-toolbar" wrap>
            <Select
              allowClear
              className="dashboard-table-toolbar__select"
              onChange={(value) =>
                handleFilterChange(() => setSelectedStatus(value))
              }
              options={QUOTE_REQUEST_STATUS_OPTIONS}
              placeholder="Status"
              value={selectedStatus}
            />
            <Select
              className="dashboard-table-toolbar__select"
              onChange={(value) =>
                handleFilterChange(() => setSelectedOwnership(value))
              }
              options={OWNERSHIP_OPTIONS}
              placeholder="Ownership"
              value={selectedOwnership}
            />
            <Input.Search
              allowClear
              className="dashboard-table-toolbar__search"
              onSearch={(value) => handleFilterChange(() => setKeyword(value))}
              placeholder="Search quote no, customer, company"
            />
          </Space>

          <Table
            columns={columns}
            dataSource={requests}
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              total: pagination.totalItems,
            }}
            rowClassName="quotation-table__row"
            rowKey="id"
            scroll={{ x: 760 }}
            onChange={handleTableChange}
            onRow={(record) => ({
              onClick: () => setSelectedRequestId(record.id),
            })}
          />
        </Card>

        <RequestDetailDrawer
          open={Boolean(selectedRequestId)}
          requestId={selectedRequestId}
          onChanged={handleRefresh}
          onClose={() => setSelectedRequestId(null)}
        />

        <Modal
          footer={[
            <Button key="copy-form" onClick={handleCopyPublicFormUrl}>
              Copy Form Link
            </Button>,
            <Button key="copy-login" onClick={handleCopyDashboardLoginUrl}>
              Copy Login Link
            </Button>,
            <Button key="save" onClick={handleSavePublicFormOrigin}>
              Update QR Code
            </Button>,
            <Button
              key="close"
              type="primary"
              onClick={() => setQrModalOpen(false)}
            >
              Close
            </Button>,
          ]}
          open={qrModalOpen}
          title="QR Codes"
          onCancel={() => setQrModalOpen(false)}
        >
          <div className="quotation-form-qr">
            {isLocalOrigin(publicFormOrigin) ? (
              <Alert
                message="This QR code uses a local computer address. For phone testing, enter your computer LAN address below."
                showIcon
                type="warning"
              />
            ) : null}
            <div className="quotation-form-qr__codes">
              <div className="quotation-form-qr__code">
                <Text strong>Customer Form</Text>
                <QRCode size={200} value={publicFormUrl} />
                <Text className="quotation-form-qr__link" copyable>
                  {publicFormUrl}
                </Text>
              </div>
              <div className="quotation-form-qr__code">
                <Text strong>Dashboard Login</Text>
                <QRCode size={200} value={dashboardLoginUrl} />
                <Text className="quotation-form-qr__link" copyable>
                  {dashboardLoginUrl}
                </Text>
              </div>
            </div>
            <Input
              addonAfter={PUBLIC_FORM_PATH}
              className="quotation-form-qr__origin-input"
              onChange={(event) => setPublicFormOriginDraft(event.target.value)}
              placeholder="http://192.168.1.25:5173"
              value={publicFormOriginDraft}
            />
            <Button type="link" onClick={handleResetPublicFormOrigin}>
              Use current browser address
            </Button>
          </div>
        </Modal>
      </main>
    </DashboardLayout>
  )
}

export default Quotation
