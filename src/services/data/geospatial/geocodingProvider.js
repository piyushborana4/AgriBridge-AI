/**
 * Geocoding & Geospatial Provider
 * Supports global location search, coordinate resolution, and GeoJSON farm parcel polygon generation.
 */

const PRESET_LOCATIONS = [
  { name: 'Nashik, Maharashtra, India', lat: 19.9975, lng: 73.7898, country: 'India', admin1: 'Maharashtra' },
  { name: 'Amritsar, Punjab, India', lat: 31.634, lng: 74.8723, country: 'India', admin1: 'Punjab' },
  { name: 'Dharwad, Karnataka, India', lat: 15.4589, lng: 75.0078, country: 'India', admin1: 'Karnataka' },
  { name: 'Indore, Madhya Pradesh, India', lat: 22.7196, lng: 75.8577, country: 'India', admin1: 'Madhya Pradesh' },
  { name: 'Ludhiana, Punjab, India', lat: 30.9010, lng: 75.8573, country: 'India', admin1: 'Punjab' },
  { name: 'Ribeirão Preto, São Paulo, Brazil', lat: -21.1767, lng: -47.8108, country: 'Brazil', admin1: 'São Paulo' },
  { name: 'Krasnodar, Russia', lat: 45.0393, lng: 38.9872, country: 'Russia', admin1: 'Krasnodar Krai' },
  { name: 'Heilongjiang, China', lat: 45.7567, lng: 126.6424, country: 'China', admin1: 'Heilongjiang' },
  { name: 'Free State, South Africa', lat: -28.4541, lng: 26.7968, country: 'South Africa', admin1: 'Free State' },
];

export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=6&language=en&format=json`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results.map(r => ({
          name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
          city: r.name,
          admin1: r.admin1 || '',
          country: r.country || '',
          lat: parseFloat(r.latitude.toFixed(4)),
          lng: parseFloat(r.longitude.toFixed(4)),
          elevation: r.elevation || 0,
        }));
      }
    }
  } catch (e) {
    console.warn('Geocoding API network issue, falling back to presets:', e);
  }

  // Filter preset locations
  return PRESET_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(cleanQuery) || 
    loc.country.toLowerCase().includes(cleanQuery)
  );
}

/**
 * Creates GeoJSON Polygon for a farm based on center coordinate and size in hectares
 */
export function generateFarmGeoJSON(farm) {
  if (!farm || !farm.lat || !farm.lng) return null;

  const lat = farm.lat;
  const lng = farm.lng;
  const sizeHa = farm.size || 10;
  
  // Approximate offset for hectare bounding box (1 ha ~ 100m x 100m)
  const radiusDegrees = Math.sqrt(sizeHa * 10000) / 111320 / 2;

  const coordinates = [
    [
      [lng - radiusDegrees, lat - radiusDegrees],
      [lng + radiusDegrees, lat - radiusDegrees],
      [lng + radiusDegrees, lat + radiusDegrees],
      [lng - radiusDegrees, lat + radiusDegrees],
      [lng - radiusDegrees, lat - radiusDegrees],
    ]
  ];

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates
    },
    properties: {
      id: farm.id,
      name: farm.name,
      size: `${sizeHa} ${farm.sizeUnit || 'hectares'}`,
      crops: farm.crops || [],
      soilType: farm.soilType,
      center: [lat, lng]
    }
  };
}
