import { useEffect, useState } from 'react'
import { getVendors } from '../lib/commerce'
import { getRoadRoute } from '../lib/routing'
import { customerLocationKey, getSavedLocation, requestCurrentLocation, saveLocation, vendorLocationKey } from '../lib/location'
import { getSession } from '../lib/storage'

/** Requests the customer's browser location and prepares route estimates for vendors whose locations are available. */
export function CustomerLocationPermission() {
  const session = getSession()
  const [state, setState] = useState<'idle' | 'requesting' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!session?.email) return
    const key = customerLocationKey(session.email)
    const existing = getSavedLocation(key)
    if (existing) {
      setState('saved')
      return
    }

    setState('requesting')
    requestCurrentLocation()
      .then((location) => {
        saveLocation(key, location)
        setState('saved')
      })
      .catch((error: Error) => {
        setMessage(error.message)
        setState('error')
      })
  }, [session?.email])

  useEffect(() => {
    if (state !== 'saved' || !session?.email) return
    const customer = getSavedLocation(customerLocationKey(session.email))
    if (!customer) return

    let cancelled = false
    const prepareRoutes = async () => {
      for (const vendor of getVendors()) {
        if (cancelled) return
        const vendorLocation = getSavedLocation(vendorLocationKey(vendor.ownerEmail))
        if (!vendorLocation) continue
        try {
          const route = await getRoadRoute(customer, vendorLocation)
          saveLocation(`route:${session.email.toLowerCase()}:${vendor.id}`, {
            latitude: route.distanceKm,
            longitude: route.durationMinutes,
          })
        } catch {
          // A route can fail for a particular vendor without blocking the marketplace.
        }
      }
    }
    void prepareRoutes()
    return () => { cancelled = true }
  }, [session?.email, state])

  if (state !== 'error') return null

  return (
    <div className="location-permission-banner" role="status">
      <div>
        <strong>Delivery location needed</strong>
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!session?.email) return
          setState('requesting')
          requestCurrentLocation()
            .then((location) => {
              saveLocation(customerLocationKey(session.email), location)
              setState('saved')
            })
            .catch((error: Error) => {
              setMessage(error.message)
              setState('error')
            })
        }}
      >
        Allow location
      </button>
    </div>
  )
}
