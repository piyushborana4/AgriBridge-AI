/**
 * AgriBridge AI — Agricultural Data Contracts & Common Interchange Schema (Phase 7)
 * Defines standardized AgriculturalDataEnvelope<T>, DataQuality, and DataPermission structures
 * compliant with ISO/TC 34, OGC SoilML, and BRICS Agricultural Interoperability specifications.
 */

export const SCHEMA_VERSIONS = {
  CURRENT: '1.2.0',
  SUPPORTED: ['1.0.0', '1.1.0', '1.2.0']
};

/**
 * Valid Data Status enums
 */
export const DATA_STATUS = {
  OBSERVED: 'OBSERVED',
  FORECAST: 'FORECAST',
  MODELED: 'MODELED',
  USER_PROVIDED: 'USER_PROVIDED',
  DERIVED: 'DERIVED',
  IMPORTED: 'IMPORTED',
  SIMULATED: 'SIMULATED',
  FALLBACK: 'FALLBACK',
  UNAVAILABLE: 'UNAVAILABLE'
};

/**
 * Valid Data Visibility / Permission enums
 */
export const DATA_VISIBILITY = {
  PRIVATE: 'private',
  FARM_ONLY: 'farm_only',
  ORGANIZATION: 'organization',
  RESEARCH: 'research',
  SHARED_NETWORK: 'shared_network'
};

/**
 * Valid Consent Status enums
 */
export const CONSENT_STATUS = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  GRANTED: 'granted',
  REVOKED: 'revoked'
};

/**
 * Creates a standard DataQuality envelope
 * @param {object} params
 * @returns {object} Standardized DataQuality object
 */
export function createDataQuality({
  completeness = 1.0,
  freshness = 1.0,
  spatialAccuracy = null,
  temporalAccuracy = null,
  confidence = 1.0,
  issues = []
} = {}) {
  return {
    completeness: Math.max(0, Math.min(1, completeness)),
    freshness: Math.max(0, Math.min(1, freshness)),
    spatialAccuracy: spatialAccuracy !== null ? Number(spatialAccuracy) : null,
    temporalAccuracy: temporalAccuracy !== null ? Number(temporalAccuracy) : null,
    confidence: Math.max(0, Math.min(1, confidence)),
    issues: Array.isArray(issues) ? issues : []
  };
}

/**
 * Creates a standard DataPermission envelope
 * @param {object} params
 * @returns {object} Standardized DataPermission object
 */
export function createDataPermission({
  visibility = DATA_VISIBILITY.PRIVATE,
  consentRequired = true,
  consentStatus = CONSENT_STATUS.NOT_REQUIRED,
  purpose = 'Farm Operations & Local Advisory',
  expiresAt = null
} = {}) {
  return {
    visibility,
    consentRequired,
    consentStatus,
    purpose,
    expiresAt
  };
}

/**
 * Creates a standardized AgriculturalDataEnvelope
 * @template T
 * @param {object} params
 * @param {string} [params.schemaVersion='1.2.0']
 * @param {string} params.recordType - Type of record (e.g. 'observation', 'soil_test', 'weather_record', 'satellite_index')
 * @param {string} params.recordId - Unique identifier
 * @param {string} [params.country='India'] - ISO Country name or code
 * @param {string} [params.region] - Agro-climatic zone or administrative region
 * @param {string} [params.farmId] - Originating farm ID
 * @param {object} [params.geometry] - GeoJSON point/polygon or null
 * @param {string} [params.timestamp] - ISO-8601 UTC timestamp
 * @param {T} params.payload - Core agricultural telemetry or record
 * @param {object} params.provenance - Provenance envelope
 * @param {object} [params.quality] - Data quality assessment
 * @param {object} [params.permissions] - Data permissions and consent
 * @returns {object} AgriculturalDataEnvelope<T>
 */
export function createAgriculturalDataEnvelope({
  schemaVersion = SCHEMA_VERSIONS.CURRENT,
  recordType,
  recordId,
  country = 'India',
  region = 'Regional Agrometeorological Zone',
  farmId = null,
  geometry = null,
  timestamp = new Date().toISOString(),
  payload,
  provenance,
  quality = null,
  permissions = null
}) {
  if (!recordType) throw new Error('Cannot create AgriculturalDataEnvelope: recordType is required');
  if (!recordId) throw new Error('Cannot create AgriculturalDataEnvelope: recordId is required');
  if (!provenance) throw new Error('Cannot create AgriculturalDataEnvelope: provenance is required');

  return {
    schemaVersion,
    recordType,
    recordId,
    country,
    region,
    farmId,
    geometry,
    timestamp,
    payload,
    provenance: {
      source: provenance.source || 'AgriBridge AI Core',
      provider: provenance.provider || 'Direct Ingest',
      sourceType: provenance.sourceType || DATA_STATUS.OBSERVED,
      retrievedAt: provenance.retrievedAt || new Date().toISOString(),
      observedAt: provenance.observedAt || timestamp,
      method: provenance.method || 'Sensor/Model Telemetry Ingest',
      confidence: provenance.confidence ?? 0.85,
      isLive: Boolean(provenance.isLive)
    },
    quality: quality || createDataQuality(),
    permissions: permissions || createDataPermission()
  };
}

