import { addOrderMessage, getOrder } from './commerce'

export type DisputeStatus = 'Open' | 'Investigating' | 'Resolved'

export type DisputeReason =
  | 'Payment issue'
  | 'Wrong or missing item'
  | 'Delivery problem'
  | 'Customer/vendor misunderstanding'
  | 'Rider issue'
  | 'Other'

export interface Dispute {
  id: string
  orderId: string
  reporterRole: 'customer' | 'store' | 'rider'
  reporterEmail: string
  reporterName: string
  reason: DisputeReason
  description: string
  status: DisputeStatus
  createdAt: string
  updatedAt: string
  resolution?: string
}

const DISPUTES_KEY = 'bi-quicker:disputes'

const read = <T,>(fallback: T): T => {
  try {
    const raw = localStorage.getItem(DISPUTES_KEY)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = (value: Dispute[]) => localStorage.setItem(DISPUTES_KEY, JSON.stringify(value))

export const getDisputes = (): Dispute[] => read<Dispute[]>([])

export const getOpenDisputes = () => getDisputes().filter((item) => item.status !== 'Resolved')

export const createDispute = (input: {
  orderId: string
  reporterRole: 'customer' | 'store' | 'rider'
  reporterEmail: string
  reporterName: string
  reason: DisputeReason
  description: string
}) => {
  const order = getOrder(input.orderId)
  if (!order) return null
  const existing = getDisputes().find((item) => item.orderId === input.orderId && item.status !== 'Resolved')
  if (existing) return existing
  const at = new Date().toISOString()
  const dispute: Dispute = {
    id: `DSP-${Date.now().toString().slice(-7)}`,
    ...input,
    status: 'Open',
    createdAt: at,
    updatedAt: at,
  }
  write([dispute, ...getDisputes()])
  addOrderMessage(input.orderId, {
    senderRole: input.reporterRole,
    senderEmail: input.reporterEmail,
    senderName: input.reporterName,
    body: `🚩 Admin attention requested. Reason: ${input.reason}. ${input.description}`,
  })
  return dispute
}

export const updateDispute = (id: string, patch: Partial<Pick<Dispute, 'status' | 'resolution'>>) => {
  const disputes = getDisputes()
  const current = disputes.find((item) => item.id === id)
  if (!current) return null
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() }
  write(disputes.map((item) => item.id === id ? updated : item))
  if (patch.status === 'Investigating') {
    addOrderMessage(idToOrder(id, current.orderId), {
      senderRole: 'system', senderEmail: 'system', senderName: 'Bi-quicker',
      body: 'Super Admin is now reviewing the reported issue.', system: true,
    })
  }
  if (patch.status === 'Resolved') {
    addOrderMessage(idToOrder(id, current.orderId), {
      senderRole: 'system', senderEmail: 'system', senderName: 'Bi-quicker',
      body: `Dispute ${id} resolved${patch.resolution ? `: ${patch.resolution}` : '.'}`, system: true,
    })
  }
  return updated
}

const idToOrder = (_disputeId: string, orderId: string) => orderId
