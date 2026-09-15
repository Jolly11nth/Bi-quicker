export type RoleKey = 'customer' | 'store' | 'rider' | 'admin'

export interface RoleConfig {
  title: string
  short: string
  description: string
  signin: string
  intro: string
  theme: 'blue' | 'orange' | 'green' | 'purple'
  stats: [string, string][]
  demoEmail: string
  footer: string
  signup: string
  security: boolean
}

export interface Account {
  role: RoleKey
  email: string
  password: string
  name: string
  data: Record<string, string>
}

export interface Session {
  role: RoleKey
  email: string
  name: string
}
