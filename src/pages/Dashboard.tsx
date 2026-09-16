import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { clearSession, getSession } from '../lib/storage'
import { roles, segmentFromRole, signInPath } from '../lib/roles'
import {
  addVendorProduct,
  formatMoney,
  getOrders,
  getRiders,
  getVendors,
  type CommerceOrder,
  type VendorProduct,
} from '../lib/commerce'
import type { RoleKey } from '../lib/types'

const accent: Record<RoleKey, string> = { customer: '#2563eb', store: '#ea580c', rider: '#16a34a', admin: '#9333ea' }
const labels: Record<RoleKey, string> = { customer: 'Customer', store: 'Store Admin', rider: 'Delivery Rider', admin: 'Super Admin' }
type Section = 'overview' | 'orders' | 'products' | 'deliveries' | 'customers' | 'stores' | 'riders' | 'settings'

const nav: Record<RoleKey, { id: Section; label: string; icon: string }[]> = {
  customer: [{ id: 'overview', label: 'Overview', icon: '⌂' }, { id: 'orders', label: 'My Orders', icon: '▤' }, { id: 'products', label: 'Browse Stores', icon: '⌕' }, { id: 'settings', label: 'Settings', icon: '⚙' }],
  store: [{ id: 'overview', label: 'Overview', icon: '⌂' }, { id: 'orders', label: 'Orders', icon: '▤' }, { id: 'products', label: 'Products', icon: '▦' }, { id: 'customers', label: 'Customers', icon: '♙' }, { id: 'settings', label: 'Store Settings', icon: '⚙' }],
  rider: [{ id: 'overview', label: 'Overview', icon: '⌂' }, { id: 'deliveries', label: 'Deliveries', icon: '⌁' }, { id: 'orders', label: 'Earnings', icon: '₦' }, { id: 'settings', label: 'Profile & Settings', icon: '⚙' }],
  admin: [{ id: 'overview', label: 'Overview', icon: '⌂' }, { id: 'orders', label: 'All Orders', icon: '▤' }, { id: 'stores', label: 'Stores', icon: '▦' }, { id: 'customers', label: 'Customers', icon: '♙' }, { id: 'riders', label: 'Riders', icon: '⌁' }, { id: 'settings', label: 'Platform Settings', icon: '⚙' }],
}

const activeOrder = (order: CommerceOrder) => !['Delivered'].includes(order.status)
const openOrder = (id: string) => { window.location.hash = `/${id.startsWith('BQ-') ? 'customer' : 'customer'}/order/${id}` }

