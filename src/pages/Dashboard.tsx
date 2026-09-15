import { useMemo, useState } from 'react'
import { clearSession, getSession } from '../lib/storage'
import { roles, segmentFromRole, signInPath } from '../lib/roles'
import type { RoleKey } from '../lib/types'

const roleAccent: Record<RoleKey, string> = {
  customer: '#2563eb',
  store: '#ea580c',
  rider: '#16a34a',
  admin: '#9333ea',
}

const roleLabel: Record<RoleKey, string> = {
  customer: 'Customer',
  store: 'Store Admin',
  rider: 'Delivery Rider',
  admin: 'Super Admin',
}

type Section = 'overview' | 'orders' | 'products' | 'deliveries' | 'customers' | 'stores' | 'riders' | 'settings'

const navForRole: Record<RoleKey, { id: Section; label: string; icon: string }[]> = {
  customer: [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'orders', label: 'My Orders', icon: '▤' },
    { id: 'products', label: 'Browse Stores', icon: '⌕' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ],
  store: [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'orders', label: 'Orders', icon: '▤' },
    { id: 'products', label: 'Products', icon: '▦' },
    { id: 'customers', label: 'Customers', icon: '♙' },
    { id: 'settings', label: 'Store Settings', icon: '⚙' },
  ],
  rider: [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'deliveries', label: 'Deliveries', icon: '⌁' },
    { id: 'orders', label: 'Earnings', icon: '₦' },
    { id: 'settings', label: 'Profile & Settings', icon: '⚙' },
  ],
  admin: [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'orders', label: 'All Orders', icon: '▤' },
    { id: 'stores', label: 'Stores', icon: '▦' },
    { id: 'customers', label: 'Customers', icon: '♙' },
    { id: 'riders', label: 'Riders', icon: '⌁' },
    { id: 'settings', label: 'Platform Settings', icon: '⚙' },
  ],
}

const customerOrders = [
  ['BQ-1048', 'Fresh Basket', 'Groceries', '₦18,500', 'Out for delivery'],
  ['BQ-1042', 'Tech Hub', 'Wireless earbuds', '₦32,000', 'Delivered'],
  ['BQ-1035', 'Home Store', 'Kitchen set', '₦24,500', 'Delivered'],
]

const storeOrders = [
  ['#2048', 'Amaka Johnson', '3 items', '₦28,500', 'New'],
  ['#2047', 'David Musa', '2 items', '₦14,200', 'Processing'],
  ['#2046', 'Grace Bello', '5 items', '₦41,000', 'Ready'],
  ['#2045', 'Ibrahim Ali', '1 item', '₦9,800', 'Completed'],
]

const riderDeliveries = [
  ['BQ-2048', 'Fresh Basket', 'Wuse 2', '₦1,800', 'Available'],
  ['BQ-2047', 'Tech Hub', 'Garki', '₦2,100', 'Accepted'],
  ['BQ-2042', 'Home Store', 'Maitama', '₦1,650', 'Completed'],
]

const adminOrders = [
  ['BQ-2048', 'Fresh Basket', 'Amaka Johnson', '₦18,500', 'Out for delivery'],
  ['BQ-2047', 'Tech Hub', 'David Musa', '₦32,000', 'Processing'],
  ['BQ-2046', 'Home Store', 'Grace Bello', '₦41,000', 'Completed'],
  ['BQ-2045', 'Market Square', 'Ibrahim Ali', '₦9,800', 'Cancelled'],
]

