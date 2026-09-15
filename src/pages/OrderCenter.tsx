import { useMemo, useState } from 'react'
import { getSession } from '../lib/storage'
import {
  addOrderMessage,
  advanceOrder,
  assignRider,
  confirmPayment,
  createOrder,
  formatMoney,
  getOrder,
  getOrders,
  getRiders,
  getVendors,
  type CommerceOrder,
  type CommerceRole,
  type OrderItem,
  type Vendor,
} from '../lib/commerce'
import type { RoleKey } from '../lib/types'

const roleNames: Record<CommerceRole, string> = {
  customer: 'Customer', store: 'Store Admin', rider: 'Delivery Rider', admin: 'Super Admin',
}

const roleSegment: Record<RoleKey, string> = { customer: 'customer', store: 'store-admin', rider: 'rider', admin: 'super-admin' }

const go = (path: string) => { window.location.hash = path }

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack?: () => void }) {
  return <header className="commerce-header">
    <div className="commerce-header-inner">
      {onBack && <button className="commerce-back" onClick={onBack}>← Back</button>}
      <div><span className="commerce-kicker">Bi-quicker</span><h1>{title}</h1><p>{subtitle}</p></div>
    </div>
  </header>
}

function VendorList({ onSelect }: { onSelect: (vendor: Vendor) => void }) {
  const vendors = getVendors()
  return <div className="commerce-grid vendors-grid">{vendors.map((vendor) => <button className="vendor-card" key={vendor.id} onClick={() => onSelect(vendor)}>
    <div className="vendor-avatar">{vendor.name.slice(0, 1)}</div>
    <div className="vendor-card-main"><div className="vendor-title"><h3>{vendor.name}</h3><span>★ {vendor.rating}</span></div><p>{vendor.category}</p><small>{vendor.eta} delivery · {vendor.products.length} products</small></div>
    <span className="vendor-arrow">→</span>
  </button>)}</div>
}

function VendorShop({ vendor, onCheckout, onBack }: { vendor: Vendor; onCheckout: (items: OrderItem[]) => void; onBack: () => void }) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const items = vendor.products.filter((product) => (cart[product.id] || 0) > 0).map((product) => ({ productId: product.id, name: product.name, price: product.price, quantity: cart[product.id] }))
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const change = (id: string, delta: number) => setCart((current) => {
    const next = Math.max(0, (current[id] || 0) + delta)
    return { ...current, [id]: next }
  })

  return <>
    <Header title={vendor.name} subtitle={`${vendor.category} · ★ ${vendor.rating} · ${vendor.eta} delivery`} onBack={onBack} />
    <main className="commerce-main">
      <div className="vendor-rule"><strong>Shopping from one vendor</strong><span>Your cart can only contain products from {vendor.name}.</span></div>
      <div className="commerce-grid products-grid">{vendor.products.map((product) => <article className="product-card" key={product.id}>
        <div className="product-image">{product.name.slice(0, 1)}</div><div className="product-copy"><h3>{product.name}</h3><p>{product.description}</p><strong>{formatMoney(product.price)}</strong><small>{product.stock} in stock</small></div>
        <div className="quantity"><button onClick={() => change(product.id, -1)} disabled={!cart[product.id]}>−</button><b>{cart[product.id] || 0}</b><button onClick={() => change(product.id, 1)} disabled={(cart[product.id] || 0) >= product.stock}>＋</button></div>
      </article>)}</div>
      <div className="commerce-cartbar"><div><span>{items.reduce((sum, item) => sum + item.quantity, 0)} items</span><strong>{formatMoney(subtotal)}</strong></div><button className="commerce-primary" disabled={!items.length} onClick={() => onCheckout(items)}>Continue to checkout →</button></div>
    </main>
  </>
}

function Checkout({ vendor, items, onCreate, onBack }: { vendor: Vendor; items: OrderItem[]; onCreate: () => void; onBack: () => void }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return <>
    <Header title="Review & checkout" subtitle={`Your order from ${vendor.name}`} onBack={onBack} />
    <main className="commerce-main narrow">
      <section className="checkout-card"><div className="checkout-head"><div><span className="commerce-kicker">Vendor</span><h2>{vendor.name}</h2></div><span className="single-vendor-badge">One vendor only</span></div>
        {items.map((item) => <div className="checkout-line" key={item.productId}><span>{item.quantity} × {item.name}</span><strong>{formatMoney(item.price * item.quantity)}</strong></div>)}
        <div className="checkout-total"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div className="checkout-total"><span>Delivery</span><strong>{formatMoney(1800)}</strong></div><div className="checkout-total grand"><span>Total</span><strong>{formatMoney(subtotal + 1800)}</strong></div>
        <button className="commerce-primary wide" onClick={onCreate}>Place order & open vendor chat →</button>
        <p className="checkout-note">After placing the order, the vendor's payment details will appear automatically at the top of the order chat.</p>
      </section>
    </main>
  </>
}

