import type { RoleKey, Session } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const apiUrl = (path: string) => `${API_BASE_URL}${path}`

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('bi-quicker:token')
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
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

export interface ApiVendorProduct { id: string; name: string; description: string; price: number; stock: number }
export interface ApiVendor {
  id: string; name: string; category: string; rating: string; eta: string; ownerEmail: string
  paymentBank: string; paymentAccountName: string; paymentAccountNumber: string; products: ApiVendorProduct[]
}

export interface ApiOrder {
  id: string; customerEmail: string; customerName: string; vendorId: string; vendorName: string; vendorOwnerEmail: string
  items: Array<{ productId: string; name: string; price: number; quantity: number }>
  subtotal: number; maintenanceFee: number; maintenanceRate: number
  deliveryDistanceKm: number; deliveryMinutes: number; deliveryFee: number; total: number; status: string
  riderEmail?: string; riderName?: string
  payment: Record<string, unknown>; participants: Array<Record<string, unknown>>
  messages: Array<Record<string, unknown>>; tracking: Array<Record<string, unknown>>; createdAt: string
}

export const getVendorsApi = () => request<ApiVendor[]>('/api/vendors')
export const getOrdersApi = () => request<ApiOrder[]>('/api/orders')
export const getOrderApi = (id: string) => request<ApiOrder>(`/api/orders/${encodeURIComponent(id)}`)

export const createOrderApi = (vendorId: string, items: Array<{ productId: string; quantity: number }>) =>
  request<ApiOrder>('/api/orders', { method: 'POST', body: JSON.stringify({ vendorId, items }) })

export const addOrderMessageApi = (orderId: string, body: string) =>
  request<ApiOrder>(`/api/orders/${encodeURIComponent(orderId)}/messages`, { method: 'POST', body: JSON.stringify({ body }) })

export const advanceOrderApi = (orderId: string) =>
  request<ApiOrder>(`/api/orders/${encodeURIComponent(orderId)}/advance`, { method: 'POST' })

export const initializePaymentApi = (orderId: string) =>
  request<{ provider: string; reference: string; status: string; authorizationUrl: string; accessCode?: string; amount: number; currency: string }>(
    `/api/orders/${encodeURIComponent(orderId)}/payment/initialize`, { method: 'POST' },
  )

export const verifyPaymentApi = (orderId: string, reference: string) =>
  request<ApiOrder>(`/api/orders/${encodeURIComponent(orderId)}/payment/verify`, {
    method: 'POST', body: JSON.stringify({ reference }),
  })
