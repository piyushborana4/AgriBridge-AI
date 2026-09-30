/**
 * Central Data Provenance Model - AgriBridge AI (Phase 4.5)
 * Defines the canonical data provenance structure, status enums, and data envelopes
 * for all environmental, meteorological, pedological, and Earth observation telemetry.
 */

/**
 * Standard Data Status Enum
 */
export const DataStatus = {
  REAL: 'REAL',                     // Directly measured by verified sensor or satellite
  MODELED: 'MODELED',               // Spatially or agrometeorologically modeled estimate
  USER_PROVIDED: 'USER_PROVIDED',   // Entered by farmer / agronomist from laboratory test
  DERIVED: 'DERIVED',               // Deterministically computed from verified signals (e.g. NDVI, ET0)
  FALLBACK: 'FALLBACK',             // Regional baseline used during service degradation
  UNAVAILABLE: 'UNAVAILABLE'        // Stream is offline or no observation exists
};

/**
 * Source Types
 */
export const SourceType = {
  SATELLITE: 'satellite',
  WEATHER: 'weather',
  SOIL: 'soil',
  FARMER_INPUT: 'farmer_input',
  LAB_TEST: 'lab_test',
  SENSOR: 'sensor',
  DERIVED: 'derived',
  AI: 'ai'
};

/**
 * Freshness Status Enum
 */
export const FreshnessStatus = {
  FRESH: 'fresh',
  AGING: 'aging',
  STALE: 'stale',
  UNKNOWN: 'unknown'
};

/**
 * Quality Level Enum
 */
export const QualityLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNKNOWN: 'unknown'
};

/**
 * Creates a standardized DataProvenance object.
 * @param {Object} params 
 * @returns {Object} DataProvenance
 */
export function createProvenance({
  sourceType = SourceType.DERIVED,
  provider = 'AgriBridge Intelligence Core',
  dataset = undefined,
  observedAt = undefined,
  retrievedAt = new Date().toISOString(),
  location = undefined,
  spatialResolution = undefined,
  temporalResolution = undefined,
  quality = QualityLevel.HIGH,
  confidence = 85,
  status = DataStatus.REAL,
  isSynthetic = false,
  isFallback = false,
  freshnessSeconds = 0,
  freshnessStatus = FreshnessStatus.FRESH,
  sourceUrl = undefined,
  methodology = undefined,
  notes = undefined
} = {}) {
  return {
    sourceType,
    provider,
    dataset,
    observedAt: observedAt || (status === DataStatus.REAL ? retrievedAt : undefined),
    retrievedAt,
    location,
    spatialResolution,
    temporalResolution,
    quality,
    confidence,
    status,
    isSynthetic,
    isFallback,
    freshnessSeconds,
    freshnessStatus,
    sourceUrl,
    methodology,
    notes
  };
}

/**
 * Creates a standardized DataEnvelope wrapping payload with provenance and quality scores.
 * @param {Object} params
 * @returns {Object} DataEnvelope<T>
 */
export function createDataEnvelope({
  data = null,
  provenance = createProvenance(),
  quality = {
    completeness: 100,
    reliability: 90,
    freshness: 95,
    overall: 95
  },
  warnings = [],
  errors = []
} = {}) {
  return {
    data,
    provenance,
    quality: {
      completeness: Math.min(100, Math.max(0, quality.completeness ?? 100)),
      reliability: Math.min(100, Math.max(0, quality.reliability ?? 90)),
      freshness: Math.min(100, Math.max(0, quality.freshness ?? 95)),
      overall: Math.min(100, Math.max(0, quality.overall ?? 95))
    },
    warnings: Array.isArray(warnings) ? warnings : [],
    errors: Array.isArray(errors) ? errors : []
  };
}
