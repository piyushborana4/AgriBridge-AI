/**
 * AgriBridge AI — Geometry & Spatial Boundary Management Service (Phase 11)
 * Validates GeoJSON geometries (RFC 7946 EPSG:4326), tracks boundary versions,
 * computes bounding boxes/areas, and applies spatial privacy coarsening.
 */

import { LOCATION_QUALITY, GEOMETRY_TYPES } from './geospatialTypes.js';

// In-memory geometry registry with version tracking
const farmGeometryRegistry = new Map();

/**
 * Validates GeoJSON Geometry object
 * @param {object} geometry - { type: 'Point' | 'Polygon' | 'MultiPolygon', coordinates: [] }
 * @returns {{ isValid: boolean, error?: string, geometryType?: string }}
 */
export function validateGeoJSONGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') {
    return { isValid: false, error: 'Geometry object is required' };
  }

  const { type, coordinates } = geometry;
  if (!type || !Object.values(GEOMETRY_TYPES).includes(type)) {
    return { isValid: false, error: `Invalid geometry type: ${type}. Expected Point, Polygon, or MultiPolygon.` };
  }

  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return { isValid: false, error: 'Coordinates array is missing or empty' };
  }

  // 1. Point validation: [lng, lat]
  if (type === GEOMETRY_TYPES.POINT) {
    if (coordinates.length < 2 || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
      return { isValid: false, error: 'Point coordinates must be [longitude, latitude] numbers' };
    }
    const [lng, lat] = coordinates;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { isValid: false, error: `Coordinates out of WGS84 bounds: lat=${lat}, lng=${lng}` };
    }
    return { isValid: true, geometryType: type };
  }

  // 2. Polygon validation: [[[lng, lat], [lng, lat], ...]] (closed ring: first === last, at least 4 pts)
  if (type === GEOMETRY_TYPES.POLYGON) {
    const ring = coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      return { isValid: false, error: 'Polygon exterior ring must contain at least 4 coordinate pairs' };
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return { isValid: false, error: 'Polygon exterior ring must be closed (first coordinate equals last coordinate)' };
    }
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2 || pt[1] < -90 || pt[1] > 90 || pt[0] < -180 || pt[0] > 180) {
        return { isValid: false, error: `Invalid coordinate pair in polygon ring: ${JSON.stringify(pt)}` };
      }
    }
    return { isValid: true, geometryType: type };
  }

  // 3. MultiPolygon validation
  if (type === GEOMETRY_TYPES.MULTI_POLYGON) {
    for (const poly of coordinates) {
      const ring = poly[0];
      if (!Array.isArray(ring) || ring.length < 4) {
        return { isValid: false, error: 'MultiPolygon elements must contain at least 4 coordinate pairs' };
      }
    }
    return { isValid: true, geometryType: type };
  }

  return { isValid: true, geometryType: type };
}

/**
 * Registers or updates a Farm Geometry with version history
 * @param {object} params
 * @param {string} params.farmId
 * @param {object} params.geometry
 * @param {string} [params.locationQuality] - from LOCATION_QUALITY
 * @param {string} [params.source]
 * @returns {object} Stored geometry record
 */
export function setFarmGeometry({
  farmId,
  geometry,
  locationQuality = LOCATION_QUALITY.APPROXIMATE_BOUNDARY,
  source = 'Cadastral / Manual Boundary Ingest'
}) {
  if (!farmId) throw new Error('setFarmGeometry: farmId is required');

  const validation = validateGeoJSONGeometry(geometry);
  if (!validation.isValid) {
    throw new Error(`Invalid Farm Geometry: ${validation.error}`);
  }

  const existingHistory = farmGeometryRegistry.get(farmId) || [];
  const version = existingHistory.length + 1;

  const record = {
    farmId,
    version,
    geometry,
    locationQuality: geometry.type === GEOMETRY_TYPES.POINT ? LOCATION_QUALITY.POINT_LOCATION : locationQuality,
    source,
    effectiveFrom: new Date().toISOString(),
    bbox: calculateBoundingBox(geometry),
    isCurrent: true
  };

  // Mark prior versions as not current
  existingHistory.forEach(h => { h.isCurrent = false; });
  existingHistory.push(record);
  farmGeometryRegistry.set(farmId, existingHistory);

  return record;
}

/**
 * Gets current active geometry for a farm
 * @param {string} farmId
 * @returns {object|null}
 */
export function getFarmGeometry(farmId) {
  const history = farmGeometryRegistry.get(farmId);
  if (!history || history.length === 0) return null;
  return history.find(h => h.isCurrent) || history[history.length - 1];
}

/**
 * Gets geometry version history for audit and timeline
 * @param {string} farmId
 * @returns {Array<object>}
 */
export function getFarmGeometryHistory(farmId) {
  return farmGeometryRegistry.get(farmId) || [];
}

/**
 * Computes bounding box [minLng, minLat, maxLng, maxLat]
 * @param {object} geometry
 * @returns {Array<number>}
 */
export function calculateBoundingBox(geometry) {
  if (!geometry) return [0, 0, 0, 0];
  if (geometry.type === GEOMETRY_TYPES.POINT) {
    const [lng, lat] = geometry.coordinates;
    return [lng, lat, lng, lat];
  }

  let coords = [];
  if (geometry.type === GEOMETRY_TYPES.POLYGON) {
    coords = geometry.coordinates[0] || [];
  } else if (geometry.type === GEOMETRY_TYPES.MULTI_POLYGON) {
    coords = geometry.coordinates.flatMap(p => p[0]);
  }

  if (coords.length === 0) return [0, 0, 0, 0];

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });

  return [Number(minLng.toFixed(4)), Number(minLat.toFixed(4)), Number(maxLng.toFixed(4)), Number(maxLat.toFixed(4))];
}

/**
 * Coarsens geometry coordinates for spatial privacy preservation (~1.1 km precision)
 * @param {object} geometry
 * @param {number} decimals - Default 2
 * @returns {object} Coarsened geometry
 */
export function coarsenGeometry(geometry, decimals = 2) {
  if (!geometry) return null;
  const factor = Math.pow(10, decimals);

  const round = (val) => Math.round(val * factor) / factor;

  if (geometry.type === GEOMETRY_TYPES.POINT) {
    return {
      type: GEOMETRY_TYPES.POINT,
      coordinates: [round(geometry.coordinates[0]), round(geometry.coordinates[1])]
    };
  }

  if (geometry.type === GEOMETRY_TYPES.POLYGON) {
    return {
      type: GEOMETRY_TYPES.POLYGON,
      coordinates: geometry.coordinates.map(ring =>
        ring.map(([lng, lat]) => [round(lng), round(lat)])
      )
    };
  }

  return geometry;
}
