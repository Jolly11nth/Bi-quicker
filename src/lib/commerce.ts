import { getSavedRoute } from './location'

export type CommerceRole = 'customer' | 'store' | 'rider' | 'admin'

export interface VendorProduct { id: string; name: string; description: string; price: number; stock: number }
export interface Vendor {
  id: string; name: string; category: string; rating: string; eta: string; ownerEmail: string
  paymentBank: string; paymentAccountName: string; paymentAccountNumber: string; products: VendorProduct[]
}
export interface OrderItem { productId: string; name: string; price: number; quantity: number }
export type OrderStatus = 'Awaiting payment' | 'Paid' | 'Preparing' | 'Rider assigned' | 'Picked up' | 'In transit' | 'Delivered'
export interface TrackingEvent { id: string; status: OrderStatus; label: string; detail: string; at: string; done: boolean }
export interface ChatParticipant { role: CommerceRole; email: string; name: string; active: boolean }
export interface ChatMessage { id: string; senderRole: CommerceRole | 'system'; senderEmail: string; senderName: string; body: string; at: string; system?: boolean }
export interface CommerceOrder {
  id: string; customerEmail: string; customerName: string; vendorId: string; vendorName: string; vendorOwnerEmail: string
  items: OrderItem[]; subtotal: number; maintenanceFee: number; maintenanceRate: number
  deliveryDistanceKm: number; deliveryMinutes: number; deliveryFee: number; total: number; status: OrderStatus
  riderEmail?: string; riderName?: string; riderAssignedAt?: string; createdAt: string
  payment: { bank: string; accountName: string; accountNumber: string; reference: string; confirmed: boolean }
  participants: ChatParticipant[]; messages: ChatMessage[]; tracking: TrackingEvent[]
}

const VENDORS_KEY = 'bi-quicker:vendors'
const ORDERS_KEY = 'bi-quicker:commerce-orders'
export const MAINTENANCE_RATE = 0.03
export const RIDER_BASE_DISTANCE_KM = 5
export const RIDER_BASE_FEE = 500

const seedVendors: Vendor[] = [
  { id: 'vendor-fresh-basket', name: 'Fresh Basket', category: 'Groceries', rating: '4.8', eta: '20–35 min', ownerEmail: 'store@example.com', paymentBank: 'GTBank', paymentAccountName: 'Fresh Basket Ltd', paymentAccountNumber: '0123456789', products: [
    { id: 'fb-rice', name: 'Premium Rice 25kg', description: 'Long-grain premium rice.', price: 28000, stock: 42 }, { id: 'fb-oil', name: 'Cooking Oil 5L', description: 'Quality cooking oil.', price: 12500, stock: 18 }, { id: 'fb-breakfast', name: 'Breakfast Pack', description: 'A family breakfast selection.', price: 8900, stock: 12 },
  ] },
  { id: 'vendor-tech-hub', name: 'Tech Hub', category: 'Electronics', rating: '4.7', eta: '25–40 min', ownerEmail: 'techhub@example.com', paymentBank: 'Access Bank', paymentAccountName: 'Tech Hub NG', paymentAccountNumber: '1029384756', products: [
    { id: 'th-earbuds', name: 'Wireless Earbuds', description: 'Compact wireless earbuds.', price: 32000, stock: 24 }, { id: 'th-charger', name: 'Fast Charger', description: 'USB-C fast charger.', price: 14500, stock: 30 }, { id: 'th-cable', name: 'USB-C Cable', description: 'Durable charging cable.', price: 5500, stock: 50 },
  ] },
  { id: 'vendor-home-store', name: 'Home Store', category: 'Home & Kitchen', rating: '4.6', eta: '30–45 min', ownerEmail: 'homestore@example.com', paymentBank: 'UBA', paymentAccountName: 'Home Store NG', paymentAccountNumber: '2019283746', products: [
    { id: 'hs-kitchen', name: 'Kitchen Set', description: 'Everyday kitchen essentials.', price: 24500, stock: 16 }, { id: 'hs-storage', name: 'Storage Set', description: 'Stackable home storage.', price: 13500, stock: 22 }, { id: 'hs-lamp', name: 'Table Lamp', description: 'Modern bedside lamp.', price: 11500, stock: 14 },
  ] },
  { id: 'vendor-market-square', name: 'Market Square', category: 'General', rating: '4.5', eta: '25–40 min', ownerEmail: 'marketsquare@example.com', paymentBank: 'First Bank', paymentAccountName: 'Market Square Stores', paymentAccountNumber: '3018273645', products: [
    { id: 'ms-water', name: 'Bottled Water Pack', description: 'Pack of bottled water.', price: 4500, stock: 60 }, { id: 'ms-snacks', name: 'Snack Box', description: 'Assorted snack box.', price: 7500, stock: 35 }, { id: 'ms-clean', name: 'Home Cleaning Pack', description: 'Household cleaning essentials.', price: 12800, stock: 20 },
  ] },
]
const riders = [{ email: 'rider@example.com', name: 'Demo Rider' }, { email: 'rider2@example.com', name: 'Samuel Rider' }, { email: 'rider3@example.com', name: 'Daniel Rider' }]
const read = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback } }
const write = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value))
export const getVendors = (): Vendor[] => { const vendors = read<Vendor[]>(VENDORS_KEY, []); if (vendors.length) return vendors; write(VENDORS_KEY, seedVendors); return seedVendors }
export const getRiders = () => riders
export const addVendorProduct = (vendorId: string, input: Omit<VendorProduct, 'id'>) => { const vendors = getVendors(); const index = vendors.findIndex((vendor) => vendor.id === vendorId); if (index < 0) return null; const product = { ...input, id: `${vendorId}-p-${Date.now()}` }; vendors[index] = { ...vendors[index], products: [...vendors[index].products, product] }; write(VENDORS_KEY, vendors); return product }
export const getOrders = (): CommerceOrder[] => read<CommerceOrder[]>(ORDERS_KEY, [])
export const getOrder = (id: string) => getOrders().find((order) => order.id === id)
const now = () => new Date().toISOString()
const money = (value: number) => `₦${value.toLocaleString('en-NG')}`

