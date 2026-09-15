import { useEffect } from 'react'
import { autoAssignRider } from '../lib/riderAssignment'
import { getOrders } from '../lib/commerce'

/** Keeps the MVP workflow automatic: when an order reaches Rider assigned without a rider, assign one immediately. */
export function AutoRiderAssignment() {
  useEffect(() => {
    const assignReady = () => {
      getOrders().filter((order) => order.status === 'Rider assigned' && !order.riderEmail).forEach((order) => autoAssignRider(order.id))
    }
    assignReady()
    const timer = window.setInterval(assignReady, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return null
}
