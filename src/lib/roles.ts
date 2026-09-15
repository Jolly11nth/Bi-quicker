import type { RoleConfig, RoleKey } from './types'

export const roles: Record<RoleKey, RoleConfig> = {
  customer: {
    title: 'Customer', short: 'Customer', description: 'Browse stores, shop products, and track your orders',
    signin: 'Sign in to start shopping', intro: 'Browse thousands of stores, discover amazing products, and get everything delivered to your doorstep.',
    theme: 'blue', stats: [['1000+', 'Active Stores'], ['10K+', 'Products'], ['30 min', 'Avg. Delivery'], ['24/7', 'Support']],
    demoEmail: 'you@example.com', footer: "Don't have an account?", signup: 'Sign up', security: false,
  },
  store: {
    title: 'Store Admin', short: 'Store Owner', description: 'Manage your store, products, and orders',
    signin: 'Access your store dashboard', intro: 'Manage your store, products, and orders all in one place. Grow your business with Bi-quicker.',
    theme: 'orange', stats: [['50K+', 'Customers'], ['99%', 'Uptime'], ['₦0', 'Setup Fee'], ['24/7', 'Support']],
    demoEmail: 'store@example.com', footer: "Don't have a store yet?", signup: 'Register your store', security: false,
  },
  rider: {
    title: 'Rider', short: 'Delivery Rider', description: 'Accept deliveries and earn money on your schedule',
    signin: 'Access your rider dashboard', intro: 'Start delivering and earning on your own schedule. Your next delivery is just a tap away.',
    theme: 'green', stats: [['₦3500/hr', 'Avg. Earnings'], ['500+', 'Active Riders'], ['100%', 'Keep Your Tips'], ['24/7', 'Support']],
    demoEmail: 'rider@example.com', footer: 'Want to become a rider?', signup: 'Apply now', security: false,
  },
  admin: {
    title: 'Super Admin', short: 'Super Admin', description: 'Manage the entire platform and monitor operations',
    signin: 'Secure access to admin dashboard', intro: 'Manage the entire Bi-quicker platform. Monitor operations, manage users, and ensure smooth service delivery.',
    theme: 'purple', stats: [['1000+', 'Active Stores'], ['50K+', 'Customers'], ['500+', 'Riders'], ['100K+', 'Orders Completed']],
    demoEmail: 'admin@bi-quicker.com', footer: '', signup: '', security: true,
  },
}

export const roleFromSegment = (segment: string): RoleKey | null => {
  if (segment === 'store-admin') return 'store'
  if (segment === 'super-admin') return 'admin'
  if (segment === 'customer' || segment === 'rider') return segment
  return null
}

export const segmentFromRole = (role: RoleKey) => {
  if (role === 'store') return 'store-admin'
  if (role === 'admin') return 'super-admin'
  return role
}

export const signInPath = (role: RoleKey) => `/${segmentFromRole(role)}/signin`
export const signUpPath = (role: RoleKey) => `/${segmentFromRole(role)}/signup`
