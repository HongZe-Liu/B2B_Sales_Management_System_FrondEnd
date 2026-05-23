import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { CalculatorOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Timeline,
  Typography,
  message,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  addQuoteRequestNote,
  claimQuoteRequest,
  getQuoteRequestDetail,
  listQuoteRequestEvents,
  listQuoteRequestNotes,
  updateQuoteRequest,
  updateQuoteRequestStatus,
} from '../../../api/quoteRequests.js'
import {
  QUOTE_REQUEST_FIELD_NAMES,
  QUOTE_REQUEST_STATUS_OPTIONS,
} from '../../../constants/quoteRequest.js'
import StatusTag from './StatusTag.jsx'

const { Text } = Typography
const { TextArea } = Input
const CALCULATOR_DRAFT_KEY = 'orderCalculatorDraft'

function displayValue(value) {
  return value === undefined || value === null || value === '' ? '-' : value
}

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

function formatDateTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function formatQuantity(value, unit) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return `${value} ${unit || ''}`.trim()
}

function formatSoc(value) {
  if (value === true) {
    return 'Yes'
  }

  if (value === false) {
    return 'No'
  }

  return '-'
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

function flattenDetail(detail) {
  return {
    customerName: detail?.customer?.customerName,
    email: detail?.customer?.email,
    phone: detail?.customer?.phone,
    company: detail?.customer?.company,
    acpCustomer: detail?.customer?.acpCustomer,
    projectDescription: detail?.customer?.projectDescription,
    requestedDeliveryDate: detail?.shipping?.requestedDeliveryDate
      ? dayjs(detail.shipping.requestedDeliveryDate)
      : null,
    cargoNature: detail?.cargo?.cargoNature,
    commodity: detail?.cargo?.commodity,
    volumeValue: detail?.cargo?.volumeValue,
    volumeUnit: detail?.cargo?.volumeUnit,
    grossWeightValue: detail?.cargo?.grossWeightValue,
    grossWeightUnit: detail?.cargo?.grossWeightUnit,
    rateValidity: detail?.rates?.rateValidity,
    targetFreight: detail?.rates?.targetFreight,
    paymentMode: detail?.rates?.paymentMode,
    oceanSurcharges: detail?.rates?.oceanSurcharges,
    trafficTerms: detail?.contract?.trafficTerms,
    bizNature: detail?.contract?.bizNature,
    soc: detail?.contract?.soc ?? 'unknown',
    remark: detail?.contract?.remark,
  }
}

function buildUpdatePayload(values) {
  const normalizedValues = {
    ...values,
    requestedDeliveryDate: values.requestedDeliveryDate
      ? values.requestedDeliveryDate.format('YYYY-MM-DD')
      : undefined,
    soc: values.soc === 'unknown' ? undefined : values.soc,
  }

  return Object.fromEntries(
    QUOTE_REQUEST_FIELD_NAMES.map((fieldName) => [
      fieldName,
      normalizeString(normalizedValues[fieldName]),
    ]).filter(([, value]) => value !== undefined && value !== null),
  )
}

function buildCalculatorDraft(detail) {
  return {
    ...flattenDetail(detail),
    requestedDeliveryDate: detail?.shipping?.requestedDeliveryDate,
    rateValidity: detail?.rates?.rateValidity,
    soc: detail?.contract?.soc ?? 'unknown',
  }
}

// 报价请求详情抽屉：按后端 QuoteRequestDetailResponse section 展示。
function RequestDetailDrawer({ requestId, open, onClose, onChanged }) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [notes, setNotes] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [note, setNote] = useState('')
  const [targetStatus, setTargetStatus] = useState()
  const [statusMessage, setStatusMessage] = useState('')
  const [form] = Form.useForm()

  const loadDetail = useCallback(async () => {
    if (!open || !requestId) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const [nextDetail, noteList, eventList] = await Promise.all([
        getQuoteRequestDetail(requestId),
        listQuoteRequestNotes(requestId),
        listQuoteRequestEvents(requestId),
      ])

      setDetail(nextDetail)
      setNotes(noteList?.items || [])
      setEvents(eventList?.items || [])
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }, [open, requestId])

  useEffect(() => {
    Promise.resolve().then(loadDetail)
  }, [loadDetail])

  const permissions = detail?.actionPermissions || {}

  const resetLocalState = () => {
    setDetail(null)
    setNotes([])
    setEvents([])
    setError('')
    setEditOpen(false)
    setNote('')
    setTargetStatus()
    setStatusMessage('')
  }

  const handleClose = () => {
    resetLocalState()
    onClose?.()
  }

  const handleClaim = async () => {
    setActionLoading(true)

    try {
      await claimQuoteRequest(requestId)
      message.success('Quote request claimed')
      await loadDetail()
      onChanged?.()
    } catch (nextError) {
      message.error(nextError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!targetStatus) {
      message.warning('Please select a target status')
      return
    }

    setActionLoading(true)

    try {
      await updateQuoteRequestStatus(requestId, {
        status: targetStatus,
        message: normalizeString(statusMessage),
      })
      message.success('Status updated')
      setTargetStatus()
      setStatusMessage('')
      await loadDetail()
      onChanged?.()
    } catch (nextError) {
      message.error(nextError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddNote = async () => {
    const cleanNote = note.trim()

    if (!cleanNote) {
      message.warning('Please enter a note')
      return
    }

    setActionLoading(true)

    try {
      await addQuoteRequestNote(requestId, cleanNote)
      message.success('Note added')
      setNote('')
      await loadDetail()
      onChanged?.()
    } catch (nextError) {
      message.error(nextError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenEdit = () => {
    form.setFieldsValue(flattenDetail(detail))
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    const values = await form.validateFields()

    setActionLoading(true)

    try {
      const updatedDetail = await updateQuoteRequest(
        requestId,
        buildUpdatePayload(values),
      )
      setDetail(updatedDetail)
      setEditOpen(false)
      message.success('Quote request updated')
      onChanged?.()
    } catch (nextError) {
      message.error(nextError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenCalculator = () => {
    sessionStorage.setItem(
      CALCULATOR_DRAFT_KEY,
      JSON.stringify(buildCalculatorDraft(detail)),
    )

    handleClose()
    navigate('/dashboard/calculator')
  }

  const customerItems = [
    {
      key: 'customerName',
      label: 'Customer Name',
      children: displayValue(detail?.customer?.customerName),
    },
    {
      key: 'email',
      label: 'Email',
      children: displayValue(detail?.customer?.email),
    },
    {
      key: 'phone',
      label: 'Phone',
      children: displayValue(detail?.customer?.phone),
    },
    {
      key: 'company',
      label: 'Company',
      children: displayValue(detail?.customer?.company),
    },
    {
      key: 'acpCustomer',
      label: 'ACP Customer',
      children: displayValue(detail?.customer?.acpCustomer),
    },
    {
      key: 'projectDescription',
      label: 'Project Description',
      children: displayValue(detail?.customer?.projectDescription),
    },
  ]
  const shippingItems = [
    {
      key: 'internalQuoteNo',
      label: 'Internal Quote No.',
      children: displayValue(detail?.shipping?.internalQuoteNo),
    },
    {
      key: 'tradeCode',
      label: 'Trade Code',
      children: displayValue(detail?.shipping?.tradeCode),
    },
    {
      key: 'filingNumber',
      label: 'Filing Number',
      children: displayValue(detail?.shipping?.filingNumber),
    },
    {
      key: 'requestedDeliveryDate',
      label: 'Requested Delivery',
      children: formatDate(detail?.shipping?.requestedDeliveryDate),
    },
  ]
  const cargoItems = [
    {
      key: 'cargoNature',
      label: 'Cargo Nature',
      children: displayValue(detail?.cargo?.cargoNature),
    },
    {
      key: 'commodity',
      label: 'Commodity',
      children: displayValue(detail?.cargo?.commodity),
    },
    {
      key: 'cargoVolume',
      label: 'Volume',
      children: formatQuantity(detail?.cargo?.volumeValue, detail?.cargo?.volumeUnit),
    },
    {
      key: 'cargoGrossWeight',
      label: 'Gross Weight',
      children: formatQuantity(
        detail?.cargo?.grossWeightValue,
        detail?.cargo?.grossWeightUnit,
      ),
    },
  ]
  const ratesItems = [
    {
      key: 'rateValidity',
      label: 'Rate Validity',
      children: displayValue(detail?.rates?.rateValidity),
    },
    {
      key: 'targetFreight',
      label: 'Target Freight',
      children: displayValue(detail?.rates?.targetFreight),
    },
    {
      key: 'paymentMode',
      label: 'Payment Mode',
      children: displayValue(detail?.rates?.paymentMode),
    },
    {
      key: 'oceanSurcharges',
      label: 'Ocean Surcharges',
      children: displayValue(detail?.rates?.oceanSurcharges),
    },
  ]
  const contractItems = [
    {
      key: 'trafficTerms',
      label: 'Traffic Terms',
      children: displayValue(detail?.contract?.trafficTerms),
    },
    {
      key: 'bizNature',
      label: 'Biz Nature',
      children: displayValue(detail?.contract?.bizNature),
    },
    {
      key: 'soc',
      label: 'SOC',
      children: formatSoc(detail?.contract?.soc),
    },
    {
      key: 'remark',
      label: 'Remark',
      children: displayValue(detail?.contract?.remark),
    },
  ]
  const systemItems = [
    {
      key: 'status',
      label: 'Status',
      children: <StatusTag value={detail?.status} />,
    },
    {
      key: 'owner',
      label: 'Owner',
      children: detail?.owner
        ? `${detail.owner.name} (${detail.owner.email})`
        : 'Unassigned',
    },
    {
      key: 'ownershipLabel',
      label: 'Ownership',
      children: displayValue(detail?.ownershipLabel),
    },
    {
      key: 'claimedAt',
      label: 'Claimed At',
      children: formatDateTime(detail?.claimedAt),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      children: formatDateTime(detail?.createdAt),
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      children: formatDateTime(detail?.updatedAt),
    },
  ]

  return (
    <>
      <Drawer
        className="request-detail-drawer"
        open={open}
        title={`Order Detail - ${detail?.shipping?.internalQuoteNo || requestId || '-'}`}
        width="min(760px, 100vw)"
        extra={
          detail ? (
            <Space wrap>
              {permissions.canClaim ? (
                <Button loading={actionLoading} onClick={handleClaim}>
                  Claim
                </Button>
              ) : null}
              {permissions.canEdit ? (
                <Button onClick={handleOpenEdit}>Edit</Button>
              ) : null}
              <Button
                icon={<CalculatorOutlined />}
                type="primary"
                onClick={handleOpenCalculator}
              >
                Calculate Quote
              </Button>
            </Space>
          ) : null
        }
        onClose={handleClose}
      >
        {loading ? (
          <Spin />
        ) : error ? (
          <Alert message={error} showIcon type="error" />
        ) : detail ? (
          <>
            <Descriptions
              bordered
              column={1}
              items={customerItems}
              size="small"
              title="Customer Information"
            />

            <Divider />

            <Descriptions
              bordered
              column={1}
              items={shippingItems}
              size="small"
              title="Shipping Information"
            />

            <Divider />

            <Descriptions
              bordered
              column={1}
              items={cargoItems}
              size="small"
              title="Cargo Information"
            />

            <Divider />

            <Descriptions
              bordered
              column={1}
              items={ratesItems}
              size="small"
              title="Rates Information"
            />

            <Divider />

            <Descriptions
              bordered
              column={1}
              items={contractItems}
              size="small"
              title="Contract Information"
            />

            <Divider />

            <Descriptions
              bordered
              column={1}
              items={systemItems}
              size="small"
              title="System Information"
            />

            {permissions.canUpdateStatus ? (
              <>
                <Divider />
                <Space className="request-detail-drawer__action-row" wrap>
                  <Select
                    className="request-detail-drawer__status-select"
                    onChange={setTargetStatus}
                    options={QUOTE_REQUEST_STATUS_OPTIONS.filter(
                      (option) => option.value !== detail.status,
                    )}
                    placeholder="Target status"
                    value={targetStatus}
                  />
                  <Input
                    className="request-detail-drawer__status-message"
                    onChange={(event) => setStatusMessage(event.target.value)}
                    placeholder="Status change message"
                    value={statusMessage}
                  />
                  <Button
                    loading={actionLoading}
                    type="primary"
                    onClick={handleStatusUpdate}
                  >
                    Update Status
                  </Button>
                </Space>
              </>
            ) : null}

            {permissions.canAddNote ? (
              <>
                <Divider />
                <Text strong>Add Note</Text>
                <TextArea
                  className="request-detail-drawer__note-input"
                  maxLength={5000}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Enter follow-up note"
                  rows={3}
                  value={note}
                />
                <Button
                  loading={actionLoading}
                  type="primary"
                  onClick={handleAddNote}
                >
                  Add Note
                </Button>
              </>
            ) : null}

            <Divider />

            <Text strong>Notes</Text>
            <Timeline
              className="request-detail-drawer__timeline"
              items={
                notes.length
                  ? notes.map((item) => ({
                      children: `${formatDateTime(item.createdAt)} - ${
                        item.user?.name || '-'
                      }: ${item.note}`,
                    }))
                  : [{ children: 'No notes yet.' }]
              }
            />

            <Divider />

            <Text strong>Events</Text>
            <Timeline
              className="request-detail-drawer__timeline"
              items={
                events.length
                  ? events.map((item) => ({
                      children: `${formatDateTime(item.createdAt)} - ${
                        item.message || item.eventType
                      }`,
                    }))
                  : [{ children: 'No events yet.' }]
              }
            />
          </>
        ) : null}
      </Drawer>

      <Modal
        confirmLoading={actionLoading}
        okText="Save"
        open={editOpen}
        title="Edit Quote Request"
        width={760}
        onCancel={() => setEditOpen(false)}
        onOk={handleSaveEdit}
      >
        <Form form={form} layout="vertical">
          <div className="request-detail-drawer__edit-grid">
            <Form.Item
              label="Customer Name"
              name="customerName"
              rules={[{ max: 100, message: 'Customer name cannot exceed 100 characters' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: 'email', message: 'Please enter a valid email' },
                { max: 255, message: 'Email cannot exceed 255 characters' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item label="Company" name="company">
              <Input maxLength={150} />
            </Form.Item>
            <Form.Item label="ACP Customer" name="acpCustomer">
              <Input maxLength={150} />
            </Form.Item>
            <Form.Item label="Requested Delivery Date" name="requestedDeliveryDate">
              <DatePicker className="request-detail-drawer__full-width" />
            </Form.Item>
            <Form.Item label="Cargo Nature" name="cargoNature">
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item label="Commodity" name="commodity">
              <Input maxLength={150} />
            </Form.Item>
            <Form.Item label="Volume Value" name="volumeValue">
              <InputNumber className="request-detail-drawer__full-width" min={0} />
            </Form.Item>
            <Form.Item label="Volume Unit" name="volumeUnit">
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item label="Gross Weight Value" name="grossWeightValue">
              <InputNumber className="request-detail-drawer__full-width" min={0} />
            </Form.Item>
            <Form.Item label="Gross Weight Unit" name="grossWeightUnit">
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item label="Rate Validity" name="rateValidity">
              <Input />
            </Form.Item>
            <Form.Item label="Target Freight" name="targetFreight">
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item label="Payment Mode" name="paymentMode">
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item label="Traffic Terms" name="trafficTerms">
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item label="Biz Nature" name="bizNature">
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item label="SOC" name="soc">
              <Radio.Group
                options={[
                  { label: 'Yes', value: true },
                  { label: 'No', value: false },
                  { label: 'Unknown / Not sure', value: 'unknown' },
                ]}
              />
            </Form.Item>
            <Form.Item
              className="request-detail-drawer__edit-item--full"
              label="Project Description"
              name="projectDescription"
            >
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item
              className="request-detail-drawer__edit-item--full"
              label="Ocean Surcharges"
              name="oceanSurcharges"
            >
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item
              className="request-detail-drawer__edit-item--full"
              label="Remark"
              name="remark"
            >
              <TextArea rows={3} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default RequestDetailDrawer
