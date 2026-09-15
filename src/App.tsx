import { useEffect, useState } from 'react'
import { RoleSelection } from './pages/RoleSelection'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { AdminChatOverview, OrderCenter } from './pages/OrderCenterV2'
import { roleFromSegment, signInPath } from './lib/roles'
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

function BackButton({ fallback }: { fallback: string }) {
  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else window.location.hash = fallback
  }
  return <button className="global-back" onClick={goBack} aria-label="Go back">← <span>Back</span></button>
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute())

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.type === 'home') return <RoleSelection />
  if (route.type === 'admin-chats') return <div className="page-with-back"><BackButton fallback="/super-admin/dashboard" /><AdminChatOverview /></div>
  if (route.type === 'commerce') {
    const fallback = route.role === 'customer' ? '/customer/dashboard' : `/${route.role === 'store' ? 'store-admin' : route.role === 'admin' ? 'super-admin' : 'rider'}/dashboard`
    return <div className="page-with-back"><BackButton fallback={fallback} /><OrderCenter role={route.role} mode={route.mode} orderId={route.orderId} /></div>
  }
  if (route.type === 'dashboard') return <div className="page-with-back dashboard-back-wrap"><BackButton fallback={signInPath(route.role)} /><Dashboard role={route.role} /></div>
  if (route.type === 'signup' && route.role !== 'admin') return <SignUp role={route.role as Exclude<RoleKey, 'admin'>} />
  return <SignIn role={route.role} />
}
