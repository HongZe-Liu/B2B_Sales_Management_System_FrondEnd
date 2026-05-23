export const QUOTE_REQUEST_STATUSES = ['new', 'processing', 'confirmed']

export const QUOTE_REQUEST_STATUS_MAP = {
  new: { color: 'gold', text: 'New' },
  processing: { color: 'blue', text: 'Processing' },
  confirmed: { color: 'green', text: 'Confirmed' },
}

export const QUOTE_REQUEST_STATUS_OPTIONS = QUOTE_REQUEST_STATUSES.map(
  (status) => ({
    label: QUOTE_REQUEST_STATUS_MAP[status].text,
    value: status,
  }),
)

export const OWNERSHIP_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Mine', value: 'mine' },
]

export const SORT_BY_OPTIONS = [
  'createdAt',
  'updatedAt',
  'requestedDeliveryDate',
  'internalQuoteNo',
  'customerName',
  'status',
]

export const QUOTE_REQUEST_FIELD_NAMES = [
  'customerName',
  'email',
  'phone',
  'company',
  'acpCustomer',
  'projectDescription',
  'requestedDeliveryDate',
  'cargoNature',
  'commodity',
  'volumeValue',
  'volumeUnit',
  'grossWeightValue',
  'grossWeightUnit',
  'rateValidity',
  'targetFreight',
  'paymentMode',
  'oceanSurcharges',
  'trafficTerms',
  'bizNature',
  'soc',
  'remark',
]
