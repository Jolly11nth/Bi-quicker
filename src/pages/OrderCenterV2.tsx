import { useEffect, useMemo, useState } from 'react'
import { getSession } from '../lib/storage'
import {
  addOrderMessageApi,
  advanceOrderApi,
  createOrderApi,
  getOrderApi,
  getOrdersApi,
  getVendorsApi,
  initializePaymentApi,
  verifyPaymentApi,
  type ApiOrder,
  type ApiVendor,
} from '../lib/api'
import { formatMoney } from '../lib/commerce'
import type { RoleKey } from '../lib/types'

type CommerceRole = 'customer' | 'store' | 'rider' | 'admin'
type CommerceMode = 'shop' | 'list' | 'order'
const roleNames: Record<CommerceRole, string> = { customer: 'Customer', store: 'Store Admin', rider: 'Delivery Rider', admin: 'Super Admin' }
const go = (path: string) => { window.location.hash = path }

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack?: () => void }) {
  return <header className="commerce-header"><div className="commerce-header-inner">{onBack && <button className="commerce-back" onClick={onBack}>← Back</button>}<div><span className="commerce-kicker">Bi-quicker</span><h1>{title}</h1><p>{subtitle}</p></div></div></header>
}

function Loading({ text = 'Loading…' }: { text?: string }) { return <main className="commerce-main narrow"><div className="empty-commerce">{text}</div></main> }
function ErrorBox({ message }: { message: string }) { return <main className="commerce-main narrow"><div className="empty-commerce"><strong>Something went wrong</strong><p>{message}</p></div></main> }

function VendorList({ onSelect }: { onSelect: (vendor: ApiVendor) => void }) {
  const [vendors, setVendors] = useState<ApiVendor[]>([])
  const [error, setError] = useState('')
  useEffect(() => { void getVendorsApi().then(setVendors).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load stores.')) }, [])
  if (error) return <ErrorBox message={error} />
  if (!vendors.length) return <Loading text="Loading stores…" />
  return <main className="commerce-main"><div className="commerce-grid vendors-grid">{vendors.map((vendor) => <button className="vendor-card" key={vendor.id} onClick={() => onSelect(vendor)}><div className="vendor-avatar">{vendor.name.slice(0, 1)}</div><div className="vendor-card-main"><div className="vendor-title"><h3>{vendor.name}</h3><span>★ {vendor.rating}</span></div><p>{vendor.category}</p><small>{vendor.eta} delivery · {vendor.products.length} products</small></div><span className="vendor-arrow">→</span></button>)}</div></main>
}

function VendorShop({ vendor, onCheckout, onBack }: { vendor: ApiVendor; onCheckout: (items: Array<{ productId: string; name: string; price: number; quantity: number }>) => void; onBack: () => void }) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const items = vendor.products.filter((p) => (cart[p.id] || 0) > 0).map((p) => ({ productId: p.id, name: p.name, price: p.price, quantity: cart[p.id] }))
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const change = (id: string, delta: number) => setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] || 0) + delta) }))
  return <><Header title={vendor.name} subtitle={`${vendor.category} · ★ ${vendor.rating} · ${vendor.eta} delivery`} onBack={onBack} /><main className="commerce-main"><div className="vendor-rule"><strong>Shopping from one vendor</strong><span>Pricing and stock are controlled by the store.</span></div><div className="commerce-grid products-grid">{vendor.products.map((product) => <article className="product-card" key={product.id}><div className="product-image">{product.name.slice(0, 1)}</div><div className="product-copy"><h3>{product.name}</h3><p>{product.description}</p><strong>{formatMoney(product.price)}</strong><small>{product.stock} in stock</small></div><div className="quantity"><button onClick={() => change(product.id, -1)} disabled={!cart[product.id]}>−</button><b>{cart[product.id] || 0}</b><button onClick={() => change(product.id, 1)} disabled={(cart[product.id] || 0) >= product.stock}>＋</button></div></article>)}</div><div className="commerce-cartbar"><div><span>{items.reduce((sum, item) => sum + item.quantity, 0)} items</span><strong>{formatMoney(subtotal)}</strong></div><button className="commerce-primary" disabled={!items.length} onClick={() => onCheckout(items)}>Continue to checkout →</button></div></main></>
}

