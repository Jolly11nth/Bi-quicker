import { assignRider, getOrder, getOrders, getRiders } from './commerce'

/** Development MVP automatic assignment: choose the rider with the fewest active deliveries. */
export const autoAssignRider = (orderId: string) => {
  const order = getOrder(orderId)
  if (!order || order.riderEmail) return order
  const activeStatuses = new Set(['Rider assigned', 'Picked up', 'In transit'])
  const orders = getOrders()
  const ranked = getRiders().map((rider) => ({
    rider,
    load: orders.filter((item) => item.riderEmail === rider.email && activeStatuses.has(item.status)).length,
  })).sort((a, b) => a.load - b.load)
  const selected = ranked[0]?.rider
  return selected ? assignRider(orderId, selected.email) : order
}
