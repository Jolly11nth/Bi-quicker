import { useEffect, useState } from 'react'
import { requestCurrentLocation } from '../lib/location'
import { saveLocationApi } from '../lib/api'
import { getSession } from '../lib/storage'
import type { RoleKey } from '../lib/types'

export function LocationPermission({ role }: { role: 'customer' | 'store' }) {
  const session = getSession()
  const [state, setState] = useState<'idle' | 'requesting' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const request = async () => {
    if (!session?.email || session.role !== role) return
    setState('requesting')
    try {
      const location = await requestCurrentLocation()
      await saveLocationApi(location, session.email, role)
      setState('saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save your location.')
      setState('error')
    }
  }

  useEffect(() => {
    void request()
    // Request once for this signed-in account/role. The browser controls permission prompts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, role])

  if (!session?.email || session.role !== role || state === 'idle' || state === 'requesting' || state === 'saved') return null

  const label = role === 'store' ? 'Store location' : 'Delivery location'
  return (
    <div className="location-permission-banner" role="status">
      <div>
        <strong>{label} needed</strong>
        <p>{message}</p>
      </div>
      <button type="button" onClick={() => void request()}>Allow location</button>
    </div>
  )
}

export function StoreLocationPermission() {
  return <LocationPermission role="store" />
}

export function CustomerLocationPermission() {
  return <LocationPermission role="customer" />
}
