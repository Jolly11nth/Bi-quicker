import { useMemo, useState, type CSSProperties } from 'react'
import { clearSession, getSession } from '../lib/storage'
import { roles, segmentFromRole, signInPath } from '../lib/roles'
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

const customerOrders = [
  ['BQ-1048', 'Fresh Basket', 'Groceries', '₦18,500', 'Out for delivery'],
  ['BQ-1042', 'Tech Hub', 'Wireless earbuds', '₦32,000', 'Delivered'],
  ['BQ-1035', 'Home Store', 'Kitchen set', '₦24,500', 'Delivered'],
]
const storeOrders = [['#2048', 'Amaka Johnson', '3 items', '₦28,500', 'New'], ['#2047', 'David Musa', '2 items', '₦14,200', 'Processing'], ['#2046', 'Grace Bello', '5 items', '₦41,000', 'Ready'], ['#2045', 'Ibrahim Ali', '1 item', '₦9,800', 'Completed']]
const riderDeliveries = [['BQ-2048', 'Fresh Basket', 'Wuse 2', '₦1,800', 'Available'], ['BQ-2047', 'Tech Hub', 'Garki', '₦2,100', 'Accepted'], ['BQ-2042', 'Home Store', 'Maitama', '₦1,650', 'Completed']]
const adminOrders = [['BQ-2048', 'Fresh Basket', 'Amaka Johnson', '₦18,500', 'Out for delivery'], ['BQ-2047', 'Tech Hub', 'David Musa', '₦32,000', 'Processing'], ['BQ-2046', 'Home Store', 'Grace Bello', '₦41,000', 'Completed'], ['BQ-2045', 'Market Square', 'Ibrahim Ali', '₦9,800', 'Cancelled']]