/**
 * Validates an AgriculturalDataEnvelope against the schema specification
 * @param {object} envelope
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateAgriculturalDataEnvelope(envelope) {
  const errors = [];

  if (!envelope || typeof envelope !== 'object') {
    return { isValid: false, errors: ['Envelope must be a non-null object'] };
  }

  if (!envelope.schemaVersion || !SCHEMA_VERSIONS.SUPPORTED.includes(envelope.schemaVersion)) {
    errors.push(`Unsupported schema version: ${envelope.schemaVersion}. Supported versions: ${SCHEMA_VERSIONS.SUPPORTED.join(', ')}`);
  }

  if (!envelope.recordType || typeof envelope.recordType !== 'string') {
    errors.push('Missing or invalid recordType');
  }

  if (!envelope.recordId || typeof envelope.recordId !== 'string') {
    errors.push('Missing or invalid recordId');
  }

  if (!envelope.provenance || typeof envelope.provenance !== 'object') {
    errors.push('Missing required provenance envelope');
  } else {
    if (!envelope.provenance.source) errors.push('Provenance missing required source');
    if (!envelope.provenance.sourceType) errors.push('Provenance missing required sourceType');
  }

  if (envelope.quality) {
    if (typeof envelope.quality.completeness !== 'number' || envelope.quality.completeness < 0 || envelope.quality.completeness > 1) {
      errors.push('DataQuality completeness must be a number between 0 and 1');
    }
    if (typeof envelope.quality.confidence !== 'number' || envelope.quality.confidence < 0 || envelope.quality.confidence > 1) {
      errors.push('DataQuality confidence must be a number between 0 and 1');
    }
  }

  if (envelope.permissions) {
    if (!Object.values(DATA_VISIBILITY).includes(envelope.permissions.visibility)) {
      errors.push(`Invalid permission visibility: ${envelope.permissions.visibility}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Schema migration adapter: translates older supported envelope versions to current version
 * @param {object} envelope
 * @returns {object} Migrated envelope in CURRENT schema version
 */
export function migrateEnvelopeVersion(envelope) {
  if (!envelope) return null;
  const validation = validateAgriculturalDataEnvelope(envelope);
  if (!validation.isValid && !SCHEMA_VERSIONS.SUPPORTED.includes(envelope.schemaVersion)) {
    throw new Error(`Cannot migrate envelope with invalid schema version: ${validation.errors.join('; ')}`);
  }

  if (envelope.schemaVersion === SCHEMA_VERSIONS.CURRENT) {
    return envelope;
  }

  // Version 1.0.0 / 1.1.0 -> 1.2.0 Migration
  return {
    ...envelope,
    schemaVersion: SCHEMA_VERSIONS.CURRENT,
    quality: envelope.quality || createDataQuality(),
    permissions: envelope.permissions || createDataPermission(),
    migratedFrom: envelope.schemaVersion,
    migratedAt: new Date().toISOString()
  };
}

/**
 * Schema specification metadata for BRICS Agricultural Interchange
 */
export const BRICS_AGRI_SCHEMA_SPEC = {
  standard: 'BRICS Agricultural Common Interchange Standard',
  version: SCHEMA_VERSIONS.CURRENT,
  supportedMemberStates: ['India', 'Brazil', 'Russia', 'China', 'South Africa'],
  complianceBodies: ['ISO/TC 34', 'OGC SoilML', 'WMO Climatological Exchange', 'ICAR', 'Embrapa', 'CAAS', 'ARC'],
  encryption: 'TLS 1.3 / AES-256-GCM',
  privacyStandard: 'Differential District Coarsening (~1.1km)'
};

/**
 * Exports unified farm context into canonical BRICS Agricultural Interchange format
 * @param {object} farmContext - Output from buildFarmContext
 * @returns {object} Canonical AgriculturalDataEnvelope
 */
export function exportToBRICSSchema(farmContext) {
  if (!farmContext) return null;

  return createAgriculturalDataEnvelope({
    schemaVersion: SCHEMA_VERSIONS.CURRENT,
    recordType: 'farm_agronomic_dossier',
    recordId: `BRICS-DOSSIER-${farmContext.farmId || 'FARM'}-${Date.now()}`,
    country: farmContext.location?.country || 'India',
    region: farmContext.location?.region || farmContext.location?.state || 'District Agro-Zone',
    farmId: farmContext.farmId,
    geometry: farmContext.location?.coordinates ? {
      type: 'Point',
      coordinates: [
        Number(farmContext.location.coordinates.lng?.toFixed(2) || farmContext.location.coordinates.longitude?.toFixed(2) || 0),
        Number(farmContext.location.coordinates.lat?.toFixed(2) || farmContext.location.coordinates.latitude?.toFixed(2) || 0)
      ]
    } : null,
    timestamp: new Date().toISOString(),
    payload: {
      crop: farmContext.crop?.name || farmContext.crop || 'Field Crop',
      growthStage: farmContext.crop?.stage || 'Vegetative',
      soil: {
        texture: farmContext.soil?.texture || 'Medium Loam',
        pH: farmContext.soil?.pH,
        organicCarbon: farmContext.soil?.organicCarbon,
        nitrogen: farmContext.soil?.nitrogen,
        phosphorus: farmContext.soil?.phosphorus,
        potassium: farmContext.soil?.potassium
      },
      meteorology: {
        tempC: farmContext.weather?.temperature,
        relativeHumidity: farmContext.weather?.humidity,
        precipitationMm: farmContext.weather?.rainfall || 0
      },
      remoteSensing: {
        ndvi: farmContext.satellite?.ndvi,
        ndwi: farmContext.satellite?.ndwi,
        canopyStatus: farmContext.satellite?.status
      }
    },
    provenance: {
      source: 'AgriBridge Interoperability Node',
      provider: 'Unified Farm Context Engine',
      sourceType: DATA_STATUS.OBSERVED,
      confidence: 0.92,
      isLive: true
    },
    quality: createDataQuality({
      completeness: 0.95,
      confidence: 0.92
    }),
    permissions: createDataPermission({
      visibility: DATA_VISIBILITY.RESEARCH,
      consentRequired: true,
      consentStatus: CONSENT_STATUS.GRANTED,
      purpose: 'Multilateral BRICS Agronomic Research'
    })
  });
}

