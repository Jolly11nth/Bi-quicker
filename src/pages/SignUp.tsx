import { useMemo, useState, type FormEvent } from 'react'
import { AuthHeader, AuthLayout } from '../components/AuthLayout'
import { ArrowRightIcon } from '../components/Icons'
import { Toast } from '../components/Toast'
import { roles, signInPath } from '../lib/roles'
import { findAccount, saveAccount } from '../lib/storage'
import type { RoleKey } from '../lib/types'

const fieldSets: Record<Exclude<RoleKey, 'admin'>, string[]> = {
  customer: ['Full Name', 'Email', 'Phone Number', 'Password', 'Confirm Password'],
  rider: ['Full Name', 'Email', 'Phone Number', 'Vehicle Type', 'License Number', 'City', 'Password', 'Confirm Password'],
  store: ['Owner Name', 'Email', 'Phone Number', 'Store Name', 'Store Category', 'Store Address', 'Password', 'Confirm Password'],
}

export function SignUp({ role }: { role: Exclude<RoleKey, 'admin'> }) {
  const fields = useMemo(() => fieldSets[role], [role])
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((field) => [field, ''])))
  const [agree, setAgree] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  const update = (field: string, value: string) => setValues((current) => ({ ...current, [field]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const missing = fields.find((field) => !values[field]?.trim())
    if (missing) return setToast({ message: `Please complete: ${missing}.`, type: 'error' })
    if (!/^\S+@\S+\.\S+$/.test(values.Email.trim())) return setToast({ message: 'Please enter a valid email address.', type: 'error' })
    if (values.Password.length < 6) return setToast({ message: 'Password must be at least 6 characters.', type: 'error' })
    if (values.Password !== values['Confirm Password']) return setToast({ message: 'Passwords do not match.', type: 'error' })
    if (!agree) return setToast({ message: 'Please accept the Terms of Service and Privacy Policy.', type: 'error' })
    if (findAccount(role, values.Email.trim())) return setToast({ message: 'An account with this email already exists for this role.', type: 'error' })

    const name = values['Full Name'] || values['Owner Name'] || 'User'
    saveAccount({ role, email: values.Email.trim().toLowerCase(), password: values.Password, name, data: values })
    setToast({ message: 'Account created successfully. Redirecting to sign in…' })
    window.setTimeout(() => { window.location.hash = signInPath(role) }, 900)
  }

  return <AuthLayout role={role}>
    <form className="auth-card signup-card" onSubmit={submit} noValidate>
      <AuthHeader role={role} mode="signup" />
      {fields.map((field) => {
        const password = field.toLowerCase().includes('password')
        const email = field === 'Email'
        return <div className="field" key={field}>
          <label htmlFor={`signup-${field}`}>{field}</label>
          <div className="input-wrap">
            <input id={`signup-${field}`} type={password ? 'password' : email ? 'email' : 'text'} value={values[field]} onChange={(event) => update(field, event.target.value)} placeholder={field} autoComplete={password ? 'new-password' : email ? 'email' : 'off'} />
          </div>
        </div>
      })}
      <label className="check-row"><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} /> <span>I agree to the Terms of Service and Privacy Policy</span></label>
      <button className="primary" type="submit">Create Account <ArrowRightIcon /></button>
      <div className="form-footer">Already have an account? <button type="button" onClick={() => { window.location.hash = signInPath(role) }}>Sign in</button></div>
    </form>
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
  </AuthLayout>
}
