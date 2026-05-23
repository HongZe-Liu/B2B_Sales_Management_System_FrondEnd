import { useEffect, useState } from 'react'
import { Column, Pie } from '@ant-design/plots'
import { Alert, Button, Card, Col, Row, Statistic, Table, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { getDashboardAnalytics, getDashboardSummary } from '../../api/dashboard.js'
import { QUOTE_REQUEST_STATUS_MAP } from '../../constants/quoteRequest.js'
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout.jsx'
import './DataAnalysis.css'

const { Title, Text } = Typography

function statusLabel(status) {
  return QUOTE_REQUEST_STATUS_MAP[status]?.text || status || '-'
}

function formatDateTime(value) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

function normalizeStatusDistribution(items = []) {
  return items.map((item) => ({
    ...item,
    statusLabel: statusLabel(item.status),
  }))
}

const agingColumns = [
  {
    title: 'Internal Quote No.',
    dataIndex: 'internalQuoteNo',
    key: 'internalQuoteNo',
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Company',
    dataIndex: 'company',
    key: 'company',
    render: (company) => company || '-',
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: formatDateTime,
  },
  {
    title: 'Waiting Hours',
    dataIndex: 'waitingHours',
    key: 'waitingHours',
    align: 'right',
  },
]

function DataAnalysis() {
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cards = summary?.cards || {}
  const statusCounts = cards.statusCounts || {}
  const statusDistribution = normalizeStatusDistribution(
    analytics?.statusDistribution,
  )

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const [nextSummary, nextAnalytics] = await Promise.all([
        getDashboardSummary(),
        getDashboardAnalytics(),
      ])

      setSummary(nextSummary)
      setAnalytics(nextAnalytics)
    } catch (nextError) {
      setError(nextError.message)
      setSummary(null)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadDashboard)
  }, [])

  const statusDistributionConfig = {
    data: statusDistribution,
    angleField: 'count',
    colorField: 'statusLabel',
    height: 320,
    label: {
      text: 'statusLabel',
      position: 'outside',
    },
    legend: {
      color: {
        position: 'bottom',
      },
    },
  }
  const dailySubmissionsConfig = {
    data: analytics?.dailySubmissions || [],
    xField: 'date',
    yField: 'count',
    height: 320,
    style: {
      inset: 5,
    },
  }
  const salesClaimedRankingConfig = {
    data: analytics?.salesClaimedRanking || [],
    xField: 'salesName',
    yField: 'count',
    height: 320,
    style: {
      inset: 5,
    },
  }

  return (
    <DashboardLayout selectedKey="data-analysis" userName="Helen Zhang">
      <main className="dashboard-page">
        <header className="dashboard-page__header">
          <div>
            <Title level={2} className="dashboard-page__title">
              Data analysis
            </Title>
            <Text className="dashboard-page__description">
              Review quote request status, daily submissions, ownership, and
              public pool aging from backend dashboard APIs.
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={loadDashboard}
          >
            Refresh
          </Button>
        </header>

        {error ? <Alert message={error} showIcon type="error" /> : null}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic title="Total Requests" value={cards.total || 0} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic title="Unassigned" value={cards.unassigned || 0} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic title="Assigned" value={cards.assigned || 0} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic title="Mine" value={cards.mine || 0} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic title="New" value={statusCounts.new || 0} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic
                title="Processing"
                value={statusCounts.processing || 0}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic
                title="Confirmed"
                value={statusCounts.confirmed || 0}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="dashboard-section" loading={loading}>
              <Statistic title="Email Failed" value={cards.emailFailed || 0} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              className="dashboard-section data-analysis-chart-card"
              loading={loading}
              title="Status Distribution"
            >
              <Pie {...statusDistributionConfig} />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              className="dashboard-section data-analysis-chart-card"
              loading={loading}
              title="Daily Submissions"
            >
              <Column {...dailySubmissionsConfig} />
            </Card>
          </Col>
        </Row>

        <Card
          className="dashboard-section data-analysis-chart-card"
          loading={loading}
          title="Sales Claimed Ranking"
        >
          <Column {...salesClaimedRankingConfig} />
        </Card>

        <Card
          className="dashboard-section"
          loading={loading}
          title="Unassigned Aging"
        >
          <Table
            columns={agingColumns}
            dataSource={analytics?.unassignedAging || []}
            pagination={false}
            rowKey="id"
            scroll={{ x: 760 }}
          />
        </Card>
      </main>
    </DashboardLayout>
  )
}

export default DataAnalysis
