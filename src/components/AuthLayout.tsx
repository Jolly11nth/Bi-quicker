import type { ReactNode } from 'react'
import type { RoleKey } from '../lib/types'
import { roles } from '../lib/roles'
import { Logo } from './Logo'
import { RoleIcon } from './RoleIcon'
import { ArrowLeftIcon } from './Icons'

export function AuthLayout({ role, children }: { role: RoleKey; children: ReactNode }) {
  const config = roles[role]
  const isSignup = window.location.hash.endsWith('/signup')

  return <section className={`auth-page theme-${config.theme}`}>
    <div className="auth-shell">
      <div className="auth-brand">
        <button className="back" onClick={() => { window.location.hash = '/' }}>
          <ArrowLeftIcon /> Back to role selection
        </button>
        <Logo small />
        <div className="brand-heading">
          <RoleIcon role={role} />
          <h1>{config.title} {isSignup ? 'Sign Up' : 'Sign In'}</h1>
        </div>
        <p className="brand-copy">{config.intro}</p>
        <div className="stats">
          {config.stats.map(([number, label]) => <div className="stat" key={label}>
            <strong>{number}</strong><span>{label}</span>
          </div>)}
        </div>
      </div>
      <div>
        <div className="mobile-brand">
          <button className="back" onClick={() => { window.location.hash = '/' }}>
            <ArrowLeftIcon /> Back
          </button>
          <Logo />
        </div>
        {children}
      </div>
    </div>
  </section>
}

export function AuthHeader({ role, mode }: { role: RoleKey; mode: 'signin' | 'signup' }) {
  const config = roles[role]
  return <>
    <div className="form-head"><RoleIcon role={role} /><h2>{mode === 'signin' ? `${config.title} Sign In` : `Create ${config.title} Account`}</h2></div>
    <p className="form-sub">{mode === 'signin' ? config.signin : 'Complete the form below to continue'}</p>
  </>
}