function PaymentPanel({ order }: { order: CommerceOrder }) {
  return <section className="payment-panel"><div><span className="commerce-kicker">Vendor payment details</span><h3>Pay {formatMoney(order.total)} to {order.vendorName}</h3></div><div className="payment-grid"><div><small>Bank</small><strong>{order.payment.bank}</strong></div><div><small>Account name</small><strong>{order.payment.accountName}</strong></div><div><small>Account number</small><strong>{order.payment.accountNumber}</strong></div><div><small>Payment reference</small><strong>{order.payment.reference}</strong></div></div><div className="payment-state">{order.payment.confirmed ? '✓ Payment confirmed' : 'Payment awaiting confirmation'}</div></section>
}

function Tracking({ order }: { order: CommerceOrder }) {
  return <section className="tracking-card"><div className="section-title"><div><span className="commerce-kicker">Package tracking</span><h2>{order.status}</h2></div><span className="tracking-id">{order.id}</span></div><div className="tracking-line">{order.tracking.map((event) => <div className={`tracking-step ${event.done ? 'done' : ''}`} key={event.id}><span className="tracking-dot">{event.done ? '✓' : ''}</span><div><strong>{event.label}</strong><p>{event.detail}</p>{event.at && <small>{new Date(event.at).toLocaleString()}</small>}</div></div>)}</div></section>
}

function Chat({ order, role, onRefresh }: { order: CommerceOrder; role: CommerceRole; onRefresh: () => void }) {
  const session = getSession()
  const [text, setText] = useState('')
  const canChat = order.participants.some((participant) => participant.role === role && participant.email === session?.email)
  const send = () => {
    if (!text.trim() || !canChat || !session) return
    addOrderMessage(order.id, { senderRole: role, senderEmail: session.email, senderName: session.name, body: text.trim() })
    setText('')
    onRefresh()
  }
  return <section className="chat-card"><div className="chat-head"><div><span className="commerce-kicker">Order conversation</span><h2>Chat</h2></div><div className="participant-list">{order.participants.filter((p) => p.active).map((p) => <span key={p.email} className={`participant ${p.role}`}>{p.name} · {roleNames[p.role]}</span>)}</div></div><div className="chat-messages">{order.messages.map((message) => <div key={message.id} className={`chat-message ${message.senderRole === role ? 'mine' : ''} ${message.system ? 'system' : ''}`}><span>{message.senderName} · {message.senderRole === 'system' ? 'System' : roleNames[message.senderRole]}</span><p>{message.body}</p><small>{new Date(message.at).toLocaleString()}</small></div>)}</div>{canChat ? <div className="chat-compose"><input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="Write a message…" /><button className="commerce-primary" onClick={send}>Send</button></div> : <div className="chat-locked">You are not a participant in this order conversation.</div>}</section>
}

function OrderDetail({ orderId, role, onBack }: { orderId: string; role: CommerceRole; onBack: () => void }) {
  const [version, setVersion] = useState(0)
  const order = getOrder(orderId)
  void version
  if (!order) return <><Header title="Order not found" subtitle="This order does not exist." onBack={onBack} /><main className="commerce-main narrow"><div className="empty-commerce">We could not find that order.</div></main></>
  const session = getSession()
  const authorized = role === 'admin' || order.participants.some((participant) => participant.role === role && participant.email === session?.email)
  if (!authorized) return <><Header title="Access restricted" subtitle="This order is not available to your role." onBack={onBack} /><main className="commerce-main narrow"><div className="empty-commerce"><strong>Rider access is assignment-based.</strong><p>A rider can only see or respond to a chat after this order has been assigned to that rider.</p></div></main></>

  const refresh = () => setVersion((value) => value + 1)
  const doPayment = () => { confirmPayment(order.id); refresh() }
  const doAdvance = () => { advanceOrder(order.id); refresh() }
  const assign = (email: string) => { assignRider(order.id, email); refresh() }

  return <>
    <Header title={`Order ${order.id}`} subtitle={`${order.vendorName} · ${formatMoney(order.total)}`} onBack={onBack} />
    <main className="commerce-main order-main">
      <div className="order-layout"><div><PaymentPanel order={order} /><Chat order={order} role={role} onRefresh={refresh} /></div><aside className="order-side"><Tracking order={order} />
        {role === 'customer' && !order.payment.confirmed && <button className="commerce-secondary wide" onClick={doPayment}>Demo: mark payment as confirmed</button>}
        {role === 'store' && <div className="order-action-card"><strong>Vendor controls</strong><p>Confirm payment and move the package through preparation.</p>{!order.payment.confirmed && <button className="commerce-primary wide" onClick={doPayment}>Confirm payment</button>}{order.payment.confirmed && order.status === 'Paid' && <button className="commerce-primary wide" onClick={doAdvance}>Mark preparing</button>}{order.status === 'Preparing' && !order.riderEmail && <p className="action-note">Waiting for Super Admin to assign a rider.</p>}</div>}
        {role === 'admin' && <div className="order-action-card"><strong>Super Admin controls</strong><p>Assign the rider only when the package is ready for delivery.</p>{!order.riderEmail ? <div className="rider-assign">{getRiders().map((rider) => <button className="commerce-secondary wide" key={rider.email} onClick={() => assign(rider.email)}>Assign {rider.name}</button>)}</div> : <div className="assigned-rider"><strong>Assigned rider</strong><span>{order.riderName}</span><small>{order.riderEmail}</small></div>}{order.riderEmail && order.status === 'Rider assigned' && <button className="commerce-primary wide" onClick={doAdvance}>Mark picked up</button>}{order.status === 'Picked up' && <button className="commerce-primary wide" onClick={doAdvance}>Start transit</button>}{order.status === 'In transit' && <button className="commerce-primary wide" onClick={doAdvance}>Mark delivered</button>}</div>}
        {role === 'rider' && order.riderEmail === session?.email && <div className="order-action-card"><strong>Rider controls</strong><p>You are assigned to this package. You can now chat and update delivery progress.</p>{order.status === 'Rider assigned' && <button className="commerce-primary wide" onClick={doAdvance}>Mark picked up</button>}{order.status === 'Picked up' && <button className="commerce-primary wide" onClick={doAdvance}>Start transit</button>}{order.status === 'In transit' && <button className="commerce-primary wide" onClick={doAdvance}>Mark delivered</button>}</div>}
      </aside></div>
    </main>
  </>
}

