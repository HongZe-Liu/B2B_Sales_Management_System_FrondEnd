import { useState } from 'react'
import dayjs from 'dayjs'
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout.jsx'
import './Calculator.css'

const { Title, Text } = Typography
const { TextArea } = Input
const CALCULATOR_DRAFT_KEY = 'orderCalculatorDraft'

const emptyCalculatorValues = {
  customerName: '',
  email: '',
  phone: '',
  company: '',
  acpCustomer: '',
  projectDescription: '',
  requestedDeliveryDate: null,
  cargoNature: '',
  commodity: '',
  volumeValue: null,
  volumeUnit: null,
  grossWeightValue: null,
  grossWeightUnit: null,
  rateValidity: '',
  targetFreight: '',
  paymentMode: '',
  oceanSurcharges: '',
  trafficTerms: '',
  bizNature: '',
  soc: null,
  remark: '',
}

function normalizeCalculatorValues(values = {}) {
  return {
    ...emptyCalculatorValues,
    ...values,
    requestedDeliveryDate: values.requestedDeliveryDate
      ? dayjs(values.requestedDeliveryDate)
      : null,
    rateValidity: values.rateValidity || '',
  }
}

function getInitialCalculatorValues() {
  const storedDraft = sessionStorage.getItem(CALCULATOR_DRAFT_KEY)

  if (!storedDraft) {
    return emptyCalculatorValues
  }

  try {
    sessionStorage.removeItem(CALCULATOR_DRAFT_KEY)
    return normalizeCalculatorValues(JSON.parse(storedDraft))
  } catch {
    return emptyCalculatorValues
  }
}

function getNumberFromText(value) {
  const matchedValue = String(value || '').match(/\d+(\.\d+)?/)
  return matchedValue ? Number(matchedValue[0]) : 0
}

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

function formatCurrency(value) {
  return `USD ${Math.round(value).toLocaleString()}`
}

function getUnitRate(volumeUnit) {
  const rateMap = {
    TEU: 120,
    CBM: 18,
    Unit: 8,
  }

  return rateMap[volumeUnit] || 0
}

function hasQuoteInput(values) {
  return Object.values(values).some(
    (value) => value !== null && value !== undefined && value !== '',
  )
}

// 根据现有客户表单字段做前端临时估算，后续可替换为后端报价规则。
function buildQuote(values) {
  if (!hasQuoteInput(values)) {
    return {
      total: 0,
      quoteNo: '-',
      validUntil: '-',
      matchStatus: 'Not calculated',
      rows: [],
    }
  }

  const volumeValue = Number(values.volumeValue || 0)
  const grossWeightValue = Number(values.grossWeightValue || 0)
  const targetFreight = getNumberFromText(values.targetFreight)
  const baseFreight = targetFreight || volumeValue * getUnitRate(values.volumeUnit)
  const cargoCharge = volumeValue * getUnitRate(values.volumeUnit)
  const weightCharge =
    values.grossWeightUnit === 'kg'
      ? grossWeightValue * 0.06
      : grossWeightValue * 45
  const surcharge = values.oceanSurcharges ? 120 : 0
  const contractAdjustment =
    values.soc === true ? 80 : values.soc === false ? 0 : values.soc === 'unknown' ? 40 : 0
  const documentationFee = 80
  const total =
    baseFreight +
    cargoCharge +
    weightCharge +
    surcharge +
    contractAdjustment +
    documentationFee

  return {
    total,
    quoteNo: `Q-${dayjs().format('YYMMDD')}`,
    validUntil: values.rateValidity || '-',
    matchStatus: targetFreight ? 'Target matched' : 'Estimated',
    rows: [
      {
        key: 'baseFreight',
        chargeItem: 'Freight / Target Freight',
        unit: 'per request',
        source: values.targetFreight || 'Auto estimate',
        amount: baseFreight,
      },
      {
        key: 'cargoCharge',
        chargeItem: 'Cargo Volume Charge',
        unit: `${volumeValue || 0} ${values.volumeUnit || '-'}`,
        source: values.cargoNature || 'Cargo',
        amount: cargoCharge,
      },
      {
        key: 'weightCharge',
        chargeItem: 'Gross Weight Charge',
        unit: `${grossWeightValue || 0} ${values.grossWeightUnit || '-'}`,
        source: values.commodity || 'Commodity',
        amount: weightCharge,
      },
      {
        key: 'surcharge',
        chargeItem: 'Ocean Surcharges',
        unit: 'per shipment',
        source: values.oceanSurcharges || '-',
        amount: surcharge,
      },
      {
        key: 'contractAdjustment',
        chargeItem: 'SOC / Contract Adjustment',
        unit: values.trafficTerms || '-',
        source: values.bizNature || 'Contract',
        amount: contractAdjustment,
      },
      {
        key: 'documentationFee',
        chargeItem: 'Documentation Fee',
        unit: 'per quote',
        source: values.paymentMode || '-',
        amount: documentationFee,
      },
    ],
  }
}

