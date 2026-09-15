import type { Account, RoleKey, Session } from './types'

const ACCOUNTS_KEY = 'bi-quicker:accounts'
const SESSION_KEY = 'bi-quicker:session'

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const getAccounts = (): Account[] => read<Account[]>(ACCOUNTS_KEY, [])

export const saveAccount = (account: Account) => {
  const accounts = getAccounts().filter(
    (item) => !(item.role === account.role && item.email.toLowerCase() === account.email.toLowerCase()),
  )
  accounts.push(account)
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export const findAccount = (role: RoleKey, email: string) =>
  getAccounts().find(
    (account) => account.role === role && account.email.toLowerCase() === email.toLowerCase(),
  )

export const saveSession = (session: Session) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

export const getSession = (): Session | null => read<Session | null>(SESSION_KEY, null)
export const clearSession = () => localStorage.removeItem(SESSION_KEY)
