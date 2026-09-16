import type { RoleKey, Session } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const apiUrl = (path: string) => `${API_BASE_URL}${path}`

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`)
  return body as T
}

export const signInApi = (role: RoleKey, email: string, password: string) =>
  request<{ token: string; session: Session }>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ role, email, password }),
  })

export const signUpApi = (
  role: Exclude<RoleKey, 'admin'>,
  email: string,
  password: string,
  name: string,
  data: Record<string, string>,
) => request<{ status: string }>('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({ role, email, password, name, data }),
})

export interface ApiLocation {
  email: string
  role: RoleKey
  latitude: number
  longitude: number
}

export const saveLocationApi = (location: Omit<ApiLocation, 'email' | 'role'>, email: string, role: RoleKey) =>
  request<{ status: string }>('/api/locations', {
    method: 'POST',
    body: JSON.stringify({ ...location, email, role }),
  })

export const getLocationApi = (role: RoleKey, email: string) =>
  request<ApiLocation>(`/api/locations/${role}/${encodeURIComponent(email)}`)
