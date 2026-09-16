import { calculateMaintenanceFee, calculateRiderDeliveryFee, formatMoney, getVendors } from './lib/commerce'
import { getSavedRoute } from './lib/location'
import { getSession } from './lib/storage'

const parseMoney = (text: string) => Number(text.replace(/[^0-9.-]/g, '')) || 0

const updateCheckoutPricing = () => {
  const card = document.querySelector<HTMLElement>('.checkout-card')
  if (!card) return

  const subtotalRow = Array.from(card.querySelectorAll<HTMLElement>('.checkout-total')).find((row) => row.querySelector('span')?.textContent?.trim() === 'Subtotal')
  if (!subtotalRow) return

  const subtotal = parseMoney(subtotalRow.querySelector('strong')?.textContent || '')
  const maintenanceFee = calculateMaintenanceFee(subtotal)
  const session = getSession()
  const vendorName = card.querySelector('h2')?.textContent?.trim()
  const vendor = vendorName ? getVendors().find((item) => item.name === vendorName) : undefined
  const route = session?.email && vendor ? getSavedRoute(session.email, vendor.id) : null
  const rows = Array.from(card.querySelectorAll<HTMLElement>('.checkout-total'))
  const maintenanceRow = rows.find((row) => row.dataset.pricingRow === 'maintenance')
  const riderRow = rows.find((row) => row.dataset.pricingRow === 'rider')

  if (!maintenanceRow) {
    const row = document.createElement('div')
    row.className = 'checkout-total'
    row.dataset.pricingRow = 'maintenance'
    row.innerHTML = `<span>Bi-quicker maintenance (3%)</span><strong>${formatMoney(maintenanceFee)}</strong>`
    subtotalRow.insertAdjacentElement('afterend', row)
  } else {
    maintenanceRow.querySelector('strong')!.textContent = formatMoney(maintenanceFee)
  }

  const currentDelivery = rows.find((item) => item.querySelector('span')?.textContent?.trim() === 'Delivery')
  currentDelivery?.remove()

  if (route) {
    try {
      const deliveryFee = calculateRiderDeliveryFee(route.distanceKm)
      const deliveryLabel = `Rider delivery (${route.distanceKm.toFixed(1)} km · ${Math.round(route.durationMinutes)} min)`
      const row = riderRow || document.createElement('div')
      row.className = 'checkout-total'
      row.dataset.pricingRow = 'rider'
      row.innerHTML = `<span>${deliveryLabel}</span><strong>${formatMoney(deliveryFee)}</strong>`
      if (!riderRow) subtotalRow.parentElement?.querySelector('[data-pricing-row="maintenance"]')?.insertAdjacentElement('afterend', row)
      const grand = card.querySelector<HTMLElement>('.checkout-total.grand')
      if (grand) {
        grand.querySelector('span')!.textContent = 'Total payable'
        grand.querySelector('strong')!.textContent = formatMoney(subtotal + maintenanceFee + deliveryFee)
      }
    } catch {
      if (riderRow) riderRow.remove()
      const grand = card.querySelector<HTMLElement>('.checkout-total.grand')
      if (grand) {
        grand.querySelector('span')!.textContent = 'Total payable'
        grand.querySelector('strong')!.textContent = 'Distance pricing unavailable'
      }
    }
    return
  }

  const grand = card.querySelector<HTMLElement>('.checkout-total.grand')
  if (grand) {
    grand.querySelector('span')!.textContent = 'Total payable'
    grand.querySelector('strong')!.textContent = 'Waiting for location'
  }
}

const startPricingObserver = () => {
  updateCheckoutPricing()
  const observer = new MutationObserver(updateCheckoutPricing)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startPricingObserver, { once: true })
else startPricingObserver()
