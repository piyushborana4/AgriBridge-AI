/**
 * AGRIBRIDGE AI — PHASE 11 AUTOMATED TEST SUITE
 * Advanced Geospatial Intelligence, Farm Digital Twin 2.0, Field Management,
 * Temporal Satellite Comparison, Topography & Drainage, and AI Spatial Safety.
 */

import {
  LOCATION_QUALITY,
  GEOMETRY_TYPES,
  CLOUD_STATUS,
  DRAINAGE_RISK_LEVELS,
  validateGeoJSONGeometry,
  setFarmGeometry,
  getFarmGeometry,
  getFarmGeometryHistory,
  calculateBoundingBox,
  coarsenGeometry,
  registerField,
  listFields,
  getField,
  recordCropCycle,
  listCropCycles,
  calculateFieldIntelligence,
  generateManagementZones,
  detectSpatialAnomalies,
  listSatelliteObservations,
  recordSatelliteObservation,
  compareSatelliteDates,
  getFarmTopography,
  evaluateDrainageRisk,
  buildDigitalTwinSnapshot2,
  simulateFieldScenario,
  AI_SPATIAL_TOOLS,
  validateSpatialAISafety
} from '../../geospatial/geospatialGateway.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

export async function runPhase11GeospatialTests() {
  console.log('================================================================');
  console.log('  AGRIBRIDGE AI — PHASE 11 GEOSPATIAL & DIGITAL TWIN 2.0 TESTS  ');
  console.log('================================================================\n');

  // Test 1: GeoJSON Geometry Validation & Malformed Trapping
  try {
    const validPolygon = {
      type: GEOMETRY_TYPES.POLYGON,
      coordinates: [[[73.788, 19.996], [73.791, 19.996], [73.791, 19.999], [73.788, 19.999], [73.788, 19.996]]]
    };
    const unclosedPolygon = {
      type: GEOMETRY_TYPES.POLYGON,
      coordinates: [[[73.788, 19.996], [73.791, 19.996], [73.791, 19.999], [73.788, 19.999]]] // Missing closing point
    };
    const invalidCoords = {
      type: GEOMETRY_TYPES.POINT,
      coordinates: [195.0, 95.0] // Out of WGS84 bounds
    };

    const validRes = validateGeoJSONGeometry(validPolygon);
    const unclosedRes = validateGeoJSONGeometry(unclosedPolygon);
    const boundsRes = validateGeoJSONGeometry(invalidCoords);

    assert(
      validRes.isValid === true && unclosedRes.isValid === false && boundsRes.isValid === false,
      'Geometry: Validates RFC 7946 Polygon closed ring and catches out-of-bounds coordinates'
    );
  } catch (err) {
    assert(false, `Geometry validation failed: ${err.message}`);
  }

  // Test 2: Farm Geometry Versioning & Point vs Boundary Classification
  try {
    const geomV1 = setFarmGeometry({
      farmId: 'farm-geo-test-01',
      geometry: { type: 'Point', coordinates: [73.7898, 19.9975] },
      locationQuality: LOCATION_QUALITY.POINT_LOCATION
    });

    const geomV2 = setFarmGeometry({
      farmId: 'farm-geo-test-01',
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.788, 19.996], [73.791, 19.996], [73.791, 19.999], [73.788, 19.999], [73.788, 19.996]]]
      },
      locationQuality: LOCATION_QUALITY.EXACT_BOUNDARY
    });

    const current = getFarmGeometry('farm-geo-test-01');
    const history = getFarmGeometryHistory('farm-geo-test-01');

    assert(
      current.version === 2 && current.locationQuality === LOCATION_QUALITY.EXACT_BOUNDARY && history.length === 2,
      'Geometry: Tracks version history and upgrades from POINT_LOCATION to EXACT_BOUNDARY'
    );
  } catch (err) {
    assert(false, `Geometry versioning failed: ${err.message}`);
  }

  // Test 3: Spatial Privacy Coarsening (~1.1km)
  try {
    const rawPoly = {
      type: 'Polygon',
      coordinates: [[[73.7881234, 19.9965432], [73.7919876, 19.9965432], [73.7919876, 19.9991234], [73.7881234, 19.9991234], [73.7881234, 19.9965432]]]
    };
    const coarsened = coarsenGeometry(rawPoly, 2);

    assert(
      coarsened.coordinates[0][0][0] === 73.79 && coarsened.coordinates[0][0][1] === 20.00,
      'Spatial Privacy: Accurately coarsens parcel coordinates to 2 decimal places'
    );
  } catch (err) {
    assert(false, `Spatial privacy coarsening failed: ${err.message}`);
  }

  // Test 4: Field Management & Historical Crop Cycles
  try {
    const field = registerField({
      fieldId: 'field-test-alpha',
      farmId: 'farm-geo-test-01',
      name: 'Plot Alpha (Kharif Onion)',
      areaHectares: 3.2,
      crop: 'Onion',
      plantingDate: '2026-08-10'
    });

    const cycle1 = recordCropCycle({
      farmId: 'farm-geo-test-01',
      fieldId: 'field-test-alpha',
      crop: 'Onion',
      season: 'Kharif',
      year: 2026,
      sowingDate: '2026-08-10'
    });

    const cycle2 = recordCropCycle({
      farmId: 'farm-geo-test-01',
      fieldId: 'field-test-alpha',
      crop: 'Wheat',
      season: 'Rabi',
      year: 2025,
      sowingDate: '2025-11-01',
      harvestDate: '2026-03-20',
      yieldQuantityTons: 11.5
    });

    const cycles = listCropCycles('field-test-alpha');

    assert(
      cycles.length === 2 && cycles.some(c => c.crop === 'Wheat' && c.yieldQuantityTons === 11.5),
      'Field Management: Preserves historical crop rotation cycles without overwriting'
    );
  } catch (err) {
    assert(false, `Field Management failed: ${err.message}`);
  }

  // Test 5: Field-Level Agricultural Intelligence & Specific Risk
  try {
    const fieldObj = getField('farm-1', 'field-1a');
    const mockContext = {
      weather: { current: { temp: 39 } }, // Extreme thermal stress
      soil: { moisture: 22 },             // Deficit
      satellite: { ndvi: 0.42 }           // Depressed vigor
    };

    const intel = calculateFieldIntelligence(fieldObj, mockContext);

    assert(
      intel.risk.level === 'HIGH' && intel.risk.score >= 80 && intel.cropStage.daysAfterSowing > 0,
      'Field Intelligence: Computes field-specific growth stage and explainable high risk score'
    );
  } catch (err) {
    assert(false, `Field Intelligence failed: ${err.message}`);
  }

  // Test 6: Management Zone Generation & Approximate Labeling
  try {
    const fieldObj = getField('farm-1', 'field-1a');
    const zones = generateManagementZones(fieldObj, 0.42, 22);

    assert(
      zones.length >= 2 && zones.some(z => z.type === 'WATER_STRESS'),
      'Management Zones: Generates localized water and canopy stress zones'
    );
  } catch (err) {
    assert(false, `Management Zones failed: ${err.message}`);
  }

  // Test 7: Spatial Anomaly Detection (No Disease Hallucination)
  try {
    const anomalies = detectSpatialAnomalies('farm-1', [], {
      weather: { current: { temp: 39 } },
      soil: { moisture: 20 },
      satellite: { ndvi: 0.40 }
    });

    assert(
      anomalies.length > 0 && anomalies[0].evidence.some(e => e.includes('Ground verification recommended')),
      'Spatial Anomaly: Detects localized canopy drop and cautions ground verification without diagnosing pathogen'
    );
  } catch (err) {
    assert(false, `Spatial Anomaly detection failed: ${err.message}`);
  }

  // Test 8: Temporal Satellite Overpasses & Cloud Filtering
  try {
    const allObs = listSatelliteObservations('farm-1', { validOnly: false });
    const clearOnly = listSatelliteObservations('farm-1', { validOnly: true });

    assert(
      allObs.length > clearOnly.length && clearOnly.every(o => o.cloudCoveragePercent < 50),
      'Satellite Timeline: Filters out heavy cloud-contaminated overpasses from vegetation index'
    );
  } catch (err) {
    assert(false, `Satellite Timeline failed: ${err.message}`);
  }

  // Test 9: Multi-Date Satellite Change Detection
  try {
    const comparison = compareSatelliteDates('farm-1', '2026-08-26', '2026-09-25');

    assert(
      comparison.deltas.deltaNdvi > 0 && comparison.trajectory === 'CANOPY_GROWTH' && comparison.interpretation.includes('consistent with'),
      'Satellite Comparison: Calculates delta NDVI across dates and uses cautious phenological language'
    );
  } catch (err) {
    assert(false, `Satellite Comparison failed: ${err.message}`);
  }

  // Test 10: Topography, Elevation & Drainage Assessment
  try {
    const knownDrainage = evaluateDrainageRisk('farm-1', { current: { rainfall: 35 } }, { moisture: 85 });
    const unknownDrainage = evaluateDrainageRisk('farm-unknown-99', {}, {});

    assert(
      knownDrainage.drainageRiskLevel === DRAINAGE_RISK_LEVELS.HIGH && unknownDrainage.drainageRiskLevel === DRAINAGE_RISK_LEVELS.INSUFFICIENT_DATA,
      'Topography: Computes slope-driven drainage stress on saturated soils and reports INSUFFICIENT_DATA when DEM is unavailable'
    );
  } catch (err) {
    assert(false, `Topography Drainage failed: ${err.message}`);
  }

  // Test 11: Unified Digital Twin 2.0 Snapshot & Event Graph
  try {
    const snapshot = buildDigitalTwinSnapshot2({ id: 'farm-1', name: 'Green Valley Farm' }, {});

    assert(
      snapshot.versions.dataVersion === '2.0.0' && snapshot.spatial.fields.length >= 2 && snapshot.eventGraph.links.length > 0,
      'Digital Twin 2.0: Compiles versioned snapshot uniting boundary, fields, telemetry, and event graph'
    );
  } catch (err) {
    assert(false, `Digital Twin 2.0 Snapshot failed: ${err.message}`);
  }

  // Test 12: Spatial Scenario Simulation (Marked SIMULATED)
  try {
    const sim = simulateFieldScenario({
      farmId: 'farm-1',
      fieldId: 'field-1a',
      irrigationAdjustmentPercent: 25,
      tempShiftC: -2,
      baseContext: {}
    });

    assert(
      sim.status === 'SIMULATED' && sim.disclaimer.includes('SIMULATED DATA ONLY') && sim.projected.soilMoisture > sim.baseline.soilMoisture,
      'Scenario Simulation: Executes deterministic What-If projection strictly marked as SIMULATED'
    );
  } catch (err) {
    assert(false, `Scenario Simulation failed: ${err.message}`);
  }

  // Test 13: AI Assistant Spatial Tools
  try {
    const fieldsRes = AI_SPATIAL_TOOLS.getFields.execute({ farmId: 'farm-1' });
    const riskRes = AI_SPATIAL_TOOLS.getFieldRisk.execute({ farmId: 'farm-1', fieldId: 'field-1a', farmContext: {} });

    assert(
      Array.isArray(fieldsRes) && fieldsRes.length >= 2 && riskRes.risk.score !== undefined,
      'AI Spatial Tools: Returns deterministic field and risk payloads for AI Assistant queries'
    );
  } catch (err) {
    assert(false, `AI Spatial Tools failed: ${err.message}`);
  }

  // Test 14: AI Spatial Safety Invariant (Sanitizes False Pathogen Proof)
  try {
    const unsafeAIResponse = 'This map proves the presence of fungus and severe blight across Field 1.';
    const safeAIResponse = 'Satellite NDVI shows a 15% vegetation decline in the northern quadrant.';

    const unsafeCheck = validateSpatialAISafety(unsafeAIResponse);
    const safeCheck = validateSpatialAISafety(safeAIResponse);

    assert(
      unsafeCheck.isSafe === false && unsafeCheck.sanitizedResponse.includes('cannot establish a specific pathological diagnosis') && safeCheck.isSafe === true,
      'AI Spatial Safety: Traps and sanitizes confident disease claims made from satellite maps alone'
    );
  } catch (err) {
    assert(false, `AI Spatial Safety failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`  PHASE 11 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`Phase 11 Test Suite Failed with ${failed} failure(s)`);
  }

  return { passed, failed, total: passed + failed };
}

// Self-run when executed directly via Node
if (process.argv[1] && process.argv[1].endsWith('phase11GeospatialTests.js')) {
  runPhase11GeospatialTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
