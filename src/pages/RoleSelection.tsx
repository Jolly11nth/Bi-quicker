import { useState } from 'react'
import { Logo } from '../components/Logo'
import { RoleIcon } from '../components/RoleIcon'
import { roles, signInPath } from '../lib/roles'
import type { RoleKey } from '../lib/types'
import { LegalDialog } from '../components/LegalDialog'

export function RoleSelection() {
  const [legal, setLegal] = useState<'Terms of Service' | 'Privacy Policy' | null>(null)
  const roleList: RoleKey[] = ['customer', 'store', 'rider', 'admin']

  const go = (role: RoleKey) => { window.location.hash = signInPath(role) }

  return <section className="page role-page">
    <div className="role-shell">
      <header className="role-header">
        <Logo />
        <h1 className="role-title">Welcome to <span>Bi-quicker</span></h1>
        <p className="role-subtitle">Choose your role to get started</p>
      </header>
      <div className="roles">
        {roleList.map((role) => {
          const config = roles[role]
          return <article
            className="role-card"
            key={role}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go(role) }
            }}
          >
            <RoleIcon role={role} />
            <h2>{config.short}</h2>
            <p>{config.description}</p>
            <button className="primary" onClick={() => go(role)}>Continue as {config.short}</button>
          </article>
        })}
      </div>
      <footer className="role-footer">
        By continuing, you agree to our{' '}
        <button onClick={() => setLegal('Terms of Service')}>Terms of Service</button>{' '}and{' '}
        <button onClick={() => setLegal('Privacy Policy')}>Privacy Policy</button>
      </footer>
    </div>
    {legal && <LegalDialog title={legal} onClose={() => setLegal(null)} />}
  </section>
}
