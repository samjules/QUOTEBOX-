/**
 * IP → Geo resolution service.
 * Currently uses mock data. Swap for a real provider (ip-api, MaxMind, etc.) later.
 */

export interface GeoResult {
  city: string
  region: string
  postalCode: string
  country: string
  latitude: number
  longitude: number
}

/**
 * Mock resolver: deterministic geo based on IP hash.
 * Returns a semi-random US location from a set of 10 cities.
 */
const MOCK_LOCATIONS: GeoResult[] = [
  { city: 'New York', region: 'NY', postalCode: '10001', country: 'US', latitude: 40.7128, longitude: -74.006 },
  { city: 'Los Angeles', region: 'CA', postalCode: '90001', country: 'US', latitude: 34.0522, longitude: -118.2437 },
  { city: 'Chicago', region: 'IL', postalCode: '60601', country: 'US', latitude: 41.8781, longitude: -87.6298 },
  { city: 'Houston', region: 'TX', postalCode: '77001', country: 'US', latitude: 29.7604, longitude: -95.3698 },
  { city: 'Phoenix', region: 'AZ', postalCode: '85001', country: 'US', latitude: 33.4484, longitude: -112.074 },
  { city: 'Philadelphia', region: 'PA', postalCode: '19101', country: 'US', latitude: 39.9526, longitude: -75.1652 },
  { city: 'San Antonio', region: 'TX', postalCode: '78201', country: 'US', latitude: 29.4241, longitude: -98.4936 },
  { city: 'San Diego', region: 'CA', postalCode: '92101', country: 'US', latitude: 32.7157, longitude: -117.1611 },
  { city: 'Dallas', region: 'TX', postalCode: '75201', country: 'US', latitude: 32.7767, longitude: -96.797 },
  { city: 'Miami', region: 'FL', postalCode: '33101', country: 'US', latitude: 25.7617, longitude: -80.1918 },
]

function hashIp(ip: string): number {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash + ip.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export async function resolveIp(ip: string): Promise<GeoResult> {
  const idx = hashIp(ip) % MOCK_LOCATIONS.length
  return MOCK_LOCATIONS[idx]!
}