function Checkout({ vendor, items, onCreate, onBack, busy, error }: { vendor: ApiVendor; items: Array<{ productId: string; name: string; price: number; quantity: number }>; onCreate: () => void; onBack: () => void; busy: boolean; error: string }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const maintenance = Math.round(subtotal * 0.03)
  return <><Header title="Review & checkout" subtitle={`Your order from ${vendor.name}`} onBack={onBack} /><main className="commerce-main narrow"><section className="checkout-card"><div className="checkout-head"><div><span className="commerce-kicker">Vendor</span><h2>{vendor.name}</h2></div><span className="single-vendor-badge">One vendor only</span></div>{items.map((item) => <div className="checkout-line" key={item.productId}><span>{item.quantity} × {item.name}</span><strong>{formatMoney(item.price * item.quantity)}</strong></div>)}<div className="checkout-total"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div className="checkout-total"><span>Bi-quicker maintenance (3%)</span><strong>{formatMoney(maintenance)}</strong></div><div className="checkout-total"><span>Rider delivery</span><strong>Calculated from route</strong></div><p className="checkout-note">The final delivery fee is calculated from the customer and vendor road distance. 0–5 km is ₦500; pricing above 5 km is not configured yet.</p>{error && <p className="checkout-note" role="alert">{error}</p>}<button className="commerce-primary wide" disabled={busy} onClick={onCreate}>{busy ? 'Creating order…' : 'Place order & continue to payment →'}</button></section></main></>
}

