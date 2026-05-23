import { useEffect, useState } from 'react'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Descriptions, Row, Statistic, Typography } from 'antd'
import { listEmailLogs } from '../../api/emailLogs.js'
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout.jsx'
import './Admin.css'

const { Title, Text } = Typography

function formatDateTime(value) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

function getLatestEmailTime(page) {
  const latestLog = page?.items?.[0]

  return latestLog?.sentAt || latestLog?.createdAt || latestLog?.updatedAt || null
}

function Admin() {
  const [metrics, setMetrics] = useState({
    userCount: null,
    emailSent: 0,
    emailFailed: 0,
    latestSentAt: null,
    latestFailedAt: null,
    refreshedAt: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadMetrics = async () => {
    setLoading(true)
    setError('')

    try {
      const [sentPage, failedPage] = await Promise.all([
        listEmailLogs({ status: 'sent', page: 1, pageSize: 1 }),
        listEmailLogs({ status: 'failed', page: 1, pageSize: 1 }),
      ])

      setMetrics({
        userCount: null,
        emailSent: sentPage?.pagination?.totalItems || 0,
        emailFailed: failedPage?.pagination?.totalItems || 0,
        latestSentAt: getLatestEmailTime(sentPage),
        latestFailedAt: getLatestEmailTime(failedPage),
        refreshedAt: new Date().toISOString(),
      })
    } catch (nextError) {
      setError(nextError.message)
      setMetrics((currentMetrics) => ({
        ...currentMetrics,
        emailSent: 0,
        emailFailed: 0,
        latestSentAt: null,
        latestFailedAt: null,
        refreshedAt: new Date().toISOString(),
      }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadMetrics)
  }, [])

  return (
    <DashboardLayout selectedKey="admin" title="Admin Console">
      <main className="dashboard-page">
        <header className="dashboard-page__header">
          <div>
            <Title level={2} className="dashboard-page__title">
              Admin Console
            </Title>
            <Text className="dashboard-page__description">
              Monitor current users and email notification delivery status.
            </Text>
          </div>

          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadMetrics}>
            Refresh
          </Button>
        </header>

        {error ? <Alert message={error} showIcon type="error" /> : null}

        <Alert
          message="User count requires a backend admin user summary API. It is not available in the current backend endpoints yet."
          showIcon
          type="info"
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="dashboard-section admin-metric-card" loading={loading}>
              <div className="admin-metric-card__icon admin-metric-card__icon--users">
                <TeamOutlined />
              </div>
              <Statistic
                title="Current Users"
                value={metrics.userCount ?? '-'}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="dashboard-section admin-metric-card" loading={loading}>
              <div className="admin-metric-card__icon admin-metric-card__icon--sent">
                <CheckCircleOutlined />
              </div>
              <Statistic
                title="Email Notifications Sent"
                value={metrics.emailSent}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="dashboard-section admin-metric-card" loading={loading}>
              <div className="admin-metric-card__icon admin-metric-card__icon--failed">
                <CloseCircleOutlined />
              </div>
              <Statistic
                title="Email Notifications Failed"
                value={metrics.emailFailed}
              />
            </Card>
          </Col>
        </Row>

        <Card className="dashboard-section" loading={loading} title="Metric Time">
          <Descriptions
            column={1}
            items={[
              {
                key: 'latestSentAt',
                label: 'Latest Successful Email Time',
                children: formatDateTime(metrics.latestSentAt),
              },
              {
                key: 'latestFailedAt',
                label: 'Latest Failed Email Time',
                children: formatDateTime(metrics.latestFailedAt),
              },
              {
                key: 'refreshedAt',
                label: 'Statistics Refreshed At',
                children: (
                  <>
                    <ClockCircleOutlined className="admin-time-icon" />{' '}
                    {formatDateTime(metrics.refreshedAt)}
                  </>
                ),
              },
            ]}
          />
        </Card>
      </main>
    </DashboardLayout>
  )
}

export default Admin
