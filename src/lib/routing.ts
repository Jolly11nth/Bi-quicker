export interface Coordinates {
  latitude: number
  longitude: number
}

export interface RouteResult {
  distanceKm: number
  durationMinutes: number
}

const OSRM_BASE_URL = 'https://router.project-osrm.org'

/**
 * Calculate road distance and travel time using OSRM's public routing service.
 * Coordinates are sent as longitude,latitude as required by OSRM.
 */
export const getRoadRoute = async (from: Coordinates, to: Coordinates): Promise<RouteResult> => {
  const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`
  const response = await fetch(`${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=false`)

  if (!response.ok) {
    throw new Error(`Routing service returned HTTP ${response.status}`)
  }

  const data = await response.json() as {
    code?: string
    routes?: Array<{ distance?: number; duration?: number }>
  }

  const route = data.routes?.[0]
  if (data.code !== 'Ok' || !route || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new Error('No drivable route could be calculated for these locations.')
  }

  return {
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  }
}