export function Dashboard({ role }: { role: RoleKey }) {
  const session = getSession()
  const [section, setSection] = useState<Section>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [available, setAvailable] = useState(true)
  const [orders, setOrders] = useState(storeOrders)
  const [products, setProducts] = useState([['P-1001', 'Premium Rice 25kg', '₦28,000', '42', 'Active'], ['P-1002', 'Cooking Oil 5L', '₦12,500', '18', 'Active'], ['P-1003', 'Breakfast Pack', '₦8,900', '0', 'Out of stock']])
  const config = roles[role]
  const name = session?.name || (role === 'admin' ? 'Super Admin' : labels[role])
  const items = nav[role]
  const roleAccent = accent[role]

  const visibleOrders = useMemo(() => {
    const source = role === 'customer' ? customerOrders : role === 'store' ? orders : role === 'rider' ? riderDeliveries : adminOrders
    if (!query.trim()) return source
    const q = query.toLowerCase()
    return source.filter(row => row.some(cell => cell.toLowerCase().includes(q)))
  }, [query, role, orders])

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const go = (next: Section) => {
    if (role === 'customer' && next === 'products') return void (window.location.hash = '/customer/shop')
    if (next === 'orders') return void (window.location.hash = `/${segmentFromRole(role)}/orders`)
    if (role === 'rider' && next === 'deliveries') return void (window.location.hash = '/rider/orders')
    setSection(next); setMobileOpen(false)
  }
  const logout = () => { clearSession(); window.location.hash = signInPath(role) }
  const addProduct = () => { setProducts(p => [...p, [`P-${1004 + p.length}`, 'New Bi-quicker Product', '₦10,000', '10', 'Active']]); notify('Product added to inventory.') }
  const updateOrder = (index: number) => { setOrders(rows => rows.map((row, i) => i === index ? [...row.slice(0, 4), row[4] === 'New' ? 'Processing' : row[4] === 'Processing' ? 'Ready' : 'Completed'] : row)); notify('Order status updated.') }

  const customerOverview = <>
    <section className="customer-hero">
      <div className="customer-hero-copy"><span className="hero-kicker">YOUR BI-QUICKER HOME</span><h2>Good afternoon, {name.split(' ')[0]} 👋</h2><p>Everything you need, from trusted stores to fast doorstep delivery.</p><div className="hero-actions"><button className="hero-primary" onClick={() => go('products')}>Start shopping <span>→</span></button><button className="hero-secondary" onClick={() => go('orders')}>Track an order</button></div></div>
      <div className="delivery-preview"><div className="delivery-top"><span className="live-dot" /> Live delivery</div><strong>Order BQ-1048</strong><p>Fresh Basket · Groceries</p><div className="delivery-route"><span>✓</span><i /><span>●</span><i /><span>⌂</span></div><div className="delivery-labels"><small>Preparing</small><small>On the way</small><small>Delivered</small></div><b>Arriving today</b></div>
    </section>
    <section className="customer-stats"><Stat value="₦18,500" label="Current order" icon="◷" /><Stat value="3" label="Total orders" icon="▤" /><Stat value="2" label="Saved addresses" icon="⌖" /><Stat value="₦64,200" label="Total spent" icon="₦" /></section>
    <section className="section-heading"><div><span className="section-eyebrow">EXPLORE</span><h3>Shop by category</h3><p>Find what you need faster.</p></div><button onClick={() => go('products')}>View all →</button></section>
    <section className="category-grid"><Category icon="🛒" title="Groceries" text="Fresh food & essentials" /><Category icon="📱" title="Electronics" text="Tech & accessories" /><Category icon="🏠" title="Home & Living" text="Make home better" /><Category icon="✨" title="Beauty" text="Personal care" /></section>
    <section className="customer-grid"><Panel title="Recent orders" action="View all" onAction={() => go('orders')}><OrderTable rows={customerOrders} headers={['Order', 'Store', 'Item', 'Total', 'Status']} /></Panel><Panel title="Quick actions"><div className="customer-actions"><button onClick={() => go('products')}><span>⌕</span><div><b>Browse stores</b><small>Discover products near you</small></div><em>→</em></button><button onClick={() => go('orders')}><span>▤</span><div><b>My orders</b><small>Track recent deliveries</small></div><em>→</em></button><button onClick={() => go('settings')}><span>⚙</span><div><b>Account settings</b><small>Manage your preferences</small></div><em>→</em></button></div></Panel></section>
  </>

  const overview = role === 'customer' ? customerOverview : role === 'store' ? <>
    <section className="role-hero store"><div><span>STORE OVERVIEW</span><h2>Good afternoon, {name.split(' ')[0]}.</h2><p>Your store is live. Here is what needs your attention today.</p></div><button onClick={addProduct}>＋ Add product</button></section><section className="customer-stats"><Stat value="₦486,200" label="Today's sales" icon="₦" /><Stat value="38" label="Orders today" icon="▤" /><Stat value="126" label="Products" icon="▦" /><Stat value="4.8/5" label="Store rating" icon="★" /></section><section className="customer-grid"><Panel title="Latest orders" action="Manage orders" onAction={() => go('orders')}><OrderTable rows={orders} headers={['Order','Customer','Items','Total','Status']} onRowAction={updateOrder} /></Panel><Panel title="Inventory alerts"><div className="alert-list"><div><b>Breakfast Pack</b><span>Out of stock</span><button onClick={() => go('products')}>Restock</button></div><div><b>Cooking Oil 5L</b><span>18 units left</span><button onClick={() => go('products')}>Review</button></div></div></Panel></section>
  </> : role === 'rider' ? <>
    <section className="role-hero rider"><div><span>RIDER STATUS</span><h2>Ready to ride, {name.split(' ')[0]}?</h2><p>{available ? 'You are visible to nearby delivery requests.' : 'You are offline and will not receive new requests.'}</p></div><button className={available ? 'availability on' : 'availability'} onClick={() => { setAvailable(v => !v); notify(available ? 'You are now offline.' : 'You are now available.') }}><span />{available ? 'Available' : 'Offline'}</button></section><section className="customer-stats"><Stat value="₦7,850" label="Today's earnings" icon="₦" /><Stat value="5" label="Deliveries" icon="⌁" /><Stat value="₦42,300" label="This month" icon="↗" /><Stat value="4.9/5" label="Rider rating" icon="★" /></section><section className="customer-grid"><Panel title="Delivery queue" action="View deliveries" onAction={() => go('deliveries')}><OrderTable rows={riderDeliveries} headers={['Order','Store','Area','Fee','Status']} /></Panel><Panel title="Earnings summary"><div className="earnings"><strong>₦42,300</strong><span>Monthly earnings</span><div><i /></div><small>72% of your ₦58,000 monthly goal</small></div></Panel></section>
  </> : <>
    <section className="role-hero admin"><div><span>PLATFORM CONTROL CENTER</span><h2>Welcome, {name}.</h2><p>Monitor operations, accounts, stores, riders, orders and customer support from one place.</p></div><button onClick={() => window.location.hash = '/super-admin/chats'}>Open conversations</button></section><section className="customer-stats"><Stat value="₦4.82M" label="Platform GMV" icon="₦" /><Stat value="12,480" label="Customers" icon="♙" /><Stat value="1,284" label="Active stores" icon="▦" /><Stat value="526" label="Active riders" icon="⌁" /></section><Panel title="Platform activity" action="View all orders" onAction={() => go('orders')}><OrderTable rows={adminOrders} headers={['Order','Store','Customer','Total','Status']} /></Panel>
  </>

  const renderSection = () => {
    if (section === 'overview') return overview
    if (section === 'settings') return <Panel title={role === 'admin' ? 'Platform settings' : 'Settings'}><div className="settings-form"><label>Account name<input value={name} readOnly /></label><label>Email<input value={session?.email || 'demo@example.com'} readOnly /></label><label>Role<input value={labels[role]} readOnly /></label><button onClick={() => notify('Settings are ready for backend persistence.')}>Save changes</button></div></Panel>
    if (section === 'products' && role === 'store') return <Panel title="Product inventory" action="＋ Add product" onAction={addProduct}><OrderTable rows={products} headers={['SKU','Product','Price','Stock','Status']} /></Panel>
    if (section === 'products' && role === 'customer') return <Panel title="Vendor marketplace" action="Open marketplace →" onAction={() => go('products')}><div className="empty-friendly"><span>🛍</span><h4>Choose a store and start your cart</h4><p>Browse vendors, compare products, checkout and chat with the store from the marketplace.</p></div></Panel>
    if (section === 'orders') return <Panel title={role === 'customer' ? 'My orders' : role === 'admin' ? 'All platform orders' : role === 'rider' ? 'Earnings & deliveries' : 'Store orders'}><OrderTable rows={visibleOrders} headers={role === 'customer' ? ['Order','Store','Item','Total','Status'] : role === 'rider' ? ['Order','Store','Area','Fee','Status'] : role === 'admin' ? ['Order','Store','Customer','Total','Status'] : ['Order','Customer','Items','Total','Status']} onRowAction={role === 'store' ? updateOrder : undefined} /></Panel>
    if (section === 'deliveries') return <Panel title="Delivery jobs"><OrderTable rows={riderDeliveries} headers={['Order','Store','Area','Fee','Status']} /></Panel>
    if (section === 'customers') return <Panel title="Customers"><OrderTable rows={[['C-1001','Amaka Johnson','amaka@example.com','24','Active'],['C-1002','David Musa','david@example.com','8','Active'],['C-1003','Grace Bello','grace@example.com','13','Active'],['C-1004','Ibrahim Ali','ibrahim@example.com','3','Pending']]} headers={['ID','Name','Email','Orders','Status']} /></Panel>
    if (section === 'stores') return <Panel title="Stores"><OrderTable rows={[['S-1001','Fresh Basket','1,284 orders','4.8/5','Active'],['S-1002','Tech Hub','926 orders','4.7/5','Active'],['S-1003','Home Store','712 orders','4.6/5','Active'],['S-1004','Market Square','198 orders','4.1/5','Review']]} headers={['ID','Store','Orders','Rating','Status']} /></Panel>
    if (section === 'riders') return <Panel title="Riders"><OrderTable rows={riderDeliveries.map((r, i) => [`R-${100+i}`, `${r[1]} Rider`, 'Wuse 2', '4.9/5', i === 0 ? 'Available' : 'On delivery'])} headers={['ID','Name','Area','Rating','Status']} /></Panel>
    return null
  }

  if (!session || session.role !== role) { window.location.hash = signInPath(role); return null }
  return <div className={`dashboard-page dashboard-${config.theme}`} style={{ '--dash-accent': roleAccent } as CSSProperties}>
    <aside className={`dashboard-sidebar ${mobileOpen ? 'open' : ''}`}><div className="dash-brand"><img src="/assets/bi-quicker-logo.png" alt="Bi-quicker" /><strong>Bi-quicker</strong></div><div className="role-badge"><span style={{ background: roleAccent }}>{labels[role][0]}</span><div><strong>{labels[role]}</strong><small>Signed in</small></div></div><nav>{items.map(item => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav><button className="logout" onClick={logout}>↪ <span>Sign out</span></button></aside>
    <main className="dashboard-main"><header className="dashboard-topbar"><button className="menu-button" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu">☰</button><div className="dash-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your dashboard..." /></div><div className="top-actions"><button onClick={() => notify('No new notifications.')}>♧</button><button className="profile-button" onClick={() => go('settings')}><span style={{ background: roleAccent }}>{name[0]}</span><b>{name}</b></button></div></header><div className="dashboard-content"><div className="breadcrumb"><span>Dashboard</span><b>/</b>{items.find(item => item.id === section)?.label || 'Overview'}</div>{renderSection()}</div></main>{toast && <div className="dash-toast">{toast}</div>}
  </div>
}

function Stat({ value, label, icon }: { value: string; label: string; icon: string }) { return <article className="customer-stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article> }
function Category({ icon, title, text }: { icon: string; title: string; text: string }) { return <button className="category-card"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><em>→</em></button> }
function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="dash-panel"><div className="panel-head"><div><h3>{title}</h3></div>{action && <button onClick={onAction}>{action}</button>}</div>{children}</section> }
function OrderTable({ rows, headers, onRowAction }: { rows: string[][]; headers: string[]; onRowAction?: (index: number) => void }) { return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}{onRowAction && <th>Action</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, i) => <td key={`${row[0]}-${i}`}>{i === row.length - 1 ? <span className={`status ${cell.toLowerCase().replaceAll(' ', '-')}`}>{cell}</span> : cell}</td>)}{onRowAction && <td><button className="table-action" onClick={() => onRowAction(index)}>Update</button></td>}</tr>)}</tbody></table></div> }