function OrderList({ role, onOpen }: { role: CommerceRole; onOpen: (id: string) => void }) {
  const session = getSession()
  const orders = getOrders().filter((order) => {
    if (role === 'admin') return true
    if (role === 'customer') return order.customerEmail === session?.email
    if (role === 'store') return order.vendorOwnerEmail === session?.email
    return order.riderEmail === session?.email
  })
  return <><Header title={role === 'customer' ? 'My orders' : role === 'store' ? 'Store orders' : role === 'rider' ? 'Assigned deliveries' : 'Platform orders'} subtitle="Every order has its own conversation and tracking timeline." /><main className="commerce-main"><div className="order-list">{orders.map((order) => <button className="order-list-card" key={order.id} onClick={() => onOpen(order.id)}><div><span className="tracking-id">{order.id}</span><h3>{order.vendorName}</h3><p>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p></div><div><strong>{formatMoney(order.total)}</strong><span className="order-status">{order.status}</span></div><span>→</span></button>)}{!orders.length && <div className="empty-commerce">No orders are available for this account yet.</div>}</div></main></>
}

export function OrderCenter({ role, orderId, mode = 'list' }: { role: RoleKey; orderId?: string; mode?: 'shop' | 'list' | 'order' }) {
  const commerceRole = role as CommerceRole
  const session = getSession()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [step, setStep] = useState<'vendors' | 'shop' | 'checkout'>('vendors')

  const openOrder = (id: string) => go(`/${roleSegment[role]}/order/${id}`)
  const back = () => go(`/${roleSegment[role]}/dashboard`)

  if (mode === 'order' && orderId) return <OrderDetail orderId={orderId} role={commerceRole} onBack={() => go(`/${roleSegment[role]}/orders`)} />
  if (mode === 'list' && role !== 'customer') return <OrderList role={commerceRole} onOpen={openOrder} />
  if (mode === 'list' && role === 'customer') return <OrderList role="customer" onOpen={openOrder} />

  const create = () => {
    if (!vendor || !items.length || !session) return
    const order = createOrder({ customerEmail: session.email, customerName: session.name, vendor, items })
    go(`/customer/order/${order.id}`)
  }

  if (step === 'vendors') return <><Header title="Browse vendors" subtitle="Choose one vendor at a time. Your cart cannot mix vendors." onBack={back} /><main className="commerce-main"><VendorList onSelect={(selected) => { setVendor(selected); setStep('shop') }} /></main></>
  if (step === 'shop' && vendor) return <VendorShop vendor={vendor} onCheckout={(selected) => { setItems(selected); setStep('checkout') }} onBack={() => setStep('vendors')} />
  if (step === 'checkout' && vendor) return <Checkout vendor={vendor} items={items} onCreate={create} onBack={() => setStep('shop')} />
  return null
}

export function AdminChatOverview() {
  const [query, setQuery] = useState('')
  const orders = useMemo(() => getOrders().filter((order) => !query || `${order.id} ${order.vendorName} ${order.customerName} ${order.riderName || ''}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <><Header title="Order conversations" subtitle="Super Admin can view every customer, vendor, and assigned-rider conversation." /><main className="commerce-main"><div className="admin-chat-tools"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order, customer, vendor or rider" /></div><div className="order-list">{orders.map((order) => <button className="order-list-card" key={order.id} onClick={() => go(`/super-admin/order/${order.id}`)}><div><span className="tracking-id">{order.id}</span><h3>{order.vendorName} · {order.customerName}</h3><p>{order.riderName ? `Rider: ${order.riderName}` : 'No rider assigned yet'}</p></div><div><span className="order-status">{order.status}</span><strong>{order.messages.length} messages</strong></div><span>→</span></button>)}{!orders.length && <div className="empty-commerce">No conversations yet.</div>}</div></main></>
}