export function Dashboard({ role }: { role: RoleKey }) {
  const session = getSession()
  const [section, setSection] = useState<Section>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [available, setAvailable] = useState(true)
  const [cart, setCart] = useState(0)
  const [orders, setOrders] = useState(storeOrders)
  const [products, setProducts] = useState([
    ['P-1001', 'Premium Rice 25kg', '₦28,000', '42', 'Active'],
    ['P-1002', 'Cooking Oil 5L', '₦12,500', '18', 'Active'],
    ['P-1003', 'Breakfast Pack', '₦8,900', '0', 'Out of stock'],
  ])

  const config = roles[role]
  const name = session?.name || (role === 'admin' ? 'Super Admin' : roleLabel[role])
  const nav = navForRole[role]
  const accent = roleAccent[role]

  const visibleOrders = useMemo(() => {
    const source = role === 'customer' ? customerOrders : role === 'store' ? orders : role === 'admin' ? adminOrders : riderDeliveries
    if (!query.trim()) return source
    const q = query.toLowerCase()
    return source.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)))
  }, [query, role, orders])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const logout = () => {
    clearSession()
    window.location.hash = signInPath(role)
  }

  const go = (next: Section) => {
    setSection(next)
    setMobileOpen(false)
  }

  const addProduct = () => {
    const id = `P-${1004 + products.length}`
    setProducts((items) => [...items, [id, 'New Bi-quicker Product', '₦10,000', '10', 'Active']])
    notify('Product added to your inventory.')
  }

  const updateOrder = (index: number) => {
    const next = orders.map((order, i) => {
      if (i !== index) return order
      const status = order[4] === 'New' ? 'Processing' : order[4] === 'Processing' ? 'Ready' : order[4] === 'Ready' ? 'Completed' : 'Completed'
      return [...order.slice(0, 4), status]
    })
    setOrders(next)
    notify('Order status updated.')
  }

  const renderOverview = () => {
    if (role === 'customer') return <>
      <section className="welcome-banner customer-banner"><div><span className="eyebrow">Good afternoon</span><h2>Welcome back, {name.split(' ')[0]}.</h2><p>Discover nearby stores and keep track of your latest orders.</p></div><button className="dash-primary" onClick={() => go('products')}>Start shopping <span>→</span></button></section>
      <StatGrid items={[['₦18,500', 'Current order'], ['3', 'Total orders'], ['2', 'Saved addresses'], ['₦64,200', 'Total spent']]} />
      <section className="dashboard-grid two"><Panel title="Recent orders" action="View all" onAction={() => go('orders')}><OrderTable rows={customerOrders} headers={['Order', 'Store', 'Items', 'Total', 'Status']} /></Panel><Panel title="Quick actions"><div className="quick-actions"><button onClick={() => go('products')}><span>⌕</span> Browse stores</button><button onClick={() => { setCart((n) => n + 1); notify('Sample item added to cart.') }}><span>＋</span> Add to cart</button><button onClick={() => go('settings')}><span>⚙</span> Account settings</button></div></Panel></section>
    </>

    if (role === 'store') return <>
      <section className="welcome-banner store-banner"><div><span className="eyebrow">Store overview</span><h2>Good afternoon, {name.split(' ')[0]}.</h2><p>Your store is live. Here is what needs your attention today.</p></div><button className="dash-primary" onClick={addProduct}>＋ Add product</button></section>
      <StatGrid items={[['₦486,200', 'Today’s sales'], ['38', 'Orders today'], ['126', 'Products'], ['4.8/5', 'Store rating']]} />
      <section className="dashboard-grid two"><Panel title="Latest orders" action="Manage orders" onAction={() => go('orders')}><OrderTable rows={orders.slice(0, 4)} headers={['Order', 'Customer', 'Items', 'Total', 'Status']} onRowAction={updateOrder} /></Panel><Panel title="Inventory alerts"><div className="alert-list"><div><strong>Breakfast Pack</strong><span>Out of stock</span><button onClick={() => go('products')}>Restock</button></div><div><strong>Cooking Oil 5L</strong><span>18 units left</span><button onClick={() => go('products')}>Review</button></div><div><strong>Rice 25kg</strong><span>42 units left</span><button onClick={() => go('products')}>Review</button></div></div></Panel></section>
    </>

    if (role === 'rider') return <>
      <section className="welcome-banner rider-banner"><div><span className="eyebrow">Rider status</span><h2>Ready to ride, {name.split(' ')[0]}?</h2><p>{available ? 'You are visible to nearby delivery requests.' : 'You are currently offline and will not receive new requests.'}</p></div><button className={`status-toggle ${available ? 'on' : ''}`} onClick={() => { setAvailable((v) => !v); notify(available ? 'You are now offline.' : 'You are now available.') }}><span /> {available ? 'Available' : 'Offline'}</button></section>
      <StatGrid items={[['₦7,850', 'Today’s earnings'], ['5', 'Deliveries'], ['₦42,300', 'This month'], ['4.9/5', 'Rider rating']]} />
      <section className="dashboard-grid two"><Panel title="Delivery queue" action="View deliveries" onAction={() => go('deliveries')}><OrderTable rows={riderDeliveries} headers={['Order', 'Store', 'Area', 'Fee', 'Status']} /></Panel><Panel title="Earnings summary"><div className="earnings-card"><strong>₦42,300</strong><span>Monthly earnings</span><div className="progress"><i style={{ width: '72%' }} /></div><small>72% of your ₦58,000 monthly goal</small></div></Panel></section>
    </>

    return <>
      <section className="welcome-banner admin-banner"><div><span className="eyebrow">Platform control center</span><h2>Welcome, {name}.</h2><p>Monitor Bi-quicker operations, accounts, stores, riders, and orders.</p></div><button className="dash-primary" onClick={() => go('stores')}>Manage platform</button></section>
      <StatGrid items={[['₦4.82M', 'Platform GMV'], ['12,480', 'Customers'], ['1,284', 'Active stores'], ['526', 'Active riders']]} />
      <section className="dashboard-grid three"><MiniMetric title="Orders today" value="1,248" detail="+12.8% vs yesterday" /><MiniMetric title="Delivery success" value="96.4%" detail="Within target" /><MiniMetric title="Support tickets" value="18" detail="6 need attention" /></section>
      <Panel title="Platform activity" action="View all orders" onAction={() => go('orders')}><OrderTable rows={adminOrders} headers={['Order', 'Store', 'Customer', 'Total', 'Status']} /></Panel>
    </>
  }

  const renderSection = () => {
    if (section === 'overview') return renderOverview()
    if (section === 'settings') return <Panel title={role === 'admin' ? 'Platform settings' : 'Settings'}><div className="settings-form"><label>Account name<input value={name} readOnly /></label><label>Email<input value={session?.email || 'demo@example.com'} readOnly /></label><label>Role<input value={roleLabel[role]} readOnly /></label><button className="dash-primary" onClick={() => notify('Settings are ready for backend persistence.')}>Save changes</button></div></Panel>
    if (section === 'products' && role === 'store') return <Panel title="Product inventory" action="＋ Add product" onAction={addProduct}><OrderTable rows={products} headers={['SKU', 'Product', 'Price', 'Stock', 'Status']} /></Panel>
    if (section === 'products' && role === 'customer') return <><div className="section-heading"><div><span className="eyebrow">Marketplace</span><h2>Browse stores</h2></div><span className="cart-pill">Cart: {cart}</span></div><div className="store-cards">{['Fresh Basket', 'Tech Hub', 'Home Store', 'Market Square'].map((store) => <article className="store-card" key={store}><div className="store-avatar">{store[0]}</div><div><h3>{store}</h3><p>4.8 ★ · 20–35 min</p><span>View products</span></div><button onClick={() => { setCart((n) => n + 1); notify(`${store} item added to cart.`) }}>＋</button></article>)}</div></>
    if (section === 'orders') {
      const headers = role === 'customer' ? ['Order', 'Store', 'Items', 'Total', 'Status'] : role === 'rider' ? ['Order', 'Store', 'Area', 'Fee', 'Status'] : ['Order', role === 'admin' ? 'Store' : 'Customer', role === 'admin' ? 'Customer' : 'Items', 'Total', 'Status']
      const rows = role === 'customer' ? customerOrders : role === 'rider' ? riderDeliveries : role === 'admin' ? adminOrders : orders
      return <Panel title={role === 'rider' ? 'Earnings & deliveries' : role === 'admin' ? 'All platform orders' : role === 'store' ? 'Store orders' : 'My orders'}><OrderTable rows={rows} headers={headers} onRowAction={role === 'store' ? updateOrder : undefined} /></Panel>
    }
    if (section === 'deliveries') return <Panel title="Delivery jobs"><OrderTable rows={riderDeliveries} headers={['Order', 'Store', 'Area', 'Fee', 'Status']} /></Panel>
    if (section === 'customers') return <Panel title="Customers"><OrderTable rows={[['C-1001', 'Amaka Johnson', 'amaka@example.com', '24', 'Active'], ['C-1002', 'David Musa', 'david@example.com', '8', 'Active'], ['C-1003', 'Grace Bello', 'grace@example.com', '13', 'Active'], ['C-1004', 'Ibrahim Ali', 'ibrahim@example.com', '3', 'Pending']]} headers={['ID', 'Name', 'Email', 'Orders', 'Status']} /></Panel>
    if (section === 'stores') return <Panel title="Stores"><OrderTable rows={[['S-1001', 'Fresh Basket', '1,284 orders', '4.8/5', 'Active'], ['S-1002', 'Tech Hub', '926 orders', '4.7/5', 'Active'], ['S-1003', 'Home Store', '712 orders', '4.6/5', 'Active'], ['S-1004', 'Market Square', '198 orders', '4.1/5', 'Review']]} headers={['ID', 'Store', 'Orders', 'Rating', 'Status']} /></Panel>
    if (section === 'riders') return <Panel title="Riders"><OrderTable rows={riderDeliveries.map((row, i) => [`R-${100 + i}`, row[1] + ' Rider', 'Wuse 2', '4.9/5', i === 0 ? 'Available' : 'On delivery'])} headers={['ID', 'Name', 'Area', 'Rating', 'Status']} /></Panel>
    return null
  }

  if (!session || session.role !== role) {
    window.location.hash = signInPath(role)
    return null
  }

  return <div className={`dashboard-page dashboard-${config.theme}`} style={{ '--dash-accent': accent } as React.CSSProperties}>
    <aside className={`dashboard-sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="dash-brand"><img src="/assets/bi-quicker-logo.png" alt="Bi-quicker" /><strong>Bi-quicker</strong></div>
      <div className="role-badge"><span style={{ background: accent }}>{roleLabel[role][0]}</span><div><strong>{roleLabel[role]}</strong><small>Signed in</small></div></div>
      <nav>{nav.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
      <button className="logout" onClick={logout}>↪ <span>Sign out</span></button>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-topbar"><button className="menu-button" onClick={() => setMobileOpen((v) => !v)} aria-label="Open menu">☰</button><div className="dash-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your dashboard..." /></div><div className="top-actions"><button onClick={() => notify('No new notifications.')}>♧</button><button className="profile-button" onClick={() => go('settings')}><span style={{ background: accent }}>{name[0]}</span><b>{name}</b></button></div></header>
      <div className="dashboard-content"><div className="breadcrumb">Dashboard <span>/</span> {nav.find((item) => item.id === section)?.label || 'Overview'}</div>{renderSection()}</div>
    </main>
    {toast && <div className="dash-toast">{toast}</div>}
  </div>
}

function StatGrid({ items }: { items: [string, string][] }) { return <section className="stat-grid">{items.map(([value, label]) => <article className="dash-stat" key={label}><strong>{value}</strong><span>{label}</span></article>)}</section> }

function MiniMetric({ title, value, detail }: { title: string; value: string; detail: string }) { return <article className="mini-metric"><span>{title}</span><strong>{value}</strong><small>{detail}</small></article> }

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="dash-panel"><div className="panel-head"><h3>{title}</h3>{action && <button onClick={onAction}>{action}</button>}</div>{children}</section> }

function OrderTable({ rows, headers, onRowAction }: { rows: string[][]; headers: string[]; onRowAction?: (index: number) => void }) { return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}{onRowAction && <th>Action</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${row[0]}-${cellIndex}`}><span className={cellIndex === row.length - 1 ? `status ${cell.toLowerCase().replaceAll(' ', '-')}` : ''}>{cell}</span></td>)}{onRowAction && <td><button className="table-action" onClick={() => onRowAction(index)}>Update</button></td>}</tr>)}</tbody></table></div> }

function AppPlaceholder() { return null }

void AppPlaceholder