export function Dashboard({ role }: { role: RoleKey }) {
  const session = getSession()
  const [section, setSection] = useState<Section>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [available, setAvailable] = useState(true)
  const [version, setVersion] = useState(0)
  const config = roles[role]
  const name = session?.name || (role === 'admin' ? 'Super Admin' : labels[role])
  const items = nav[role]
  const roleAccent = accent[role]

  useEffect(() => {
    const onStorage = () => setVersion((v) => v + 1)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const orders = useMemo(() => {
    const all = getOrders()
    if (role === 'admin') return all
    if (role === 'customer') return all.filter((o) => o.customerEmail === session?.email)
    if (role === 'store') return all.filter((o) => o.vendorOwnerEmail === session?.email)
    return all.filter((o) => o.riderEmail === session?.email)
  }, [role, session?.email, version])

  const vendors = useMemo(() => getVendors(), [version])
  const store = role === 'store' ? vendors.find((vendor) => vendor.ownerEmail.toLowerCase() === session?.email?.toLowerCase()) : undefined
  const riders = getRiders()
  const visibleOrders = useMemo(() => {
    if (!query.trim()) return orders
    const q = query.toLowerCase()
    return orders.filter((order) => [order.id, order.vendorName, order.customerName, order.status, ...order.items.map((item) => item.name)].some((value) => value.toLowerCase().includes(q)))
  }, [orders, query])

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const go = (next: Section) => {
    if (role === 'customer' && next === 'products') return void (window.location.hash = '/customer/shop')
    if (next === 'orders') return void (window.location.hash = `/${segmentFromRole(role)}/orders`)
    if (role === 'rider' && next === 'deliveries') return void (window.location.hash = '/rider/orders')
    setSection(next); setMobileOpen(false)
  }
  const logout = () => { clearSession(); window.location.hash = signInPath(role) }

  const customerOrders = orders.slice(0, 4)
  const currentCustomerOrder = orders.find(activeOrder)
  const totalSpent = orders.filter((order) => order.payment.confirmed || order.status !== 'Awaiting payment').reduce((sum, order) => sum + order.total, 0)
  const uniqueStores = new Set(orders.map((order) => order.vendorId)).size
  const activeStoreOrders = orders.filter(activeOrder).length
  const deliveredStoreOrders = orders.filter((order) => order.status === 'Delivered').length
  const storeSales = orders.filter((order) => order.payment.confirmed).reduce((sum, order) => sum + order.total, 0)
  const activeRiderOrders = orders.filter(activeOrder).length
  const deliveredRiderOrders = orders.filter((order) => order.status === 'Delivered').length

  const addProduct = () => {
    if (!store) return notify('No store is linked to this account.')
    addVendorProduct(store.id, { name: 'New Bi-quicker Product', description: 'New product added from your dashboard.', price: 10000, stock: 10 })
    setVersion((v) => v + 1)
    notify('Product added to your store inventory.')
  }

  const customerOverview = <>
    <section className="customer-hero">
      <div className="customer-hero-copy">
        <span className="hero-kicker">YOUR BI-QUICKER HOME</span>
        <h2>Good afternoon, {name.split(' ')[0]} 👋</h2>
        <p>{currentCustomerOrder ? `Your latest order from ${currentCustomerOrder.vendorName} is ${currentCustomerOrder.status.toLowerCase()}.` : 'Everything you need, from trusted stores to fast doorstep delivery.'}</p>
        <div className="hero-actions"><button className="hero-primary" onClick={() => go('products')}>Start shopping <span>→</span></button><button className="hero-secondary" onClick={() => go('orders')}>Track an order</button></div>
      </div>
      <div className="delivery-preview">
        <div className="delivery-top"><span className="live-dot" /> {currentCustomerOrder ? 'Order update' : 'Ready to shop'}</div>
        {currentCustomerOrder ? <><strong>Order {currentCustomerOrder.id}</strong><p>{currentCustomerOrder.vendorName} · {currentCustomerOrder.items.length} item{currentCustomerOrder.items.length === 1 ? '' : 's'}</p><div className="delivery-route"><span>✓</span><i /><span>{currentCustomerOrder.status === 'Delivered' ? '✓' : '●'}</span><i /><span>⌂</span></div><div className="delivery-labels"><small>Placed</small><small>{currentCustomerOrder.status}</small><small>Delivered</small></div><b>{currentCustomerOrder.status === 'Delivered' ? 'Delivered successfully' : 'Track from your orders'}</b></> : <><strong>No active order</strong><p>Browse stores and place your first order.</p><div className="empty-delivery-action"><button className="hero-primary" onClick={() => go('products')}>Browse stores →</button></div></>}
      </div>
    </section>
    <section className="customer-stats"><Stat value={currentCustomerOrder ? formatMoney(currentCustomerOrder.total) : '—'} label="Current order" icon="◷" /><Stat value={String(orders.length)} label="Total orders" icon="▤" /><Stat value={String(uniqueStores)} label="Stores ordered from" icon="⌂" /><Stat value={formatMoney(totalSpent)} label="Total spent" icon="₦" /></section>
    <section className="section-heading"><div><span className="section-eyebrow">EXPLORE</span><h3>Shop by category</h3><p>Find what you need faster.</p></div><button onClick={() => go('products')}>View all →</button></section>
    <section className="category-grid"><Category icon="🛒" title="Groceries" text="Fresh food & essentials" onClick={() => go('products')} /><Category icon="📱" title="Electronics" text="Tech & accessories" onClick={() => go('products')} /><Category icon="🏠" title="Home & Living" text="Make home better" onClick={() => go('products')} /><Category icon="✨" title="Beauty" text="Personal care" onClick={() => go('products')} /></section>
    <section className="customer-grid"><Panel title="Recent orders" action="View all" onAction={() => go('orders')}><OrderTable orders={customerOrders} headers={['Order', 'Store', 'Item', 'Total', 'Status']} onRowClick={openOrder} /></Panel><Panel title="Quick actions"><div className="customer-actions"><QuickAction icon="⌕" title="Browse stores" text="Discover products near you" onClick={() => go('products')} /><QuickAction icon="▤" title="My orders" text="Track recent deliveries" onClick={() => go('orders')} /><QuickAction icon="⚙" title="Account settings" text="Manage your preferences" onClick={() => go('settings')} /></div></Panel></section>
  </>

  const overview = role === 'customer' ? customerOverview : role === 'store' ? <>
    <section className="role-hero store"><div><span>STORE OVERVIEW</span><h2>Good afternoon, {name.split(' ')[0]}.</h2><p>{store ? `${store.name} is connected and ready to receive customer orders.` : 'Your store account is ready for marketplace operations.'}</p></div><button onClick={addProduct}>＋ Add product</button></section>
    <section className="customer-stats"><Stat value={formatMoney(storeSales)} label="Confirmed sales" icon="₦" /><Stat value={String(orders.length)} label="Orders" icon="▤" /><Stat value={String(store?.products.length || 0)} label="Products" icon="▦" /><Stat value={String(activeStoreOrders)} label="Active orders" icon="◷" /></section>
    <section className="customer-grid"><Panel title="Latest orders" action="Manage orders" onAction={() => go('orders')}><OrderTable orders={orders.slice(0, 5)} headers={['Order','Customer','Items','Total','Status']} onRowClick={openOrder} /></Panel><Panel title="Inventory alerts"><InventoryAlerts products={store?.products || []} onManage={() => go('products')} /></Panel></section>
  </> : role === 'rider' ? <>
    <section className="role-hero rider"><div><span>RIDER STATUS</span><h2>Ready to ride, {name.split(' ')[0]}?</h2><p>{available ? 'You are visible to nearby delivery requests.' : 'You are offline and will not receive new requests.'}</p></div><button className={available ? 'availability on' : 'availability'} onClick={() => { setAvailable((v) => !v); notify(available ? 'You are now offline.' : 'You are now available.') }}><span />{available ? 'Available' : 'Offline'}</button></section>
    <section className="customer-stats"><Stat value={formatMoney(deliveredRiderOrders * 1800)} label="Estimated delivered fees" icon="₦" /><Stat value={String(activeRiderOrders)} label="Active deliveries" icon="⌁" /><Stat value={String(deliveredRiderOrders)} label="Delivered" icon="✓" /><Stat value={String(orders.length)} label="Assigned total" icon="▤" /></section>
    <section className="customer-grid"><Panel title="Delivery queue" action="View deliveries" onAction={() => go('deliveries')}><OrderTable orders={orders.slice(0, 5)} headers={['Order','Store','Area','Fee','Status']} onRowClick={openOrder} riderRows /></Panel><Panel title="Delivery summary"><div className="earnings"><strong>{activeRiderOrders}</strong><span>Active delivery assignments</span><div><i style={{ width: `${orders.length ? Math.min(100, (deliveredRiderOrders / orders.length) * 100) : 0}%` }} /></div><small>{deliveredRiderOrders} of {orders.length} assigned orders delivered</small></div></Panel></section>
  </> : <>
    <section className="role-hero admin"><div><span>PLATFORM CONTROL CENTER</span><h2>Welcome, {name}.</h2><p>Monitor operations, accounts, stores, riders, orders and customer support from one place.</p></div><button onClick={() => window.location.hash = '/super-admin/chats'}>Open conversations</button></section>
    <section className="customer-stats"><Stat value={formatMoney(orders.reduce((sum, order) => sum + order.total, 0))} label="Platform GMV" icon="₦" /><Stat value={String(new Set(orders.map((order) => order.customerEmail)).size)} label="Customers with orders" icon="♙" /><Stat value={String(vendors.length)} label="Active stores" icon="▦" /><Stat value={String(riders.length)} label="Riders" icon="⌁" /></section>
    <Panel title="Platform activity" action="View all orders" onAction={() => go('orders')}><OrderTable orders={orders.slice(0, 8)} headers={['Order','Store','Customer','Total','Status']} onRowClick={openOrder} /></Panel>
  </>

  const renderSection = () => {
    if (section === 'overview') return overview
    if (section === 'settings') return <Panel title={role === 'admin' ? 'Platform settings' : 'Settings'}><div className="settings-form"><label>Account name<input value={name} readOnly /></label><label>Email<input value={session?.email || 'demo@example.com'} readOnly /></label><label>Role<input value={labels[role]} readOnly /></label><button onClick={() => notify('Settings are ready for backend persistence.')}>Save changes</button></div></Panel>
    if (section === 'products' && role === 'store') return <Panel title={store ? `${store.name} inventory` : 'Product inventory'} action="＋ Add product" onAction={addProduct}><ProductTable products={store?.products || []} /></Panel>
    if (section === 'products' && role === 'customer') return <Panel title="Vendor marketplace" action="Open marketplace →" onAction={() => go('products')}><div className="empty-friendly"><span>🛍</span><h4>Choose a store and start your cart</h4><p>Browse vendors, compare products, checkout and chat with the store from the marketplace.</p><button className="commerce-primary" onClick={() => go('products')}>Open marketplace →</button></div></Panel>
    if (section === 'orders') return <Panel title={role === 'customer' ? 'My orders' : role === 'admin' ? 'All platform orders' : role === 'rider' ? 'Assigned deliveries & earnings' : 'Store orders'}><OrderTable orders={visibleOrders} headers={role === 'customer' ? ['Order','Store','Item','Total','Status'] : role === 'rider' ? ['Order','Store','Area','Fee','Status'] : role === 'admin' ? ['Order','Store','Customer','Total','Status'] : ['Order','Customer','Items','Total','Status']} onRowClick={openOrder} riderRows={role === 'rider'} /></Panel>
    if (section === 'deliveries') return <Panel title="Delivery jobs"><OrderTable orders={orders} headers={['Order','Store','Area','Fee','Status']} onRowClick={openOrder} riderRows /></Panel>
    if (section === 'customers') { const customers = Array.from(new Map(orders.map((order) => [order.customerEmail, order])).values()); return <Panel title="Customers with orders"><OrderTable orders={customers} headers={['Customer','Latest store','Latest order','Total','Status']} customerRows onRowClick={openOrder} /></Panel> }
    if (section === 'stores') return <Panel title="Stores"><StoreTable vendors={vendors} orders={getOrders()} onOpen={openOrder} /></Panel>
    if (section === 'riders') return <Panel title="Riders"><RiderTable riders={riders} orders={getOrders()} onOpen={openOrder} /></Panel>
    return null
  }

  if (!session || session.role !== role) { window.location.hash = signInPath(role); return null }
  return <div className={`dashboard-page dashboard-${config.theme}`} style={{ '--dash-accent': roleAccent } as CSSProperties}>
    <aside className={`dashboard-sidebar ${mobileOpen ? 'open' : ''}`}><div className="dash-brand"><img src="/assets/bi-quicker-logo.png" alt="Bi-quicker" /></div><div className="role-badge"><span style={{ background: roleAccent }}>{labels[role][0]}</span><div><strong>{labels[role]}</strong><small>Signed in</small></div></div><nav>{items.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav><button className="logout" onClick={logout}>↪ <span>Sign out</span></button></aside>
    <main className="dashboard-main"><header className="dashboard-topbar"><button className="menu-button" onClick={() => setMobileOpen((v) => !v)} aria-label="Open menu">☰</button><div className="dash-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your dashboard..." /></div><div className="top-actions"><button onClick={() => notify('No new notifications.')}>♧</button><button className="profile-button" onClick={() => go('settings')}><span style={{ background: roleAccent }}>{name[0]}</span><b>{name}</b></button></div></header><div className="dashboard-content"><div className="breadcrumb"><span>Dashboard</span><b>/</b><span>{items.find((item) => item.id === section)?.label || 'Overview'}</span></div>{renderSection()}</div></main>{toast && <div className="dash-toast" role="status">{toast}</div>}
  </div>
}

function Stat({ value, label, icon }: { value: string; label: string; icon: string }) { return <article className="customer-stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article> }
function Category({ icon, title, text, onClick }: { icon: string; title: string; text: string; onClick: () => void }) { return <button className="category-card" onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><em>→</em></button> }
function QuickAction({ icon, title, text, onClick }: { icon: string; title: string; text: string; onClick: () => void }) { return <button onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><em>→</em></button> }
function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) { return <section className="dash-panel"><div className="panel-head"><h3>{title}</h3>{action && <button onClick={onAction}>{action}</button>}</div>{children}</section> }

function OrderTable({ orders, headers, onRowClick, riderRows, customerRows }: { orders: CommerceOrder[]; headers: string[]; onRowClick?: (id: string) => void; riderRows?: boolean; customerRows?: boolean }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{orders.map((order) => {
    const cells = customerRows ? [order.customerName, order.vendorName, order.id, formatMoney(order.total), order.status] : riderRows ? [order.id, order.vendorName, 'Delivery', formatMoney(order.deliveryFee), order.status] : headers[1] === 'Customer' ? [order.id, order.customerName, `${order.items.length} item${order.items.length === 1 ? '' : 's'}`, formatMoney(order.total), order.status] : headers[2] === 'Customer' ? [order.id, order.vendorName, order.customerName, formatMoney(order.total), order.status] : [order.id, order.vendorName, order.items[0]?.name || 'Order', formatMoney(order.total), order.status]
    return <tr key={order.id} className={onRowClick ? 'is-clickable' : ''} onClick={() => onRowClick?.(order.id)}>{cells.map((cell, i) => <td key={`${order.id}-${i}`}>{i === cells.length - 1 ? <span className={`status ${cell.toLowerCase().replaceAll(' ', '-')}`}>{cell}</span> : cell}</td>)}</tr>
  })}</tbody></table>{!orders.length && <div className="table-empty">No orders available yet. <button onClick={() => window.location.hash = '/customer/shop'}>Start shopping →</button></div>}</div>
}

function ProductTable({ products }: { products: VendorProduct[] }) { return <div className="table-wrap"><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small className="table-secondary">{product.description}</small></td><td>{formatMoney(product.price)}</td><td>{product.stock}</td><td><span className={`status ${product.stock ? 'active' : 'out-of-stock'}`}>{product.stock ? 'Active' : 'Out of stock'}</span></td></tr>)}</tbody></table></div> }
function InventoryAlerts({ products, onManage }: { products: VendorProduct[]; onManage: () => void }) { const alerts = products.filter((product) => product.stock <= 5); return <div className="alert-list">{alerts.length ? alerts.slice(0, 4).map((product) => <div key={product.id}><b>{product.name}</b><span>{product.stock === 0 ? 'Out of stock' : `${product.stock} units left`}</span><button onClick={onManage}>Manage</button></div>) : <div className="inventory-ok"><b>Inventory looks healthy</b><span>No low-stock products need attention.</span></div>}</div> }
function StoreTable({ vendors, orders, onOpen }: { vendors: ReturnType<typeof getVendors>; orders: CommerceOrder[]; onOpen: (id: string) => void }) { return <div className="table-wrap"><table><thead><tr><th>Store</th><th>Category</th><th>Products</th><th>Orders</th><th>Status</th></tr></thead><tbody>{vendors.map((vendor) => <tr key={vendor.id}><td><strong>{vendor.name}</strong></td><td>{vendor.category}</td><td>{vendor.products.length}</td><td>{orders.filter((order) => order.vendorId === vendor.id).length}</td><td><span className="status active">Active</span></td></tr>)}</tbody></table></div> }
function RiderTable({ riders, orders, onOpen }: { riders: ReturnType<typeof getRiders>; orders: CommerceOrder[]; onOpen: (id: string) => void }) { return <div className="table-wrap"><table><thead><tr><th>Rider</th><th>Active</th><th>Delivered</th><th>Status</th></tr></thead><tbody>{riders.map((rider) => { const assigned = orders.filter((order) => order.riderEmail === rider.email); const active = assigned.filter(activeOrder).length; return <tr key={rider.email}><td><strong>{rider.name}</strong><small className="table-secondary">{rider.email}</small></td><td>{active}</td><td>{assigned.filter((order) => order.status === 'Delivered').length}</td><td><span className={`status ${active ? 'available' : 'completed'}`}>{active ? 'On delivery' : 'Available'}</span></td></tr> })}</tbody></table></div> }
