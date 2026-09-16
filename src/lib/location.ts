export interface LocationCoordinates {
  latitude: number
  longitude: number
}

const LOCATION_PREFIX = 'bi-quicker:location:'

export const requestCurrentLocation = (): Promise<LocationCoordinates> => {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('Location services are not available in this browser.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location access was denied. Please allow location access to continue.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Your location could not be determined. Please try again.'
            : 'Location request timed out. Please try again.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

export const saveLocation = (key: string, location: LocationCoordinates) => {
  localStorage.setItem(`${LOCATION_PREFIX}${key}`, JSON.stringify(location))
}

export const getSavedLocation = (key: string): LocationCoordinates | null => {
  try {
    const raw = localStorage.getItem(`${LOCATION_PREFIX}${key}`)
    return raw ? JSON.parse(raw) as LocationCoordinates : null
  } catch {
    return null
  }
}

export const vendorLocationKey = (email: string) => `vendor:${email.toLowerCase()}`
export const customerLocationKey = (email: string) => `customer:${email.toLowerCase()}`