/** Confirmed rider pricing rule: 0–5 km costs ₦500. */
export const calculateRiderDeliveryFee = (distanceKm: number) => { const distance = Math.max(0, distanceKm); if (distance <= RIDER_BASE_DISTANCE_KM) return RIDER_BASE_FEE; throw new Error('Rider pricing for deliveries above 5 km has not been configured yet.') }
export const calculateMaintenanceFee = (subtotal: number) => Math.round(Math.max(0, subtotal) * MAINTENANCE_RATE)
export const calculateOrderTotal = (subtotal: number, deliveryFee: number) => Math.max(0, subtotal) + calculateMaintenanceFee(subtotal) + Math.max(0, deliveryFee)
const buildTracking = (): TrackingEvent[] => [
  { id: 'placed', status: 'Awaiting payment', label: 'Order placed', detail: 'Order created and waiting for payment confirmation.', at: now(), done: true },
  { id: 'paid', status: 'Paid', label: 'Payment confirmed', detail: 'Payment details have been shared with the vendor.', at: '', done: false },
  { id: 'preparing', status: 'Preparing', label: 'Vendor preparing order', detail: 'The vendor is preparing your package.', at: '', done: false },
  { id: 'assigned', status: 'Rider assigned', label: 'Rider assigned', detail: 'A delivery rider has joined the order chat.', at: '', done: false },
  { id: 'pickup', status: 'Picked up', label: 'Package picked up', detail: 'The rider has collected the package.', at: '', done: false },
  { id: 'transit', status: 'In transit', label: 'In transit', detail: 'Package is moving toward the customer.', at: '', done: false },
  { id: 'delivered', status: 'Delivered', label: 'Delivered', detail: 'Package delivered successfully.', at: '', done: false },
]

