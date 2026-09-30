/**
 * AGRIBRIDGE AI — Anti-Fabrication & Truth-in-Data Test Suite (Phase 4.5)
 *
 * Verifies that the platform strictly enforces anti-fabrication rules:
 * 1. Satellite: Never emits fake Sentinel-2 spectral indices or claims live satellite passes when unavailable.
 * 2. Soil: Strictly separates farmer lab tests (LAB_TEST/USER_PROVIDED) from SoilGrids 2.0 (MODELED) with uncertainty.
 * 3. Weather: Clearly flags regional modeled baselines as FALLBACK/MODELED vs live telemetry as REAL.
 * 4. Signal & Evidence Integrity: Confidence penalties are applied to synthetic/fallback inputs.
 */

import assert from 'node:assert';
import { DataStatus, SourceType, QualityLevel } from '../../data/provenanceTypes.js';
import { getResolvedSoilData } from '../../data/soil/soilProvider.js';
import { getSatelliteObservation } from '../../data/satellite/satelliteProvider.js';
import { getCalibratedFallbackWeather } from '../../data/weather/openMeteoProvider.js';
import { buildFarmContext } from '../../data/farmContext/farmContextService.js';
import { compileFarmIntelligence } from '../farmIntelligenceService.js';

console.log('================================================================');
console.log('  AGRIBRIDGE AI — ANTI-FABRICATION & TRUTH-IN-DATA TESTS        ');
console.log('================================================================\n');

let passCount = 0;
let totalCount = 0;

async function test(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(`  ${err.message}`);
  }
}

async function runTests() {
  // -------------------------------------------------------------
  // 1. Satellite Anti-Fabrication Tests
  // -------------------------------------------------------------
  await test('Satellite: Missing coordinates or network failure returns UNAVAILABLE without fabricating NDVI', async () => {
    const envelope = await getSatelliteObservation({ name: 'Unlocated Parcel' });
    
    assert.strictEqual(envelope.provenance.status, DataStatus.UNAVAILABLE, 'Status must be UNAVAILABLE');
    assert.strictEqual(envelope.data, null, 'Data payload must be null');
    assert.strictEqual(envelope.provenance.sourceType, SourceType.SATELLITE, 'Source type must be SATELLITE');
    assert.strictEqual(envelope.provenance.isSynthetic, false, 'Must not fabricate synthetic data');
    assert.strictEqual(envelope.provenance.isFallback, false, 'Must not claim to be fallback observation');
  });

  await test('Satellite: Simulated network degradation gracefully returns UNAVAILABLE and does not invent NDVI numbers', async () => {
    // Calling with coordinates when backend STAC is unreachable offline
    const envelope = await getSatelliteObservation({ lat: 19.9975, lng: 73.7898 });
    
    assert.strictEqual(envelope.provenance.status, DataStatus.UNAVAILABLE);
    assert.strictEqual(envelope.data, null);
    assert.strictEqual(envelope.provenance.isSynthetic, false);
    assert.ok(envelope.provenance.notes.includes('Copernicus') || envelope.provenance.notes.includes('telemetry'));
  });

  // -------------------------------------------------------------
  // 2. Soil Provenance & Uncertainty Tests
  // -------------------------------------------------------------
  await test('Soil: Modeled baseline is explicitly tagged MODELED with uncertainty notes and 250m resolution', () => {
    const farmWithoutLab = {
      id: 'farm-modeled-soil',
      name: 'Nashik Unsampled Farm',
      soilType: 'Vertisol (Black Cotton Soil - Modeled Spatial Estimate)',
      isFarmerEntered: false
    };

    const envelope = getResolvedSoilData(farmWithoutLab);
    
    assert.strictEqual(envelope.provenance.status, DataStatus.MODELED, 'Status must be MODELED');
    assert.strictEqual(envelope.provenance.sourceType, SourceType.SOIL, 'Source type must be SOIL');
    assert.ok(envelope.provenance.provider.includes('SoilGrids 2.0') || envelope.provenance.provider.includes('Pedological Model'));
    assert.strictEqual(envelope.data.isFarmerEntered, false, 'isFarmerEntered must be false');
    assert.strictEqual(envelope.data.spatialResolutionMeters, 250, 'Spatial resolution must be 250m');
    assert.ok(envelope.data.uncertaintyPct > 0, 'Must have uncertainty percentage');
  });

  await test('Soil: Verified Farmer Lab Test receives LAB_TEST source type and high confidence', () => {
    const farmWithLab = {
      id: 'farm-lab-tested',
      name: 'Nashik Tested Farm',
      soilTestDate: '2026-08-15',
      soilLabName: 'District Agriculture Chemistry Laboratory, Nashik',
      soilPH: 6.9,
      nitrogen: 235,
      phosphorus: 38,
      potassium: 195,
      organicMatter: 2.9,
      isFarmerEntered: true
    };

    const envelope = getResolvedSoilData(farmWithLab);
    
    assert.strictEqual(envelope.provenance.sourceType, SourceType.LAB_TEST, 'Source must be LAB_TEST');
    assert.strictEqual(envelope.provenance.provider, 'District Agriculture Chemistry Laboratory, Nashik');
    assert.strictEqual(envelope.data.isFarmerEntered, true, 'isFarmerEntered must be true');
    assert.strictEqual(envelope.provenance.quality, QualityLevel.HIGH, 'Quality must be HIGH');
    assert.strictEqual(envelope.provenance.confidence, 95, 'Lab confidence must be 95%');
  });

  // -------------------------------------------------------------
  // 3. Weather Provenance Tests
  // -------------------------------------------------------------
  await test('Weather: Fallback regional baseline is explicitly flagged as MODELED ESTIMATE and isLive=false', () => {
    const fallbackWeather = getCalibratedFallbackWeather(19.9975, 73.7898);
    
    assert.strictEqual(fallbackWeather.isLive, false, 'isLive must be false');
    assert.strictEqual(fallbackWeather.sourceBadge, 'MODELED ESTIMATE', 'Badge must be MODELED ESTIMATE');
    assert.ok(fallbackWeather.source.includes('Baseline') || fallbackWeather.source.includes('Regional'));
  });

  // -------------------------------------------------------------
  // 4. End-to-End Context Engine & Confidence Penalty Tests
  // -------------------------------------------------------------
  await test('Context Engine: Evidence coverage drops when satellite data is UNAVAILABLE and soil is MODELED', async () => {
    const farm = {
      id: 'anti-fab-farm',
      name: 'Nashik Experimental Plot',
      crop: 'Onion',
      crops: ['Onion'],
      size: 5.0,
      lat: 19.9975,
      lng: 73.7898,
      soilType: 'Vertisol (Black Cotton Soil - Modeled Spatial Estimate)',
      sowingDate: '2025-11-15',
      isFarmerEntered: false
    };

    const context = await buildFarmContext(farm);
    assert.ok(context, 'Context must be constructed');
    assert.ok(context.evidenceCoverage.score <= 85, `Evidence coverage must reflect missing lab test/telemetry (got ${context.evidenceCoverage.score}%)`);

    // Verify intelligence evaluation runs cleanly and reflects lower confidence
    const intelligence = compileFarmIntelligence(context);
    assert.ok(intelligence.confidence.score <= 85, `Intelligence confidence must reflect modeled data (got ${intelligence.confidence.score}%)`);
    assert.ok(intelligence.evidenceItems.length > 0, 'Evidence items must still be extracted safely');
  });

  console.log(`\nAnti-Fabrication Tests Passed: ${passCount}/${totalCount}\n`);

  if (passCount !== totalCount) {
    process.exit(1);
  }
}

runTests();