function PaymentPanel({ order, onRefresh }: { order: ApiOrder; onRefresh: (order: ApiOrder) => void }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const payment = order.payment
  const confirmed = Boolean(payment.confirmed)
  const reference = String(payment.reference || '')
  const pay = async () => {
    setBusy(true); setMessage('')
    try {
      const initialized = await initializePaymentApi(order.id)
      if (initialized.authorizationUrl) window.location.href = initialized.authorizationUrl
      else setMessage('The payment gateway did not return a checkout URL.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to initialize payment.') }
    finally { setBusy(false) }
  }
  const verify = async () => {
    setBusy(true); setMessage('')
    try { onRefresh(await verifyPaymentApi(order.id, reference)) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Payment verification failed.') }
    finally { setBusy(false) }
  }
  return <section className="payment-panel"><div><span className="commerce-kicker">Secure payment</span><h3>{confirmed ? `✓ Payment confirmed — ${formatMoney(order.total)}` : `Pay ${formatMoney(order.total)}`}</h3><p className="checkout-note">Payments are processed securely by Paystack. Bi-quicker never receives or stores your card details.</p></div><div className="payment-grid"><div><small>Amount</small><strong>{formatMoney(order.total)}</strong></div><div><small>Currency</small><strong>NGN</strong></div><div><small>Gateway</small><strong>Paystack</strong></div><div><small>Reference</small><strong>{reference}</strong></div></div>{!confirmed && <div className="modal-actions"><button className="commerce-primary" disabled={busy} onClick={pay}>{busy ? 'Opening secure checkout…' : 'Pay securely with Paystack'}</button><button className="commerce-secondary" disabled={busy || !reference} onClick={verify}>I have paid — verify payment</button></div>}{message && <p className="checkout-note" role="alert">{message}</p>}</section>
}

function Tracking({ order }: { order: ApiOrder }) {
  return <section className="tracking-card"><div className="section-title"><div><span className="commerce-kicker">Package tracking</span><h2>{order.status}</h2></div><span className="tracking-id">{order.id}</span></div><div className="tracking-line">{order.tracking.map((event) => <div className={`tracking-step ${event.done ? 'done' : ''}`} key={String(event.id)}><span className="tracking-dot">{event.done ? '✓' : ''}</span><div><strong>{String(event.label)}</strong><p>{String(event.detail)}</p>{event.at && <small>{new Date(String(event.at)).toLocaleString()}</small>}</div></div>)}</div></section>
}

function Chat({ order, role, onRefresh }: { order: ApiOrder; role: CommerceRole; onRefresh: () => void }) {
  const session = getSession(); const [text, setText] = useState(''); const [busy, setBusy] = useState(false)
  const canChat = role === 'admin' || order.participants.some((p) => p.role === role && p.email === session?.email)
  const send = async () => { if (!text.trim() || !canChat || busy) return; setBusy(true); try { await addOrderMessageApi(order.id, text.trim()); setText(''); onRefresh() } catch (e) { window.alert(e instanceof Error ? e.message : 'Unable to send message.') } finally { setBusy(false) } }
  return <section className="chat-card"><div className="chat-head"><div><span className="commerce-kicker">Order conversation</span><h2>Chat</h2></div><div className="participant-list">{order.participants.filter((p) => p.active).map((p) => <span key={String(p.email)} className={`participant ${String(p.role)}`}>{String(p.name)} · {roleNames[p.role as CommerceRole]}</span>)}{role === 'admin' && <span className="participant admin">You · Super Admin</span>}</div></div><div className="chat-messages">{order.messages.map((message) => <div key={String(message.id)} className={`chat-message ${message.senderEmail === session?.email ? 'mine' : ''}`}><span>{String(message.senderName)} · {message.senderRole === 'system' ? 'System' : roleNames[message.senderRole as CommerceRole]}</span><p>{String(message.body)}</p><small>{new Date(String(message.at)).toLocaleString()}</small></div>)}</div>{canChat ? <div className="chat-compose"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void send()} placeholder="Write a message…" /><button className="commerce-primary" disabled={busy} onClick={() => void send()}>Send</button></div> : <div className="chat-locked">You are not a participant in this order conversation.</div>}</section>
}

