/**
 * AgriBridge AI — Geospatial & Farm Digital Twin 2.0 Type Contracts (Phase 11)
 * Standardized data structures for Field Management, Crop Cycles, Soil Zones,
 * Temporal Satellite Observations, Management Zones, and Spatial Anomalies.
 */

export const LOCATION_QUALITY = {
  EXACT_BOUNDARY: 'EXACT_BOUNDARY',             // Verified parcel cadastral polygon
  APPROXIMATE_BOUNDARY: 'APPROXIMATE_BOUNDARY', // User sketched / approximate boundary
  POINT_LOCATION: 'POINT_LOCATION',             // GPS coordinates only (no boundary)
  REGION_ONLY: 'REGION_ONLY',                   // District/Taluka centroid
  UNKNOWN: 'UNKNOWN'
};

export const GEOMETRY_TYPES = {
  POINT: 'Point',
  POLYGON: 'Polygon',
  MULTI_POLYGON: 'MultiPolygon'
};

export const MANAGEMENT_ZONE_TYPES = {
  HIGH_VIGOR: 'HIGH_VIGOR',
  NORMAL: 'NORMAL',
  LOW_VIGOR: 'LOW_VIGOR',
  WATER_STRESS: 'WATER_STRESS',
  POTENTIAL_STRESS: 'POTENTIAL_STRESS'
};

export const CLOUD_STATUS = {
  CLEAR: 'CLEAR',
  PARTIALLY_CLOUDY: 'PARTIALLY_CLOUDY',
  CLOUDY: 'CLOUDY',
  INVALID: 'INVALID',
  UNAVAILABLE: 'UNAVAILABLE'
};

export const DRAINAGE_RISK_LEVELS = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
};

export const SPATIAL_EVENT_TYPES = {
  PLANTING: 'PLANTING',
  SATELLITE_CHANGE: 'SATELLITE_CHANGE',
  RAINFALL_EVENT: 'RAINFALL_EVENT',
  SOIL_SAMPLE: 'SOIL_SAMPLE',
  CROP_DOCTOR_CASE: 'CROP_DOCTOR_CASE',
  IRRIGATION: 'IRRIGATION',
  EXPERT_VISIT: 'EXPERT_VISIT',
  FARMER_ACTION: 'FARMER_ACTION',
  OUTCOME: 'OUTCOME'
};

/**
 * Creates a Field entity linked to a farm
 */
export function createField({
  fieldId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  name,
  geometry = null,
  areaHectares = 1.0,
  crop = 'General Crop',
  variety = 'Standard Variety',
  plantingDate = null,
  harvestDate = null,
  status = 'ACTIVE',
  soilZoneId = null,
  irrigationZoneId = null
}) {
  if (!farmId) throw new Error('Field: farmId is required');
  if (!name) throw new Error('Field: name is required');

  return {
    fieldId,
    farmId,
    name,
    geometry,
    areaHectares: Number(areaHectares) || 1.0,
    crop,
    variety,
    plantingDate,
    harvestDate,
    status,
    soilZoneId,
    irrigationZoneId,
    createdAt: new Date().toISOString()
  };
}

/**
 * Creates a Crop Cycle history record
 */
