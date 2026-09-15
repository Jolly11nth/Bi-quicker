import type { RoleKey } from '../lib/types'
import { AdminIcon, CustomerIcon, RiderIcon, StoreIcon } from './Icons'

export function RoleIcon({ role, className = '' }: { role: RoleKey; className?: string }) {
  const Icon = role === 'customer' ? CustomerIcon : role === 'store' ? StoreIcon : role === 'rider' ? RiderIcon : AdminIcon
  const theme = role === 'customer' ? 'blue' : role === 'store' ? 'orange' : role === 'rider' ? 'green' : 'purple'
  return <span className={`role-icon ${theme} ${className}`}><Icon /></span>
}
