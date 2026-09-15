import { useState, type FormEvent } from 'react'
import { AuthHeader, AuthLayout } from '../components/AuthLayout'
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/Icons'
import { Toast } from '../components/Toast'
import { roles, segmentFromRole, signUpPath } from '../lib/roles'
import { findAccount, saveSession } from '../lib/storage'
import type { RoleKey } from '../lib/types'

export function SignIn({ role }: { role: RoleKey }) {
  const config = roles[role]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!normalized || !password) return setToast({ message: 'Please fill in all fields.', type: 'error' })
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return setToast({ message: 'Please enter a valid email address.', type: 'error' })

    const account = findAccount(role, normalized)
    const isDemo = normalized === config.demoEmail && password === 'demo123'
    if (!isDemo && (!account || account.password !== password)) {
      return setToast({ message: 'Invalid email or password. Use the demo account or create an account first.', type: 'error' })
    }

    saveSession({ role, email: normalized, name: account?.name || (role === 'admin' ? 'Super Admin' : 'Demo User') })
    setToast({ message: 'Welcome back! Opening your dashboard...' })
    window.setTimeout(() => { window.location.hash = `/${segmentFromRole(role)}/dashboard` }, 450)
  }

  const fillDemo = () => {
    setEmail(config.demoEmail)
    setPassword('demo123')
    setToast({ message: 'Demo credentials filled in. Press Sign In to continue.' })
  }

  const sendReset = (event: FormEvent) => {
    event.preventDefault()
    const normalized = resetEmail.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return setToast({ message: 'Enter a valid email address.', type: 'error' })
    setResetMode(false)
    setResetEmail('')
    setToast({ message: `If an account exists for ${normalized}, reset instructions would be sent.` })
  }

  return <AuthLayout role={role}>
    <form className="auth-card" onSubmit={submit} noValidate>
      <AuthHeader role={role} mode="signin" />
      <div className="field">
        <label htmlFor="email">{role === 'admin' ? 'Admin Email' : 'Email'}</label>
        <div className="input-wrap"><MailIcon /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={config.demoEmail} autoComplete="email" /></div>
      </div>
      <div className="field">
        <div className="field-row">
          <label htmlFor="password">Password</label>
          <button className="link" type="button" onClick={() => setResetMode(true)}>{role === 'admin' ? 'Contact support' : 'Forgot password?'}</button>
        </div>
        <div className="input-wrap"><LockIcon /><input id="password" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" /><button className="eye" type="button" onClick={() => setShow((value) => !value)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOffIcon /> : <EyeIcon />}</button></div>
      </div>
      {config.security && <div className="security-note"><span className="security-icon">◆</span><span>This is a restricted area. All access attempts are logged and monitored.</span></div>}
      <button className="primary" type="submit">Sign In <ArrowRightIcon /></button>
      <div className="divider">Quick Demo</div>
      <button className="demo" type="button" onClick={fillDemo}>Sign in with Demo Account</button>
      {config.footer
        ? <div className="form-footer">{config.footer} <button type="button" onClick={() => { window.location.hash = signUpPath(role) }}>{config.signup}</button></div>
        : <div className="form-footer admin-note">Admin accounts are created by system administrators only.<br />Contact your IT department for access issues.</div>}
    </form>

    {resetMode && <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setResetMode(false)}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <button className="dialog-close" onClick={() => setResetMode(false)} aria-label="Close">×</button>
        <h2 id="reset-title">{role === 'admin' ? 'Contact support' : 'Reset password'}</h2>
        <p>{role === 'admin' ? 'Enter your admin email and your support team can help with access.' : 'Enter your email and we will prepare password reset instructions.'}</p>
        <form onSubmit={sendReset}><input className="dialog-input" type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="you@example.com" autoFocus /><button className="primary dialog-action" type="submit">Continue</button></form>
      </div>
    </div>}
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
  </AuthLayout>
}