export const createOrder = (input: { customerEmail: string; customerName: string; vendor: Vendor; items: OrderItem[]; deliveryDistanceKm?: number; deliveryMinutes?: number }) => {
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cachedRoute = getSavedRoute(input.customerEmail, input.vendor.id)
  const deliveryDistanceKm = input.deliveryDistanceKm ?? cachedRoute?.distanceKm
  const deliveryMinutes = input.deliveryMinutes ?? cachedRoute?.durationMinutes
  if (deliveryDistanceKm == null || deliveryMinutes == null) throw new Error('Delivery route is unavailable. Please allow location access for the customer and vendor before placing this order.')
  const maintenanceFee = calculateMaintenanceFee(subtotal)
  const deliveryFee = calculateRiderDeliveryFee(deliveryDistanceKm)
  const id = `BQ-${Date.now().toString().slice(-7)}`
  const createdAt = now()
  const order: CommerceOrder = {
    id, customerEmail: input.customerEmail, customerName: input.customerName, vendorId: input.vendor.id, vendorName: input.vendor.name, vendorOwnerEmail: input.vendor.ownerEmail,
    items: input.items, subtotal, maintenanceFee, maintenanceRate: MAINTENANCE_RATE, deliveryDistanceKm, deliveryMinutes, deliveryFee, total: calculateOrderTotal(subtotal, deliveryFee), status: 'Awaiting payment', createdAt,
    payment: { bank: input.vendor.paymentBank, accountName: input.vendor.paymentAccountName, accountNumber: input.vendor.paymentAccountNumber, reference: `BQ-${Date.now().toString().slice(-6)}`, confirmed: false },
    participants: [{ role: 'customer', email: input.customerEmail, name: input.customerName, active: true }, { role: 'store', email: input.vendor.ownerEmail, name: input.vendor.name, active: true }],
    messages: [{ id: `${id}-system`, senderRole: 'system', senderEmail: 'system', senderName: 'Bi-quicker', body: `Order ${id} created. Vendor payment details are available above the chat.`, at: createdAt, system: true }], tracking: buildTracking(),
  }
  write(ORDERS_KEY, [order, ...getOrders()]); return order
}
export const updateOrder = (id: string, patch: Partial<CommerceOrder>) => { const orders = getOrders().map((order) => order.id === id ? { ...order, ...patch } : order); write(ORDERS_KEY, orders); return orders.find((order) => order.id === id)! }
export const confirmPayment = (id: string) => { const order = getOrder(id); if (!order) return null; const at = now(); const tracking = order.tracking.map((event, index) => index <= 1 ? { ...event, done: true, at: index === 1 ? at : event.at } : event); return updateOrder(id, { status: 'Paid', payment: { ...order.payment, confirmed: true }, tracking }) }
export const addOrderMessage = (id: string, message: Omit<ChatMessage, 'id' | 'at'>) => { const order = getOrder(id); if (!order) return null; const next = { ...message, id: `${id}-m-${Date.now()}`, at: now() }; return updateOrder(id, { messages: [...order.messages, next] }) }
export const assignRider = (id: string, riderEmail: string) => { const order = getOrder(id); const rider = riders.find((item) => item.email === riderEmail); if (!order || !rider) return null; const at = now(); const participants = order.participants.some((item) => item.email === rider.email) ? order.participants : [...order.participants, { role: 'rider' as const, email: rider.email, name: rider.name, active: true }]; const tracking = order.tracking.map((event) => event.id === 'assigned' ? { ...event, done: true, at } : event); const systemMessage: ChatMessage = { id: `${id}-rider-${Date.now()}`, senderRole: 'system', senderEmail: 'system', senderName: 'Bi-quicker', body: `${rider.name} has been assigned to this delivery and added to the order chat.`, at, system: true }; return updateOrder(id, { riderEmail: rider.email, riderName: rider.name, riderAssignedAt: at, status: 'Rider assigned', participants, messages: [...order.messages, systemMessage], tracking }) }
export const advanceOrder = (id: string) => { const order = getOrder(id); if (!order) return null; const sequence: OrderStatus[] = ['Awaiting payment', 'Paid', 'Preparing', 'Rider assigned', 'Picked up', 'In transit', 'Delivered']; const current = sequence.indexOf(order.status); const nextStatus = sequence[Math.min(current + 1, sequence.length - 1)]; const at = now(); const tracking = order.tracking.map((event, index) => { const targetIndex = sequence.indexOf(nextStatus); return index <= targetIndex ? { ...event, done: true, at: event.at || at } : event }); return updateOrder(id, { status: nextStatus, tracking }) }
export const formatMoney = money
