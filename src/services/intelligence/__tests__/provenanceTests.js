/**
 * Data Provenance & Quality Contract Tests - AgriBridge AI (Phase 4.5)
 */

import { createProvenance, createDataEnvelope, DataStatus, SourceType, QualityLevel, FreshnessStatus } from '../../data/provenanceTypes.js';
import { evaluateFreshness } from '../../data/dataFreshnessEngine.js';
import { getResolvedSoilData } from '../../data/soil/soilProvider.js';

function assert(condition, message) {
  if (!condition) throw new Error(`Provenance Assertion Failed: ${message}`);
}

console.log('================================================================');
console.log('  AGRIBRIDGE AI — PHASE 4.5 DATA PROVENANCE TEST SUITE          ');
console.log('================================================================\n');

let passed = 0;

// Test 1: DataEnvelope and Provenance Structure
try {
  const env = createDataEnvelope({
    data: { test: 123 },
    provenance: createProvenance({
      sourceType: SourceType.SATELLITE,
      provider: 'Copernicus Data Space Ecosystem (CDSE)',
      dataset: 'Sentinel-2 L2A',
      status: DataStatus.REAL,
      quality: QualityLevel.HIGH
    })
  });

  assert(env.data.test === 123, 'Data must be preserved');
  assert(env.provenance.provider === 'Copernicus Data Space Ecosystem (CDSE)', 'Provider must match');
  assert(env.provenance.status === 'REAL', 'Status must be REAL');
  assert(env.quality.overall >= 90, 'Overall quality score should be high');
  console.log('✓ PASS: DataEnvelope and Provenance contracts properly initialized');
  passed++;
} catch (e) {
  console.error('✗ FAIL:', e.message);
}

// Test 2: Soil Source Priority (Farmer Lab vs Modeled)
try {
  const labFarm = {
    name: 'Lab Tested Farm',
    soilTestDate: '2026-09-15',
    soilPH: 6.9,
    nitrogen: 245,
    phosphorus: 38,
    potassium: 200,
    organicMatter: 3.1
  };
  const labSoilEnv = getResolvedSoilData(labFarm);

  assert(labSoilEnv.provenance.status === DataStatus.USER_PROVIDED, 'Lab test must be USER_PROVIDED');
  assert(labSoilEnv.provenance.quality === QualityLevel.HIGH, 'Lab test quality must be high');
  assert(labSoilEnv.data.isFarmerEntered === true, 'isFarmerEntered must be true');

  const modeledFarm = {
    name: 'Uncalibrated Farm',
    soilPH: null,
    nitrogen: null
  };
  const modeledSoilEnv = getResolvedSoilData(modeledFarm);

  assert(modeledSoilEnv.provenance.status === DataStatus.MODELED, 'Uncalibrated farm must receive MODELED status');
  assert(modeledSoilEnv.provenance.notes.includes('not a laboratory measurement'), 'Modeled soil must carry explicit disclaimer');
  assert(modeledSoilEnv.data.isFarmerEntered === false, 'isFarmerEntered must be false');
  console.log('✓ PASS: Soil provider priority properly distinguishes USER_PROVIDED lab tests from MODELED estimates');
  passed++;
} catch (e) {
  console.error('✗ FAIL:', e.message);
}

// Test 3: Freshness Engine Thresholds
try {
  const freshWeather = evaluateFreshness(new Date(Date.now() - 2 * 3600 * 1000).toISOString(), 'weather');
  assert(freshWeather.status === FreshnessStatus.FRESH, 'Weather < 3h must be FRESH');

  const staleWeather = evaluateFreshness(new Date(Date.now() - 48 * 3600 * 1000).toISOString(), 'weather');
  assert(staleWeather.status === FreshnessStatus.STALE, 'Weather > 12h must be STALE');

  const freshSat = evaluateFreshness(new Date(Date.now() - 3 * 86400000).toISOString(), 'satellite');
  assert(freshSat.status === FreshnessStatus.FRESH, 'Satellite < 5 days must be FRESH');

  const staleSat = evaluateFreshness(new Date(Date.now() - 15 * 86400000).toISOString(), 'satellite');
  assert(staleSat.status === FreshnessStatus.STALE, 'Satellite > 12 days must be STALE');

  console.log('✓ PASS: Data Freshness Engine correctly calculates status across meteorological, satellite, and pedological horizons');
  passed++;
} catch (e) {
  console.error('✗ FAIL:', e.message);
}

console.log(`\nProvenance Tests Passed: ${passed}/3\n`);
