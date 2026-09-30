/**
 * Data Freshness Engine - AgriBridge AI (Phase 4.5)
 * Computes source-specific freshness metrics, elapsed durations, and degradation factors
 * across agrometeorology, Earth observation, and pedological horizons.
 */

import { FreshnessStatus, QualityLevel } from './provenanceTypes.js';

export const FRESHNESS_THRESHOLDS_HOURS = {
  WEATHER_OBSERVED_FRESH: 3,
  WEATHER_OBSERVED_AGING: 12,
  
  SATELLITE_FRESH: 120,    // 5 days (Sentinel-2 revisit cycle)
  SATELLITE_AGING: 288,    // 12 days (2 revisit cycles)
  
  SOIL_LAB_FRESH: 4320,    // 180 days (~6 months)
  SOIL_LAB_AGING: 8760,    // 365 days (~1 year)
};

/**
 * Calculates freshness status and elapsed seconds for a given timestamp and source type.
 * @param {string|number|Date} timestamp - Observation or acquisition date
 * @param {string} sourceType - 'weather' | 'satellite' | 'soil' | 'lab_test'
 * @returns {Object} Freshness evaluation
 */
export function evaluateFreshness(timestamp, sourceType = 'weather') {
  if (!timestamp) {
    return {
      status: FreshnessStatus.UNKNOWN,
      ageHours: null,
      ageDays: null,
      freshnessScore: 20,
      description: 'Observation timestamp unavailable'
    };
  }

  const dateObj = new Date(timestamp);
  if (isNaN(dateObj.getTime())) {
    return {
      status: FreshnessStatus.UNKNOWN,
      ageHours: null,
      ageDays: null,
      freshnessScore: 20,
      description: 'Invalid observation timestamp format'
    };
  }

  const now = Date.now();
  const elapsedMs = Math.max(0, now - dateObj.getTime());
  const ageHours = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(1));
  const ageDays = parseFloat((elapsedMs / (1000 * 60 * 60 * 24)).toFixed(1));

  let status = FreshnessStatus.FRESH;
  let freshnessScore = 100;
  let description = '';

  switch (sourceType) {
    case 'weather':
      if (ageHours <= FRESHNESS_THRESHOLDS_HOURS.WEATHER_OBSERVED_FRESH) {
        status = FreshnessStatus.FRESH;
        freshnessScore = 100;
        description = `Live telemetry (${ageHours}h ago)`;
      } else if (ageHours <= FRESHNESS_THRESHOLDS_HOURS.WEATHER_OBSERVED_AGING) {
        status = FreshnessStatus.AGING;
        freshnessScore = 75;
        description = `Recent observation (${ageHours}h ago)`;
      } else {
        status = FreshnessStatus.STALE;
        freshnessScore = 40;
        description = `Stale weather cache (${ageHours}h ago)`;
      }
      break;

    case 'satellite':
      if (ageHours <= FRESHNESS_THRESHOLDS_HOURS.SATELLITE_FRESH) {
        status = FreshnessStatus.FRESH;
        freshnessScore = 100;
        description = `Current orbit pass (${ageDays} days ago)`;
      } else if (ageHours <= FRESHNESS_THRESHOLDS_HOURS.SATELLITE_AGING) {
        status = FreshnessStatus.AGING;
        freshnessScore = 70;
        description = `Prior cycle pass (${ageDays} days ago)`;
      } else {
        status = FreshnessStatus.STALE;
        freshnessScore = 35;
        description = `Aged overpass (${ageDays} days ago)`;
      }
      break;

    case 'soil':
    case 'lab_test':
      if (ageHours <= FRESHNESS_THRESHOLDS_HOURS.SOIL_LAB_FRESH) {
        status = FreshnessStatus.FRESH;
        freshnessScore = 100;
        description = `Recent laboratory test (${ageDays} days ago)`;
      } else if (ageHours <= FRESHNESS_THRESHOLDS_HOURS.SOIL_LAB_AGING) {
        status = FreshnessStatus.AGING;
        freshnessScore = 70;
        description = `Seasonal soil profile (${ageDays} days ago)`;
      } else {
        status = FreshnessStatus.STALE;
        freshnessScore = 40;
        description = `Annual soil baseline (${ageDays} days ago)`;
      }
      break;

    default:
      status = FreshnessStatus.FRESH;
      freshnessScore = 90;
      description = 'Telemetry active';
  }

  return {
    status,
    ageHours,
    ageDays,
    freshnessScore,
    description
  };
}
