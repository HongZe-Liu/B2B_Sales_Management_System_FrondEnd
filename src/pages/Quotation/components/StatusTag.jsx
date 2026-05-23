import { Tag } from 'antd'
import { QUOTE_REQUEST_STATUS_MAP } from '../../../constants/quoteRequest.js'

// 状态标签：统一处理列表里的状态展示。
function StatusTag({ value, statusMap = QUOTE_REQUEST_STATUS_MAP }) {
  const status = statusMap[value] || { color: 'default', text: value || '-' }

  return <Tag color={status.color}>{status.text}</Tag>
}

export default StatusTag