function OrderDetail({ orderId, role, onBack }: { orderId: string; role: CommerceRole; onBack: () => void }) {
  const [order, setOrder] = useState<ApiOrder | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const refresh = async () => { try { setOrder(await getOrderApi(orderId)); setError('') } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load order.') } }
  useEffect(() => { void refresh() }, [orderId])
  if (error && !order) return <ErrorBox message={error} />
  if (!order) return <Loading text="Loading order…" />
  const session = getSession(); const authorized = role === 'admin' || order.participants.some((p) => p.role === role && p.email === session?.email)
  if (!authorized) return <ErrorBox message="This order is not available to your account." />
  const advance = async () => { setBusy(true); try { setOrder(await advanceOrderApi(order.id)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update order.') } finally { setBusy(false) } }
  const storeAction = role === 'store' && order.vendorOwnerEmail === session?.email
  const riderAction = role === 'rider' && order.riderEmail === session?.email
  return <><Header title={`Order ${order.id}`} subtitle={`${order.vendorName} · ${formatMoney(order.total)}`} onBack={onBack} /><main className="commerce-main order-main"><div className="order-layout"><div><PaymentPanel order={order} onRefresh={setOrder} /><Chat order={order} role={role} onRefresh={() => void refresh()} /></div><aside className="order-side"><Tracking order={order} />{storeAction && <div className="order-action-card"><strong>Store controls</strong><p>Payment is verified automatically. Advance the order when your team completes each stage.</p>{order.status === 'Paid' && <button className="commerce-primary wide" disabled={busy} onClick={() => void advance()}>Mark preparing</button>}{order.status === 'Preparing' && <button className="commerce-primary wide" disabled={busy} onClick={() => void advance()}>Mark ready for pickup — auto-assign rider</button>}</div>}{riderAction && <div className="order-action-card"><strong>Rider controls</strong><p>You are assigned to this delivery.</p>{order.status === 'Rider assigned' && <button className="commerce-primary wide" disabled={busy} onClick={() => void advance()}>Mark picked up</button>}{order.status === 'Picked up' && <button className="commerce-primary wide" disabled={busy} onClick={() => void advance()}>Start transit</button>}{order.status === 'In transit' && <button className="commerce-primary wide" disabled={busy} onClick={() => void advance()}>Mark delivered</button>}</div>}{role === 'admin' && <div className="order-action-card"><strong>Super Admin oversight</strong><p>Platform-wide visibility. Rider assignment is automatic when the store marks an order ready for pickup.</p>{order.riderEmail && <div className="assigned-rider"><strong>Assigned rider</strong><span>{order.riderName}</span><small>{order.riderEmail}</small></div>}</div>}{error && <p className="checkout-note" role="alert">{error}</p>}</aside></div></main></>
}

function OrderList({ role, onOpen }: { role: CommerceRole; onOpen: (id: string) => void }) {
  const [orders, setOrders] = useState<ApiOrder[]>([]); const [error, setError] = useState('')
  useEffect(() => { void getOrdersApi().then(setOrders).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load orders.')) }, [])
  if (error) return <ErrorBox message={error} />
  return <><Header title={role === 'customer' ? 'My orders' : role === 'store' ? 'Store orders' : role === 'rider' ? 'Assigned deliveries' : 'Platform orders'} subtitle="Every order has secure payment, tracking and its own conversation." /><main className="commerce-main"><div className="order-list">{orders.map((order) => <button className="order-list-card" key={order.id} onClick={() => onOpen(order.id)}><div><span className="tracking-id">{order.id}</span><h3>{order.vendorName}</h3><p>{order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</p></div><div><strong>{formatMoney(order.total)}</strong><span className="order-status">{order.status}</span></div><span>→</span></button>)}{!orders.length && <div className="empty-commerce">No orders are available for this account yet.</div>}</div></main></>
}

export function OrderCenter({ role, mode, orderId }: { role: RoleKey; mode: CommerceMode; orderId?: string }) {
  const commerceRole = role as CommerceRole
  const [vendor, setVendor] = useState<ApiVendor | null>(null)
  const [items, setItems] = useState<Array<{ productId: string; name: string; price: number; quantity: number }>>([])
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  if (mode === 'order' && orderId) return <OrderDetail orderId={orderId} role={commerceRole} onBack={() => go(`/${role === 'store' ? 'store-admin' : role === 'rider' ? 'rider' : role === 'admin' ? 'super-admin' : 'customer'}/orders`)} />
  if (mode === 'list') return <OrderList role={commerceRole} onOpen={(id) => go(`/${role === 'store' ? 'store-admin' : role === 'rider' ? 'rider' : role === 'admin' ? 'super-admin' : 'customer'}/order/${id}`)} />
  if (!vendor) return <><Header title="Stores" subtitle="Choose a store and shop from one vendor." /><VendorList onSelect={setVendor} /></>
  if (!items.length) return <VendorShop vendor={vendor} onCheckout={setItems} onBack={() => setVendor(null)} />
  const create = async () => { setBusy(true); setError(''); try { const order = await createOrderApi(vendor.id, items.map((item) => ({ productId: item.productId, quantity: item.quantity }))); go(`/${role === 'customer' ? 'customer' : role === 'store' ? 'store-admin' : role === 'rider' ? 'rider' : 'super-admin'}/order/${order.id}`) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create order.') } finally { setBusy(false) } }
  return <Checkout vendor={vendor} items={items} onCreate={() => void create()} onBack={() => setItems([])} busy={busy} error={error} />
}

export function AdminChatOverview() {
  return <OrderList role="admin" onOpen={(id) => go(`/super-admin/order/${id}`)} />
}
