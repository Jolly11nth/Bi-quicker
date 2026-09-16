import { useEffect, useState } from 'react'
import { getSavedLocation, requestCurrentLocation, saveLocation, vendorLocationKey } from '../lib/location'
import { getSession } from '../lib/storage'

/** Requests the store owner's browser location while they are signed in as a store admin. */
export function StoreLocationPermission() {
  const session = getSession()
  const [state, setState] = useState<'idle' | 'requesting' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!session?.email) return
    const key = vendorLocationKey(session.email)
    if (getSavedLocation(key)) {
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

  if (state === 'idle' || state === 'requesting' || state === 'saved') return null

  return (
    <div className="location-permission-banner" role="status">
      <div>
        <strong>Store location needed</strong>
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!session?.email) return
          setState('requesting')
          requestCurrentLocation()
            .then((location) => {
              saveLocation(vendorLocationKey(session.email), location)
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
