/**
 * AgriBridge AI — Temporal Satellite Observation & Comparison Service (Phase 11)
 * Manages chronological multi-spectral observations (NDVI, NDWI, EVI), cloud filtering,
 * multi-date change detection, and cautious temporal causality language.
 */

import { CLOUD_STATUS, createSatelliteObservation } from './geospatialTypes.js';

// In-memory store for satellite observation timelines
const satelliteObservationsStore = new Map();

// Seed initial default satellite timeline for mock farms
function seedDefaultSatelliteTimeline() {
  if (satelliteObservationsStore.size > 0) return;

  const f1Timeline = [
    createSatelliteObservation({
      observationId: 'sat-f1-20260925',
      farmId: 'farm-1',
      fieldId: 'field-1a',
      acquisitionDate: '2026-09-25T05:30:00.000Z',
      source: 'Copernicus Sentinel-2 L2A',
      cloudStatus: CLOUD_STATUS.CLEAR,
      cloudCoveragePercent: 2.1,
      indices: { ndvi: 0.74, ndwi: 0.32, evi: 0.58 }
    }),
    createSatelliteObservation({
      observationId: 'sat-f1-20260915',
      farmId: 'farm-1',
      fieldId: 'field-1a',
      acquisitionDate: '2026-09-15T05:30:00.000Z',
      source: 'Copernicus Sentinel-2 L2A',
      cloudStatus: CLOUD_STATUS.PARTIALLY_CLOUDY,
      cloudCoveragePercent: 14.5,
      indices: { ndvi: 0.69, ndwi: 0.28, evi: 0.52 }
    }),
    createSatelliteObservation({
      observationId: 'sat-f1-20260905',
      farmId: 'farm-1',
      fieldId: 'field-1a',
      acquisitionDate: '2026-09-05T05:30:00.000Z',
      source: 'Copernicus Sentinel-2 L2A',
      cloudStatus: CLOUD_STATUS.CLOUDY,
      cloudCoveragePercent: 88.0,
      indices: { ndvi: 0.35, ndwi: 0.65, evi: 0.22 } // Cloud contaminated
    }),
    createSatelliteObservation({
      observationId: 'sat-f1-20260826',
      farmId: 'farm-1',
      fieldId: 'field-1a',
      acquisitionDate: '2026-08-26T05:30:00.000Z',
      source: 'Copernicus Sentinel-2 L2A',
      cloudStatus: CLOUD_STATUS.CLEAR,
      cloudCoveragePercent: 4.0,
      indices: { ndvi: 0.61, ndwi: 0.22, evi: 0.45 }
    })
  ];

  satelliteObservationsStore.set('farm-1', f1Timeline);
}

seedDefaultSatelliteTimeline();

/**
 * Lists temporal satellite observations for a farm
 * @param {string} farmId
 * @param {object} [options]
 * @param {boolean} [options.validOnly=true] - Filter out cloudy/invalid passes
 * @param {string} [options.fieldId]
 * @param {string} [options.timeWindow='ALL'] - '7D' | '30D' | '90D' | 'SEASON' | 'ALL'
 * @returns {Array<object>}
 */
export function listSatelliteObservations(farmId, { validOnly = false, fieldId, timeWindow = 'ALL' } = {}) {
  let observations = satelliteObservationsStore.get(farmId) || [];

  if (validOnly) {
    observations = observations.filter(o => o.isValid);
  }

  if (fieldId) {
    observations = observations.filter(o => !o.fieldId || o.fieldId === fieldId);
  }

  if (timeWindow !== 'ALL') {
    const daysMap = { '7D': 7, '30D': 30, '90D': 90, 'SEASON': 120 };
    const maxDays = daysMap[timeWindow] || 365;
    const cutoff = Date.now() - (maxDays * 24 * 60 * 60 * 1000);
    observations = observations.filter(o => new Date(o.acquisitionDate).getTime() >= cutoff);
  }

  return observations.sort((a, b) => new Date(b.acquisitionDate) - new Date(a.acquisitionDate));
}

/**
 * Records a new satellite overpass observation
 * @param {object} params
 * @returns {object}
 */
export function recordSatelliteObservation(params) {
  const obs = createSatelliteObservation(params);
  const existing = satelliteObservationsStore.get(obs.farmId) || [];
  existing.unshift(obs);
  satelliteObservationsStore.set(obs.farmId, existing);
  return obs;
}

/**
 * Compares two temporal satellite overpasses
 * @param {string} farmId
 * @param {string} date1 - Earlier ISO date
 * @param {string} date2 - Later ISO date
 * @returns {object} Comparison dossier with delta calculations
 */
export function compareSatelliteDates(farmId, date1, date2) {
  const observations = listSatelliteObservations(farmId, { validOnly: true });

  const findNearest = (targetDateStr) => {
    const target = new Date(targetDateStr).getTime();
    let closest = null;
    let minDiff = Infinity;
    observations.forEach(o => {
      const diff = Math.abs(new Date(o.acquisitionDate).getTime() - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = o;
      }
    });
    return closest;
  };

  const obs1 = findNearest(date1);
  const obs2 = findNearest(date2);

  if (!obs1 || !obs2) {
    throw new Error(`Insufficient clear satellite observations found for requested dates: ${date1} and ${date2}`);
  }

  const ndvi1 = obs1.indices.ndvi;
  const ndvi2 = obs2.indices.ndvi;
  const deltaNdvi = Number((ndvi2 - ndvi1).toFixed(3));

  const ndwi1 = obs1.indices.ndwi || 0;
  const ndwi2 = obs2.indices.ndwi || 0;
  const deltaNdwi = Number((ndwi2 - ndwi1).toFixed(3));

  let trajectory = 'STABLE_CANOPY';
  let interpretation = 'Vegetation index remains stable across observation window.';

  if (deltaNdvi <= -0.10) {
    trajectory = 'VEGETATION_DECLINE';
    interpretation = 'Marked canopy depression detected. Cautiously associated with potential moisture deficit or localized crop stress.';
  } else if (deltaNdvi >= 0.10) {
    trajectory = 'CANOPY_GROWTH';
    interpretation = 'Vigor expansion detected, consistent with normal vegetative phenological development.';
  }

  return {
    farmId,
    observation1: {
      date: obs1.acquisitionDate,
      source: obs1.source,
      indices: obs1.indices,
      cloudCoverage: obs1.cloudCoveragePercent
    },
    observation2: {
      date: obs2.acquisitionDate,
      source: obs2.source,
      indices: obs2.indices,
      cloudCoverage: obs2.cloudCoveragePercent
    },
    deltas: {
      deltaNdvi,
      deltaNdwi,
      ndviChangePercent: Number(((deltaNdvi / (ndvi1 || 0.01)) * 100).toFixed(1))
    },
    trajectory,
    interpretation,
    comparedAt: new Date().toISOString()
  };
}
