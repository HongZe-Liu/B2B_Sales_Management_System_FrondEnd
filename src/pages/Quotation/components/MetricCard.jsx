import { Card, Statistic } from 'antd'

// 指标卡片：用于展示 Quotation 顶部的关键数字。
function MetricCard({
  title,
  value,
  icon,
  suffix,
  prefix,
  precision,
  extra,
  tone = 'blue',
  loading = false,
}) {
  return (
    <Card className={`metric-card metric-card--${tone}`} loading={loading}>
      {/* 标题行：左侧名称，右侧图标。 */}
      <div className="metric-card__top">
        <span className="metric-card__label">{title}</span>
        {icon && <span className="metric-card__icon">{icon}</span>}
      </div>

      {/* 数字主体：支持前缀、后缀和小数位。 */}
      <Statistic
        value={value}
        suffix={suffix}
        prefix={prefix}
        precision={precision}
      />

      {extra && <div className="metric-card__extra">{extra}</div>}
    </Card>
  )
}

export default MetricCard