export function createCropCycle({
  cycleId = `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  fieldId,
  crop,
  variety = 'Standard Variety',
  season = 'Kharif',
  year = 2026,
  sowingDate,
  harvestDate = null,
  yieldQuantityTons = null,
  observedYieldStatus = 'RECORDED', // 'RECORDED' | 'NOT_REPORTED'
  soilAmendments = [],
  notes = ''
}) {
  if (!farmId) throw new Error('CropCycle: farmId is required');
  if (!fieldId) throw new Error('CropCycle: fieldId is required');
  if (!crop) throw new Error('CropCycle: crop is required');

  return {
    cycleId,
    farmId,
    fieldId,
    crop,
    variety,
    season,
    year: Number(year) || new Date().getFullYear(),
    sowingDate: sowingDate || new Date().toISOString().split('T')[0],
    harvestDate,
    yieldQuantityTons: yieldQuantityTons !== null ? Number(yieldQuantityTons) : null,
    observedYieldStatus,
    soilAmendments: Array.isArray(soilAmendments) ? soilAmendments : [],
    notes,
    createdAt: new Date().toISOString()
  };
}

/**
 * Creates a Soil Sampling Point observation
 */
export function createSoilSamplePoint({
  sampleId = `soil-pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  fieldId = null,
  location, // { lat, lng }
  depthCm = 15,
  pH = null,
  organicMatterPercent = null,
  nitrogenKgHa = null,
  phosphorusKgHa = null,
  potassiumKgHa = null,
  moisturePercent = null,
  samplingDate,
  source = 'LAB_TEST', // 'LAB_TEST' | 'USER_PROVIDED'
  labName = 'Accredited District Soil Testing Lab'
}) {
  if (!farmId) throw new Error('SoilSamplePoint: farmId is required');
  if (!location || location.lat === undefined || location.lng === undefined) {
    throw new Error('SoilSamplePoint: location with lat and lng is required');
  }

  return {
    sampleId,
    farmId,
    fieldId,
    location: {
      lat: Number(location.lat),
      lng: Number(location.lng)
    },
    depthCm: Number(depthCm) || 15,
    measurements: {
      pH: pH !== null ? Number(pH) : null,
      organicMatter: organicMatterPercent !== null ? Number(organicMatterPercent) : null,
      nitrogen: nitrogenKgHa !== null ? Number(nitrogenKgHa) : null,
      phosphorus: phosphorusKgHa !== null ? Number(phosphorusKgHa) : null,
      potassium: potassiumKgHa !== null ? Number(potassiumKgHa) : null,
      moisture: moisturePercent !== null ? Number(moisturePercent) : null
    },
    samplingDate: samplingDate || new Date().toISOString().split('T')[0],
    source,
    labName,
    createdAt: new Date().toISOString()
  };
}

/**
 * Creates a Temporal Satellite Observation Record
 */
export function createSatelliteObservation({
  observationId = `sat-obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  fieldId = null,
  acquisitionDate,
  retrievalDate = new Date().toISOString(),
  source = 'Sentinel-2 Multispectral L2A',
  cloudStatus = CLOUD_STATUS.CLEAR,
  cloudCoveragePercent = 5.0,
  indices = { ndvi: 0.70, ndwi: 0.25, evi: 0.55 },
  geometry = null,
  processingVersion = '2.4.0'
}) {
  if (!farmId) throw new Error('SatelliteObservation: farmId is required');
  if (!acquisitionDate) throw new Error('SatelliteObservation: acquisitionDate is required');

  return {
    observationId,
    farmId,
    fieldId,
    acquisitionDate,
    retrievalDate,
    source,
    cloudStatus,
    cloudCoveragePercent: Number(cloudCoveragePercent) || 0,
    indices: {
      ndvi: indices.ndvi !== undefined ? Number(indices.ndvi) : null,
      ndwi: indices.ndwi !== undefined ? Number(indices.ndwi) : null,
      evi: indices.evi !== undefined ? Number(indices.evi) : null
    },
    geometry,
    processingVersion,
    isValid: cloudStatus === CLOUD_STATUS.CLEAR || cloudStatus === CLOUD_STATUS.PARTIALLY_CLOUDY
  };
}

/**
 * Creates a Spatial Anomaly Record
 */
export function createSpatialAnomaly({
  anomalyId = `anom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  fieldId,
  detectedAt = new Date().toISOString(),
  anomalyType = 'VEGETATION_DECLINE', // 'VEGETATION_DECLINE' | 'WATER_DEFICIT' | 'THERMAL_SPIKE' | 'DRAINAGE_STRESS'
  severity = 'MODERATE',             // 'LOW' | 'MODERATE' | 'HIGH'
  affectedAreaHectares = 0.5,
  signalDrivers = [],
  confidence = 0.85,
  evidence = []
}) {
  if (!farmId) throw new Error('SpatialAnomaly: farmId is required');

  return {
    anomalyId,
    farmId,
    fieldId,
    detectedAt,
    anomalyType,
    severity,
    affectedAreaHectares: Number(affectedAreaHectares) || 0,
    signalDrivers: Array.isArray(signalDrivers) ? signalDrivers : [],
    confidence: Number(confidence) || 0.7,
    evidence: Array.isArray(evidence) ? evidence : []
  };
}
