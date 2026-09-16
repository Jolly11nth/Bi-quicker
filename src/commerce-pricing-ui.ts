import { calculateMaintenanceFee, calculateRiderDeliveryFee, formatMoney } from './lib/commerce'

const parseMoney = (text: string) => Number(text.replace(/[^0-9.-]/g, '')) || 0

const updateCheckoutPricing = () => {
  const card = document.querySelector<HTMLElement>('.checkout-card')
  if (!card) return

  const subtotalRow = Array.from(card.querySelectorAll<HTMLElement>('.checkout-total')).find((row) => row.querySelector('span')?.textContent?.trim() === 'Subtotal')
  if (!subtotalRow) return

  const subtotal = parseMoney(subtotalRow.querySelector('strong')?.textContent || '')
  const maintenanceFee = calculateMaintenanceFee(subtotal)
  const deliveryFee = calculateRiderDeliveryFee(30)
  const total = subtotal + maintenanceFee + deliveryFee

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

  const deliveryLabel = `Rider delivery (≤30 min)`
  if (!riderRow) {
    const row = document.createElement('div')
    row.className = 'checkout-total'
    row.dataset.pricingRow = 'rider'
    row.innerHTML = `<span>${deliveryLabel}</span><strong>${formatMoney(deliveryFee)}</strong>`
    const currentDelivery = rows.find((item) => item.querySelector('span')?.textContent?.trim() === 'Delivery')
    currentDelivery?.remove()
    const latestMaintenance = card.querySelector<HTMLElement>('[data-pricing-row="maintenance"]')
    latestMaintenance?.insertAdjacentElement('afterend', row)
  } else {
    riderRow.querySelector('span')!.textContent = deliveryLabel
    riderRow.querySelector('strong')!.textContent = formatMoney(deliveryFee)
  }

  const grand = card.querySelector<HTMLElement>('.checkout-total.grand')
  if (grand) {
    grand.querySelector('span')!.textContent = 'Total payable'
    grand.querySelector('strong')!.textContent = formatMoney(total)
  }
}

const startPricingObserver = () => {
  updateCheckoutPricing()
  const observer = new MutationObserver(updateCheckoutPricing)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPricingObserver, { once: true })
} else {
  startPricingObserver()
}
