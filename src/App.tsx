import { useEffect, useState } from 'react'
import { RoleSelection } from './pages/RoleSelection'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { roleFromSegment } from './lib/roles'
import type { RoleKey } from './lib/types'

function parseRoute() {
  const path = window.location.hash.replace(/^#/, '') || '/'
  const match = path.match(/^\/(customer|store-admin|rider|super-admin)\/(signin|signup|dashboard)$/)
  if (!match) return { type: 'home' as const }
  const role = roleFromSegment(match[1])!
  return { type: match[2] as 'signin' | 'signup' | 'dashboard', role }
}

export default function App() {
  const [route, setRoute] = useState(parseRoute())

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.type === 'home') return <RoleSelection />
  if (route.type === 'dashboard') return <Dashboard role={route.role} />
  if (route.type === 'signup' && route.role !== 'admin') {
    return <SignUp role={route.role as Exclude<RoleKey, 'admin'>} />
  }
  return <SignIn role={route.role} />
}