const quoteColumns = [
  {
    title: 'Charge Item',
    dataIndex: 'chargeItem',
    key: 'chargeItem',
    width: 170,
  },
  {
    title: 'Unit',
    dataIndex: 'unit',
    key: 'unit',
    width: 110,
  },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    width: 140,
    render: (source) => (
      <Text ellipsis title={source}>
        {source}
      </Text>
    ),
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    width: 120,
    render: (amount) => <strong>{formatCurrency(amount)}</strong>,
  },
]

function Calculator() {
  const [form] = Form.useForm()
  const [formInitialValues] = useState(getInitialCalculatorValues)
  const [quoteValues, setQuoteValues] = useState(formInitialValues)
  const currentValues = quoteValues || emptyCalculatorValues
  const quote = buildQuote(currentValues)

  const handleValuesChange = (_, allValues) => {
    setQuoteValues({
      ...emptyCalculatorValues,
      ...allValues,
    })
  }

  const handleCalculate = async () => {
    const values = await form.validateFields()
    setQuoteValues({
      ...emptyCalculatorValues,
      ...values,
    })
    message.success('Quote calculated')
  }

  const handleReset = () => {
    const nextValues = normalizeCalculatorValues()

    sessionStorage.removeItem(CALCULATOR_DRAFT_KEY)
    form.setFieldsValue(nextValues)
    setQuoteValues(nextValues)
    message.success('Calculator cleared')
  }

  return (
    <DashboardLayout selectedKey="calculator" userName="Helen Zhang">
      <main className="dashboard-page">
        <header className="dashboard-page__header">
          <div>
            <Title level={2} className="dashboard-page__title">
              Order Calculation
            </Title>
            <Text className="dashboard-page__description">
              Calculate a quote based on the same fields used in the customer
              quote request form.
            </Text>
          </div>

          <Tag className="order-calculation__rule-tag">
            Rule version: 2026.05
          </Tag>
        </header>

        <div className="order-calculation">
          <Card
            className="dashboard-section order-calculation__input-card"
            extra="Sales input"
            title="Quote Inputs"
          >
            <Form
              form={form}
              initialValues={formInitialValues}
              layout="vertical"
              onValuesChange={handleValuesChange}
            >
              <section className="order-calculation__field-group">
                <Text strong>Contact</Text>
                <div className="order-calculation__form-grid">
                  <Form.Item
                    label="Name"
                    name="customerName"
                    rules={[{ required: true, message: 'Please enter name' }]}
                  >
                    <Input placeholder="Enter contact name" />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                  >
                    <Input placeholder="Enter email address" />
                  </Form.Item>

                  <Form.Item label="Phone" name="phone">
                    <Input placeholder="Enter phone number" />
                  </Form.Item>

                  <Form.Item label="Company" name="company">
                    <Input placeholder="Enter company name" />
                  </Form.Item>

                  <Form.Item label="ACP Customer" name="acpCustomer">
                    <Input placeholder="Enter ACP customer account" />
                  </Form.Item>

                  <Form.Item
                    className="order-calculation__form-item--full"
                    label="Project Description"
                    name="projectDescription"
                    rules={[
                      {
                        required: true,
                        message: 'Please describe project requirement',
                      },
                    ]}
                  >
                    <TextArea
                      placeholder="Describe quotation or shipping requirement"
                      rows={3}
                    />
                  </Form.Item>
                </div>
              </section>

              <section className="order-calculation__field-group">
                <Text strong>Shipping</Text>
                <div className="order-calculation__form-grid">
                  <Form.Item
                    label="Requested Delivery Date"
                    name="requestedDeliveryDate"
                  >
                    <DatePicker className="order-calculation__full-width" />
                  </Form.Item>
                </div>
              </section>

              <section className="order-calculation__field-group">
                <Text strong>Cargo</Text>
                <div className="order-calculation__form-grid">
                  <Form.Item label="Cargo Nature(s)" name="cargoNature">
                    <Input placeholder="For example: General Cargo" />
                  </Form.Item>

                  <Form.Item label="Commodity" name="commodity">
                    <Input placeholder="For example: Electronics" />
                  </Form.Item>

                  <Form.Item label="Volume Value" name="volumeValue">
                    <InputNumber
                      className="order-calculation__full-width"
                      min={0}
                      placeholder="Enter cargo amount"
                    />
                  </Form.Item>

                  <Form.Item label="Volume Unit" name="volumeUnit">
                    <Select
                      options={[
                        { label: 'TEU', value: 'TEU' },
                        { label: 'CBM', value: 'CBM' },
                        { label: 'Unit', value: 'Unit' },
                      ]}
                      placeholder="Select cargo unit"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Gross Weight Value"
                    name="grossWeightValue"
                  >
                    <InputNumber
                      className="order-calculation__full-width"
                      min={0}
                      placeholder="Enter gross weight"
                    />
                  </Form.Item>

                  <Form.Item label="Gross Weight Unit" name="grossWeightUnit">
                    <Select
                      options={[
                        { label: 'kg', value: 'kg' },
                        { label: 'ton', value: 'ton' },
                      ]}
                      placeholder="Select weight unit"
                    />
                  </Form.Item>
                </div>
              </section>

              <section className="order-calculation__field-group">
                <Text strong>Rates</Text>
                <div className="order-calculation__form-grid">
                  <Form.Item label="Rate Validity" name="rateValidity">
                    <Input placeholder="For example: 2026-06-30 or subject to carrier confirmation" />
                  </Form.Item>

                  <Form.Item
                    label="Freight / Target Freight"
                    name="targetFreight"
                  >
                    <Input placeholder="For example: USD 1800" />
                  </Form.Item>

                  <Form.Item label="Payment Mode" name="paymentMode">
                    <Input placeholder="For example: Prepaid / Collect" />
                  </Form.Item>

                  <Form.Item
                    className="order-calculation__form-item--full"
                    label="Ocean Surcharges"
                    name="oceanSurcharges"
                  >
                    <TextArea placeholder="Enter ocean surcharge details" rows={3} />
                  </Form.Item>
                </div>
              </section>

              <section className="order-calculation__field-group">
                <Text strong>Contract</Text>
                <div className="order-calculation__form-grid">
                  <Form.Item label="Traffic Terms" name="trafficTerms">
                    <Input placeholder="For example: CY/CY" />
                  </Form.Item>

                  <Form.Item label="Biz Nature" name="bizNature">
                    <Input placeholder="For example: Open / Committed" />
                  </Form.Item>

                  <Form.Item
                    className="order-calculation__form-item--full"
                    label="SOC"
                    name="soc"
                  >
                    <Radio.Group
                      options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                        { label: 'Unknown / Not sure', value: 'unknown' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    className="order-calculation__form-item--full"
                    label="Remark"
                    name="remark"
                  >
                    <TextArea placeholder="Enter additional notes" rows={3} />
                  </Form.Item>
                </div>
              </section>

              <Space wrap>
                <Button type="primary" onClick={handleCalculate}>
                  Calculate Quote
                </Button>
                <Button onClick={handleReset}>Reset</Button>
              </Space>
            </Form>
          </Card>

          <Card className="dashboard-section order-calculation__result-card">
            <div className="order-calculation__quote-header">
              <div>
                <Text className="order-calculation__quote-label">
                  Total Quote
                </Text>
                <div className="order-calculation__quote-total">
                  {formatCurrency(quote.total)}
                </div>
              </div>
              <Tag className="order-calculation__summary-tag">
                {currentValues.company || 'Company'} /{' '}
                {currentValues.volumeValue || 0} {currentValues.volumeUnit || '-'}
              </Tag>
            </div>

            <Table
              columns={quoteColumns}
              dataSource={quote.rows}
              locale={{ emptyText: 'No quote calculated yet.' }}
              pagination={false}
              scroll={{ x: 540 }}
            />

            <div className="order-calculation__summary-grid">
              <Descriptions
                bordered
                column={1}
                items={[
                  {
                    key: 'validUntil',
                    label: 'Valid Until',
                    children: quote.validUntil,
                  },
                ]}
                size="small"
              />

              <Descriptions
                bordered
                column={1}
                items={[
                  {
                    key: 'quoteNo',
                    label: 'Quote No.',
                    children: quote.quoteNo,
                  },
                ]}
                size="small"
              />

              <Descriptions
                bordered
                column={1}
                items={[
                  {
                    key: 'matchStatus',
                    label: 'Match Status',
                    children: quote.matchStatus,
                  },
                ]}
                size="small"
              />
            </div>

            <Descriptions
              bordered
              className="order-calculation__request-summary"
              column={1}
              items={[
                {
                  key: 'customerName',
                  label: 'Name',
                  children: currentValues.customerName || '-',
                },
                {
                  key: 'email',
                  label: 'Email',
                  children: currentValues.email || '-',
                },
                {
                  key: 'requestedDeliveryDate',
                  label: 'Requested Delivery Date',
                  children: formatDate(currentValues.requestedDeliveryDate),
                },
                {
                  key: 'projectDescription',
                  label: 'Project Description',
                  children: currentValues.projectDescription || '-',
                },
              ]}
              size="small"
              title="Request Summary"
            />

            <Space className="order-calculation__result-actions" wrap>
              <Button type="primary">Save Quote</Button>
              <Button>Export Quote</Button>
              <Button>Manual Adjustment</Button>
            </Space>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}

export default Calculator
