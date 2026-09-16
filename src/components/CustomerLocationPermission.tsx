import { useEffect, useState } from 'react'
import { getVendors } from '../lib/commerce'
import { getRoadRoute } from '../lib/routing'
import { customerLocationKey, getSavedLocation, requestCurrentLocation, saveLocation, saveRoute } from '../lib/location'
import { getLocationApi, saveLocationApi } from '../lib/api'
import { getSession } from '../lib/storage'

/** Requests the customer's browser location and prepares route estimates for vendors whose locations are available. */
export function CustomerLocationPermission() {
  const session = getSession()
  const [state, setState] = useState<'idle' | 'requesting' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const request = async () => {
    if (!session?.email || session.role !== 'customer') return
    setState('requesting')
    try {
      const location = await requestCurrentLocation()
      await saveLocationApi(location, session.email, 'customer')
      saveLocation(customerLocationKey(session.email), location)
      setState('saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save your location.')
      setState('error')
    }
  }

  useEffect(() => {
    if (!session?.email) return
    const existing = getSavedLocation(customerLocationKey(session.email))
    if (existing) {
      setState('saved')
      return
    }
    void request()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email])

  useEffect(() => {
    if (state !== 'saved' || !session?.email) return
    let cancelled = false
    const prepareRoutes = async () => {
      let customer = getSavedLocation(customerLocationKey(session.email))
      if (!customer) {
        try {
          customer = await getLocationApi('customer', session.email)
        } catch {
          return
        }
      }
      for (const vendor of getVendors()) {
        if (cancelled) return
        try {
          const vendorLocation = await getLocationApi('store', vendor.ownerEmail)
          const route = await getRoadRoute(customer, vendorLocation)
          saveRoute(session.email, vendor.id, route)
        } catch {
          // A route can fail for one vendor without blocking the marketplace.
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
      <button type="button" onClick={() => void request()}>Allow location</button>
    </div>
  )
}
