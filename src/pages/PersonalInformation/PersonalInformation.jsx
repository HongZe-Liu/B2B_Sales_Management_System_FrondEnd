import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalculatorOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Descriptions, Table, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../../api/auth.js'
import { listQuoteRequests } from '../../api/quoteRequests.js'
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout.jsx'
import RequestDetailDrawer from '../Quotation/components/RequestDetailDrawer.jsx'
import './PersonalInformation.css'

const { Title, Text } = Typography

function getFollowUpColumns(onOpenCustomer) {
  return [
    {
      title: 'Internal Quote No.',
      dataIndex: 'internalQuoteNo',
      key: 'internalQuoteNo',
      render: (internalQuoteNo, record) => (
        <Button
          className="personal-follow-up__quote-button"
          type="link"
          onClick={(event) => {
            event.stopPropagation()
            onOpenCustomer(record.id)
          }}
        >
          {internalQuoteNo || '-'}
        </Button>
      ),
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (customerName) => customerName || '-',
    },
  ]
}

function PersonalInformation() {
  const navigate = useNavigate()
  const currentUser = getStoredUser()
  const [followUpCustomers, setFollowUpCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const followUpColumns = useMemo(
    () => getFollowUpColumns(setSelectedRequestId),
    [],
  )

  const loadFollowUpCustomers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await listQuoteRequests({
        ownership: 'mine',
        page: 1,
        pageSize: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })

      setFollowUpCustomers(data?.items || [])
    } catch (nextError) {
      setError(nextError.message)
      setFollowUpCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadFollowUpCustomers)
  }, [loadFollowUpCustomers])

  return (
    <DashboardLayout selectedKey="profile" userName={currentUser?.name || 'Sales'}>
      <main className="dashboard-page">
        <header className="dashboard-page__header">
          <div>
            <Title level={2} className="dashboard-page__title">
              Personal information
            </Title>
            <Text className="dashboard-page__description">
              Manage account profile and basic user information.
            </Text>
          </div>
        </header>

        <Card className="dashboard-section" title="Profile">
          <Descriptions
            column={1}
            items={[
              {
                key: 'name',
                label: 'Name',
                children: currentUser?.name || '-',
              },
              {
                key: 'role',
                label: 'Role',
                children: currentUser?.role || '-',
              },
              {
                key: 'email',
                label: 'Email',
                children: currentUser?.email || '-',
              },
            ]}
          />
        </Card>

        <Card
          className="dashboard-section"
          extra={
            <Button
              icon={<CalculatorOutlined />}
              type="primary"
              onClick={() => navigate('/dashboard/calculator')}
            >
              Calculator
            </Button>
          }
          title="My Follow-up Customers"
        >
          {error ? (
            <Alert
              className="personal-follow-up__alert"
              message={error}
              showIcon
              type="error"
            />
          ) : null}

          <Table
            columns={followUpColumns}
            dataSource={followUpCustomers}
            loading={loading}
            locale={{
              emptyText: 'You have not claimed any customers yet.',
            }}
            pagination={false}
            rowKey="id"
            rowClassName="personal-follow-up__row"
            scroll={{ x: 520 }}
            onRow={(record) => ({
              onClick: () => setSelectedRequestId(record.id),
            })}
          />
        </Card>

        <RequestDetailDrawer
          open={Boolean(selectedRequestId)}
          requestId={selectedRequestId}
          onChanged={loadFollowUpCustomers}
          onClose={() => setSelectedRequestId(null)}
        />
      </main>
    </DashboardLayout>
  )
}

export default PersonalInformation
