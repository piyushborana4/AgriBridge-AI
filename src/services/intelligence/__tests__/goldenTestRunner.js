/**
 * Golden Test Suite - AgriBridge AI Phase 4 Deterministic Intelligence Engine
 * Verifies all 10 agronomic test cases against deterministic math, anomaly detection,
 * risk indexing, confidence scoring, evidence linkage, and safety rules.
 */

import { compileFarmIntelligence } from '../farmIntelligenceService.js';
import { validateAIOutput, fallbackSanitizedBrief } from '../aiSafetyValidator.js';
import { simulateAgronomicScenario } from '../decisionEngine.js';

const testCases = [
  {
    name: 'TC-1: Healthy Onion Baseline',
    context: {
      id: 'farm-tc-1',
      name: 'Nashik Onion Parcel 1',
      crop: 'Onion',
      variety: 'Bhima Super',
      sowingDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
      location: 'Nashik, Maharashtra',
      satellite: {
        currentNdvi: 0.78,
        previousNdvi: 0.76,
        cloudCoveragePct: 5,
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 27,
        tempMax: 30,
        humidity: 60,
        rainfall7d: 18,
        et0: 4.2,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: {
        pH: 6.8,
        organicMatterPct: 2.8,
        moisture: { surface: 42, subsoil: 48 },
        isFarmerEntered: true
      }
    },
    assertions: (intel) => {
      assert(intel.das === 45, 'DAS should equal 45');
      assert(intel.calculatedStage === 'Vegetative Growth' || intel.calculatedStage === 'Bulb Initiation', 'Stage should be Vegetative/Bulb');
      assert(intel.riskIndex.overallScore <= 35, `Risk score should be low (got ${intel.riskIndex.overallScore})`);
      assert(intel.trends.ndvi.direction === 'increasing' || intel.trends.ndvi.direction === 'stable', 'NDVI trend should be increasing/stable');
      assert(intel.confidence.rating === 'high', `Confidence should be high (got ${intel.confidence.rating})`);
    }
  },
  {
    name: 'TC-2: Severe Moisture & Water Stress',
    context: {
      id: 'farm-tc-2',
      name: 'Drought Stress Plot',
      crop: 'Onion',
      sowingDate: new Date(Date.now() - 50 * 86400000).toISOString().split('T')[0],
      location: 'Ahmednagar, Maharashtra',
      satellite: {
        currentNdvi: 0.68,
        previousNdvi: 0.76,
        cloudCoveragePct: 2,
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 36,
        tempMax: 39,
        humidity: 28,
        rainfall7d: 0,
        et0: 6.2,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: {
        pH: 7.2,
        organicMatterPct: 1.5,
        moisture: { surface: 18, subsoil: 22 },
        isFarmerEntered: true
      }
    },
    assertions: (intel) => {
      assert(intel.riskIndex.overallScore >= 50, `Overall risk should be elevated (got ${intel.riskIndex.overallScore})`);
      const waterRisk = intel.riskIndex.risks.find(r => r.category === 'water');
      assert(waterRisk && waterRisk.score >= 60, 'Water risk category must be severe');
      assert(intel.candidateRecommendations.some(r => r.urgency === 'immediate'), 'Must generate immediate priority recommendation');
    }
  },
  {
    name: 'TC-3: Heavy Inundation & Waterlogging Risk',
    context: {
      id: 'farm-tc-3',
      name: 'Flood Risk Plot',
      crop: 'Rice',
      sowingDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      location: 'Karnal, Haryana',
      satellite: {
        currentNdvi: 0.75,
        previousNdvi: 0.74,
        cloudCoveragePct: 10,
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 24,
        tempMax: 26,
        humidity: 94,
        rainfall7d: 85,
        et0: 2.1,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: {
        pH: 7.0,
        organicMatterPct: 2.2,
        moisture: { surface: 88, subsoil: 92 },
        isFarmerEntered: true
      }
    },
    assertions: (intel) => {
      assert(intel.anomalies.some(a => a.type === 'heavy_rainfall' || a.type === 'soil_saturation'), 'Heavy rainfall/saturation anomaly required');
      assert(intel.candidateRecommendations.some(r => r.action.toLowerCase().includes('drain') || r.action.toLowerCase().includes('water')), 'Must recommend drainage action');
    }
  },
  {
    name: 'TC-4: Rapid Vegetation Drop (Safety Rule: Never equate NDVI with Disease)',
    context: {
      id: 'farm-tc-4',
      name: 'Canopy Reduction Plot',
      crop: 'Wheat',
      sowingDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
      location: 'Amritsar, Punjab',
      satellite: {
        currentNdvi: 0.60,
        previousNdvi: 0.76, // 21% drop
        cloudCoveragePct: 5,
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 22,
        tempMax: 25,
        humidity: 65,
        rainfall7d: 5,
        et0: 3.5,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: {
        pH: 6.9,
        organicMatterPct: 2.0,
        moisture: { surface: 35, subsoil: 40 },
        isFarmerEntered: true
      }
    },
    assertions: (intel) => {
      const vegAnomaly = intel.anomalies.find(a => a.category === 'vegetation');
      assert(vegAnomaly !== undefined, 'Vegetation anomaly must be raised');
      assert(!vegAnomaly.description.toLowerCase().includes('fungal') && !vegAnomaly.description.toLowerCase().includes('rust'), 'Safety Violation: NDVI decline must NOT declare specific fungal disease without scan');
      assert(vegAnomaly.description.toLowerCase().includes('stress') || vegAnomaly.description.toLowerCase().includes('decline'), 'Must describe as vegetation stress');
    }
  },
  {
    name: 'TC-5: Microclimate Disease Conduciveness (High Humidity & Moderate Temp)',
    context: {
      id: 'farm-tc-5',
      name: 'Humid Microclimate Plot',
      crop: 'Grape',
      sowingDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
      location: 'Nashik, Maharashtra',
      satellite: {
        currentNdvi: 0.82,
        previousNdvi: 0.81,
        cloudCoveragePct: 15,
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 20,
        tempMax: 23,
        humidity: 90,
        rainfall7d: 15,
        et0: 2.5,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: {
        pH: 6.8,
        organicMatterPct: 3.2,
        moisture: { surface: 50, subsoil: 55 },
        isFarmerEntered: true
      }
    },
    assertions: (intel) => {
      const diseaseRisk = intel.riskIndex.risks.find(r => r.category === 'disease');
      assert(diseaseRisk && diseaseRisk.score >= 40, `Disease conducive risk should be moderate-high (got ${diseaseRisk?.score})`);
    }
  },
  {
    name: 'TC-6: Missing Soil Profile (Data Completeness & Graceful Fallback)',
    context: {
      id: 'farm-tc-6',
      name: 'Uncalibrated Soil Plot',
      crop: 'Cotton',
      location: 'Nagpur, Maharashtra',
      satellite: {
        currentNdvi: 0.70,
        previousNdvi: 0.69,
        cloudCoveragePct: 10,
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 30,
        tempMax: 33,
        humidity: 55,
        rainfall7d: 10,
        et0: 4.8,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: null // missing
    },
    assertions: (intel) => {
      assert(intel.confidence.breakdown.soil.status.includes('Missing') || intel.confidence.breakdown.soil.status.includes('Modeled'), 'Must flag soil as missing or modeled');
      assert(intel.riskIndex.overallScore >= 0, 'Risk score must compute without throwing on null soil');
    }
  },
  {
    name: 'TC-7: Satellite Cloud Obstruction (Cloud Masking Penalty)',
    context: {
      id: 'farm-tc-7',
      name: 'Monsoon Cloud Cover Plot',
      crop: 'Soybean',
      location: 'Indore, MP',
      satellite: {
        currentNdvi: 0.72,
        previousNdvi: 0.70,
        cloudCoveragePct: 75, // Severe cloud cover
        acquisitionDate: new Date().toISOString().split('T')[0]
      },
      weather: {
        temperature: 28,
        tempMax: 30,
        humidity: 80,
        rainfall7d: 30,
        et0: 3.2,
        isLive: true,
        timestamp: new Date().toISOString()
      },
      soil: { pH: 7.0, organicMatterPct: 2.0, moisture: { surface: 60 } }
    },
    assertions: (intel) => {
      assert(intel.confidence.breakdown.satellite.points < 30, 'Satellite confidence points must be discounted due to cloud mask');
    }
  },
  {
    name: 'TC-8: Stale Weather Telemetry Penalty',
    context: {
      id: 'farm-tc-8',
      name: 'Offline Cache Plot',
      crop: 'Wheat',
      location: 'Bhopal, MP',
      satellite: { currentNdvi: 0.75, previousNdvi: 0.74, cloudCoveragePct: 5 },
      weather: {
        temperature: 26,
        rainfall7d: 5,
        isLive: false,
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString() // 3 days old
      },
      soil: { pH: 6.8, moisture: { surface: 35 } }
    },
    assertions: (intel) => {
      assert(intel.confidence.breakdown.weather.status.includes('Stale') || intel.confidence.breakdown.weather.points <= 20, 'Must apply stale weather discount');
    }
  },
  {
    name: 'TC-9: Multi-Signal Compound Risk (Heatwave + Deficit)',
    context: {
      id: 'farm-tc-9',
      name: 'Compound Risk Plot',
      crop: 'Tomato',
      location: 'Chittoor, AP',
      satellite: { currentNdvi: 0.62, previousNdvi: 0.74, cloudCoveragePct: 2 },
      weather: {
        temperature: 39,
        tempMax: 42,
        humidity: 20,
        rainfall7d: 0,
        et0: 7.5,
        isLive: true
      },
      soil: { pH: 7.4, moisture: { surface: 14, subsoil: 16 } }
    },
    assertions: (intel) => {
      assert(intel.riskIndex.overallScore >= 70, `Compound risk score should be critical (got ${intel.riskIndex.overallScore})`);
      assert(intel.riskIndex.overallCategory === 'critical' || intel.riskIndex.overallCategory === 'high', 'Must be high or critical');
    }
  },
  {
    name: 'TC-10: Bare Minimum Context (Zero Exception Resiliency)',
    context: {
      id: 'farm-tc-10',
      name: 'Sparse Plot'
    },
    assertions: (intel) => {
      assert(intel !== null && typeof intel === 'object', 'Must return valid object');
      assert(intel.confidence.rating === 'insufficient' || intel.confidence.rating === 'low', 'Confidence should be low/insufficient');
      assert(Array.isArray(intel.evidenceItems), 'Evidence items must be an array');
      assert(intel.riskIndex.overallScore >= 0, 'Risk score must be a valid number');
    }
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Run all 10 Golden Tests
console.log('================================================================');
console.log('  AGRIBRIDGE AI — PHASE 4 DETERMINISTIC INTELLIGENCE TEST SUITE ');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  try {
    const intel = compileFarmIntelligence(tc.context);
    tc.assertions(intel);
    console.log(`✓ PASS: ${tc.name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${tc.name}`);
    console.error(`  Error: ${err.message}\n`);
    failed++;
  }
}

// Test AI Safety Validator
console.log('\n--- AI Safety Validator Verification ---');
try {
  const dummyIntel = compileFarmIntelligence(testCases[0].context);
  const maliciousAiResponse = {
    headline: 'Wheat disease confirmed',
    situationSummary: 'NDVI proves fungal infection across the whole farm.',
    recommendations: [
      {
        id: 'rec-fake',
        title: 'Apply fungicide',
        action: 'Apply 2.5 ml/acre of chemical pesticide',
        evidenceIds: ['ev-non-existent-999']
      }
    ]
  };

  const validation = validateAIOutput(maliciousAiResponse, dummyIntel);
  assert(validation.violations.length >= 2, 'Validator must catch invalid evidence ID and dosage/NDVI claims');
  assert(validation.sanitizedOutput.recommendations[0].evidenceIds.length === 0, 'Invalid evidence ID must be stripped');
  console.log(`✓ PASS: AI Safety Validator successfully sanitized hallucinated evidence IDs and unsafe claims (${validation.violations.length} violations flagged)`);
  passed++;
} catch (err) {
  console.error(`✗ FAIL: AI Safety Validator test: ${err.message}`);
  failed++;
}

// Test What-If Scenario Simulator
console.log('\n--- Scenario Simulator Verification ---');
try {
  const baseContext = testCases[0].context;
  const sim = simulateAgronomicScenario(baseContext, {
    name: 'Drought Simulation',
    rainfallModifier: -18,
    tempModifier: 5,
    soilMoistureDrop: 20
  });

  assert(sim.isHypothetical === true, 'Simulation must be tagged hypothetical');
  assert(sim.simulatedRisk > sim.baselineRisk, 'Simulated drought risk must be higher than baseline');
  console.log(`✓ PASS: Scenario simulator computed risk increase from ${sim.baselineRisk} to ${sim.simulatedRisk} (+${sim.riskDelta} pts)`);
  passed++;
} catch (err) {
  console.error(`✗ FAIL: Scenario Simulator: ${err.message}`);
  failed++;
}

console.log('\n================================================================');
console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Phase 4 deterministic intelligence assertions verified successfully!\n');
}
