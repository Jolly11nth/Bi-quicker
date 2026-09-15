import { useEffect, useState } from 'react'
import { RoleSelection } from './pages/RoleSelection'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { AdminChatOverview, OrderCenter } from './pages/OrderCenter'
import { roleFromSegment } from './lib/roles'
import type { RoleKey } from './lib/types'

type CommerceMode = 'shop' | 'list' | 'order'

type Route =
  | { type: 'home' }
  | { type: 'signin' | 'signup' | 'dashboard'; role: RoleKey }
  | { type: 'commerce'; role: RoleKey; mode: CommerceMode; orderId?: string }
  | { type: 'admin-chats' }

function parseRoute(): Route {
  const path = window.location.hash.replace(/^#/, '') || '/'
  if (path === '/') return { type: 'home' }

  const match = path.match(/^\/(customer|store-admin|rider|super-admin)\/(signin|signup|dashboard|shop|orders|order\/([^/]+))$/)
  if (!match) {
    if (path === '/super-admin/chats') return { type: 'admin-chats' }
    return { type: 'home' }
  }

  const role = roleFromSegment(match[1])!
  const segment = match[2]
  if (segment === 'shop') return { type: 'commerce', role, mode: 'shop' }
  if (segment === 'orders') return { type: 'commerce', role, mode: 'list' }
  if (segment.startsWith('order/')) return { type: 'commerce', role, mode: 'order', orderId: match[3] }
  return { type: segment as 'signin' | 'signup' | 'dashboard', role }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute())

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.type === 'home') return <RoleSelection />
  if (route.type === 'admin-chats') return <AdminChatOverview />
  if (route.type === 'commerce') return <OrderCenter role={route.role} mode={route.mode} orderId={route.orderId} />
  if (route.type === 'dashboard') return <Dashboard role={route.role} />
  if (route.type === 'signup' && route.role !== 'admin') return <SignUp role={route.role as Exclude<RoleKey, 'admin'>} />
  return <SignIn role={route.role} />
}
