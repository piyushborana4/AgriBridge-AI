/**
 * AgriBridge AI — Phase 6 Advanced Agronomic & Climate Intelligence Test Suite
 * Tests deterministic agronomy engines, crop profiles, phenology, water balance,
 * thermal stress, pathological conduciveness, cross-signal reconciliation, and strict anti-fabrication invariants.
 */

import { getCropProfile, listRegisteredCrops } from '../../agronomy/cropProfiles/index.js';
import { estimateGrowthStage } from '../../agronomy/growthStageEngine.js';
import { evaluateHeatStress } from '../../agronomy/heatStressEngine.js';
import { evaluateColdStress } from '../../agronomy/coldStressEngine.js';
import { computeWaterBalance, estimateReferenceET0 } from '../../agronomy/waterBalanceEngine.js';
import { evaluateIrrigationDecision } from '../../agronomy/irrigationIntelligenceEngine.js';
import { evaluateSoilWaterDynamics } from '../../agronomy/soilWaterEngine.js';
import { evaluateRainfallRisks } from '../../agronomy/rainfallRiskEngine.js';
import { evaluateDiseaseConduciveness } from '../../agronomy/diseaseConducivenessEngine.js';
import { evaluatePestRisk } from '../../agronomy/pestRiskEngine.js';
import { evaluateCropStress } from '../../agronomy/cropStressEngine.js';
import { evaluateSignalCrossValidation } from '../../agronomy/crossSignalEngine.js';
import { evaluateClimateRisks } from '../../agronomy/climateRiskEngine.js';
import { evaluateAgronomicOpportunities } from '../../agronomy/agronomicOpportunityEngine.js';
import { evaluateYieldRisk } from '../../agronomy/yieldRiskIndicator.js';
import { buildAgronomicContext } from '../../agronomy/agronomicContextEngine.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runPhase6AgronomyTests() {
  console.log('================================================================');
  console.log('  AGRIBRIDGE AI — PHASE 6 ADVANCED AGRONOMY TEST SUITE          ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Crop Profile Registry & Alias Resolution
  test('Crop Profile Registry: Correctly resolves crops, aliases, and generic fallback', () => {
    const onion = getCropProfile('Onion');
    assert(onion.cropId === 'onion', 'Should resolve Onion profile');
    assert(onion.growthStages.length === 5, 'Onion should have 5 growth stages');
    assert(onion.isGenericFallback === false, 'Onion should not be fallback');

    const pyaz = getCropProfile('pyaz');
    assert(pyaz.cropId === 'onion', 'Should resolve vernacular alias pyaz to onion');

    const paddy = getCropProfile('paddy');
    assert(paddy.cropId === 'rice', 'Should resolve paddy to rice');

    const unknownCrop = getCropProfile('Dragonfruit Exotic 99');
    assert(unknownCrop.isGenericFallback === true, 'Unknown crop should return generic fallback');
    assert(unknownCrop.growthStages.length >= 4, 'Generic fallback should have standard 4 stages');
  });

  // 2. Growth Stage Engine & Provenance Priority
  test('Growth Stage Engine: Priority order (Farmer Ground Truth > Sowing Date > Fallback)', () => {
    // Case A: Farmer verified observation
    const stageFarmer = estimateGrowthStage({
      crop: 'onion',
      farmerConfirmedStageId: 'bulb_initiation',
      sowingDate: '2026-01-01'
    });
    assert(stageFarmer.source === 'USER_PROVIDED', 'Should prioritize farmer observation');
    assert(stageFarmer.confidence === 0.95, 'Farmer observation confidence should be 0.95');
    assert(stageFarmer.stageId === 'bulb_initiation', 'Should match bulb_initiation');
    assert(stageFarmer.cropCoefficientKc === 1.05, 'Should provide stage Kc of 1.05');

    // Case B: Calculated from Sowing Date (85 DAS -> Bulb Initiation)
    const sowing85DaysAgo = new Date(Date.now() - 85 * 86400000).toISOString().split('T')[0];
    const stageCalculated = estimateGrowthStage({
      crop: 'onion',
      sowingDate: sowing85DaysAgo
    });
    assert(stageCalculated.source === 'CALCULATED_FROM_SOWING_DATE', 'Should compute from sowing date');
    assert(stageCalculated.das === 85, 'DAS should be 85');
    assert(stageCalculated.stageId === 'bulb_initiation', '85 DAS should be bulb initiation');
    assert(stageCalculated.stageProgressPct >= 0 && stageCalculated.stageProgressPct <= 100, 'Progress pct should be valid');

    // Case C: Missing sowing date (Anti-fabrication fallback)
    const stageUnknown = estimateGrowthStage({
      crop: 'wheat'
    });
    assert(stageUnknown.source === 'MODELED_FALLBACK', 'Should flag modeled fallback');
    assert(stageUnknown.confidence < 0.5, 'Should have low confidence when sowing date is missing');
    assert(stageUnknown.das === null, 'DAS must be null, not fabricated');
  });

  // 3. Thermal Stress Engine (Daytime Heatwave & Nocturnal Respiration Stress)
  test('Heat & Cold Stress Engines: Detects day extremes, nocturnal heat, and frost danger', () => {
    const stage = { stageId: 'bulb_initiation', stageName: 'Bulb Initiation', heatSensitivity: 'critical' };
    
    // High day heat + high night temp
    const heatResult = evaluateHeatStress({
      crop: 'onion',
      stage,
      weather: {
        temperature: 38,
        tempMax: 39,
        tempMin: 24, // Nocturnal heat > 22°C
        forecastDaily: [
          { tempMax: 39, tempMin: 24 },
          { tempMax: 40, tempMin: 25 },
          { tempMax: 38, tempMin: 23 }
        ]
      }
    });

    assert(heatResult.riskLevel === 'critical' || heatResult.riskLevel === 'high', 'Heat stress should be high/critical');
    assert(heatResult.nocturnalHeatStress === true, 'Nocturnal heat stress should be flagged');
    assert(heatResult.alerts.length >= 1, 'Should generate heat alerts');

    // Sub-zero frost test
    const coldResult = evaluateColdStress({
      crop: 'potato',
      stage: { stageId: 'tuber_initiation', stageName: 'Tuber Initiation' },
      weather: {
        temperature: 1,
        tempMin: -2,
        forecastDaily: [{ tempMin: -2 }, { tempMin: 0 }]
      }
    });

    assert(coldResult.frostRisk === true, 'Frost risk should be true');
    assert(coldResult.riskLevel === 'critical', 'Cold stress should be critical');
    assert(coldResult.alerts.some(a => a.type === 'FROST_WARNING'), 'Should issue FROST_WARNING');
  });

  // 4. FAO-56 Water Balance & Honest Irrigation Advisory
  test('Water Balance & Irrigation Intelligence: Calculates ETc and produces honest advisory', () => {
    const stage = { stageId: 'bulb_initiation', stageName: 'Bulb Initiation', cropCoefficientKc: 1.05, waterSensitivity: 'critical' };
    
    // Scenario 1: Severe dry deficit
    const dryWeather = {
      temperature: 32,
      tempMax: 35,
      tempMin: 20,
      rainfallMm: 0,
      forecastDaily: [
        { tempMax: 35, tempMin: 20, rainfallMm: 0 },
        { tempMax: 36, tempMin: 21, rainfallMm: 0 },
        { tempMax: 35, tempMin: 20, rainfallMm: 0 }
      ]
    };
    const drySoil = { moisture: 18 };

    const wbDeficit = computeWaterBalance({ crop: 'onion', stage, weather: dryWeather, soil: drySoil });
    assert(wbDeficit.status === 'deficit', 'Water balance should be deficit');
    assert(wbDeficit.cropEtcMmDay > 0, 'Crop ETc should be positive');

    const irgRecommended = evaluateIrrigationDecision({ waterBalance: wbDeficit, stage, soil: drySoil, weather: dryWeather });
    assert(irgRecommended.recommendation === 'recommended', 'Irrigation should be recommended');
    assert(irgRecommended.urgency === 'high', 'Urgency should be high in critical stage');

    // Scenario 2: Upcoming heavy rain -> Avoid excess
    const wetWeather = {
      temperature: 24,
      rainfallMm: 25,
      forecastDaily: [
        { tempMax: 26, tempMin: 18, rainfallMm: 30 },
        { tempMax: 25, tempMin: 17, rainfallMm: 20 }
      ]
    };
    const wetSoil = { moisture: 78 };

    const wbSurplus = computeWaterBalance({ crop: 'onion', stage, weather: wetWeather, soil: wetSoil });
    const irgAvoid = evaluateIrrigationDecision({ waterBalance: wbSurplus, stage, soil: wetSoil, weather: wetWeather });
    assert(irgAvoid.recommendation === 'avoid_excess', 'Should recommend avoid_excess before heavy rain');
  });

  // 5. Anti-Fabrication Invariants: Disease & Pest Conduciveness != Diagnosis or Sighting
  test('Pathology & Pest Safety Invariants: Conduciveness does NOT fabricate diagnosis or infestation', () => {
    const stage = { stageId: 'bulb_initiation', stageName: 'Bulb Initiation' };
    
    // Favorable Purple Blotch conditions (26°C, 92% humidity, rainy)
    const diseaseAssessment = evaluateDiseaseConduciveness({
      crop: 'onion',
      stage,
      weather: {
        temperature: 26,
        humidity: 92,
        rainfallMm: 15,
        forecastDaily: [
          { temp: 26, humidity: 90, rainfallMm: 10 },
          { temp: 25, humidity: 88, rainfallMm: 5 }
        ]
      }
    });

    assert(diseaseAssessment.isDiagnosis === false, 'SAFETY INVARIANT: isDiagnosis MUST be false');
    assert(diseaseAssessment.conduciveDiseases.length > 0, 'Should detect conducive diseases');
    assert(diseaseAssessment.conduciveDiseases[0].isDiagnosis === false, 'Child disease must have isDiagnosis: false');
    assert(diseaseAssessment.safetyDisclaimer.includes('NOT a confirmed diagnosis'), 'Disclaimer must clarify no diagnosis');

    // Favorable Onion Thrips conditions (32°C, 40% humidity)
    const pestAssessment = evaluatePestRisk({
      crop: 'onion',
      stage,
      weather: {
        temperature: 32,
        humidity: 40
      }
    });

    assert(pestAssessment.isSighting === false, 'SAFETY INVARIANT: isSighting MUST be false');
    assert(pestAssessment.conducivePests.length > 0, 'Should detect conducive pests');
    assert(pestAssessment.conducivePests[0].isSighting === false, 'Child pest must have isSighting: false');
  });

  // 6. Cross-Signal Reconciliation & Ground Truth Priority
  test('Cross-Signal Engine: Reconciles remote sensing with ground truth farmer observations', () => {
    // Satellite shows low NDVI (0.32) with 45% cloud cover, but farmer journal records healthy vigorous crop
    const crossCheck = evaluateSignalCrossValidation({
      satellite: {
        ndviCurrent: 0.32,
        cloudCoverPct: 45,
        dataQuality: 'DEGRADED',
        isAvailable: true
      },
      weather: { temperature: 26, rainfall7d: 20 },
      waterBalance: { status: 'balanced' },
      farmerObservations: [
        {
          id: 'obs-1',
          observationType: 'crop_health',
          category: 'crop_health',
          notes: 'Crop foliage is exceptionally healthy, dark green, and vigorous. Weeding was completed yesterday.'
        }
      ]
    });

    assert(crossCheck.convergenceStatus === 'conflicted', 'Should flag conflicted status');
    assert(crossCheck.detectedConflicts.length >= 1, 'Should detect satellite vs ground truth conflict');
    assert(crossCheck.groundTruthOverrides >= 1, 'Should increment ground truth overrides');
    assert(crossCheck.detectedConflicts[0].authoritativeSource === 'USER_PROVIDED', 'Ground truth must be authoritative');
  });

  // 7. Qualitative Yield Risk Safety (No Fake Yield Numbers)
  test('Yield Risk Indicator: Emits categorical concern levels without fabricating quantitative tonnages', () => {
    const stage = { stageId: 'flowering_silking', stageName: 'Silking & Tasseling', waterSensitivity: 'critical', heatSensitivity: 'critical', confidence: 0.9 };
    const severeStress = { compoundStressScore: 78 };
    const deficitWb = { status: 'deficit' };
    const highHeat = { heatStressIndex: 65, maxObservedForecastTempC: 38 };

    const yieldAssessment = evaluateYieldRisk({
      stage,
      cropStress: severeStress,
      waterBalance: deficitWb,
      heatStress: highHeat
    });

    assert(yieldAssessment.yieldRiskLevel === 'high_concern', 'Yield risk should be high concern');
    assert(yieldAssessment.isQuantitativeYieldEstimated === false, 'SAFETY INVARIANT: Must not estimate quantitative yield');
    assert(yieldAssessment.concernScore === undefined || yieldAssessment.concernScore === null, 'No fake tonnage numbers');
    assert(yieldAssessment.protectiveInterventions.length >= 1, 'Should provide actionable protective steps');
  });

  // 8. Full Agronomic Context Envelope Orchestration
  test('Central Agronomic Context Engine: Builds comprehensive AgronomicContextEnvelope', () => {
    const envelope = buildAgronomicContext({
      farm: {
        id: 'farm-nashik-1',
        name: 'Nashik Valley Onion',
        crop: 'Onion',
        sowingDate: new Date(Date.now() - 80 * 86400000).toISOString().split('T')[0]
      },
      weather: {
        temperature: 28,
        tempMax: 32,
        tempMin: 19,
        humidity: 70,
        rainfallMm: 5,
        forecastDaily: [{ tempMax: 32, tempMin: 19, rainfallMm: 2 }]
      },
      soil: {
        texture: 'Sandy Loam',
        moisture: 38,
        organicCarbon: 0.72
      },
      satellite: {
        ndviCurrent: 0.74,
        isAvailable: true
      },
      farmerObservations: [],
      cropDoctorCases: []
    });

    assert(envelope.farmId === 'farm-nashik-1', 'Envelope farmId matches');
    assert(envelope.crop === 'Onion', 'Crop matches');
    assert(envelope.growthStage.stageId === 'bulb_initiation', 'Stage is bulb initiation');
    assert(envelope.waterBalance.cropEtcMmDay > 0, 'Water balance computed');
    assert(envelope.soilWaterDynamics.rootZoneAvailableWaterCapacityMm > 0, 'Soil water dynamics computed');
    assert(envelope.diseaseConduciveness.isDiagnosis === false, 'Disease diagnosis safety verified');
    assert(envelope.pestRisk.isSighting === false, 'Pest sighting safety verified');
    assert(envelope.yieldRisk.isQuantitativeYieldEstimated === false, 'Yield safety verified');
    assert(envelope.citations.length >= 1, 'Includes agronomic citations');
  });

  console.log(`\nPhase 6 Agronomy Tests Passed: ${passed}/${passed + failed}\n`);
  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('phase6AgronomyTests.js')) {
  const result = runPhase6AgronomyTests();
  if (result.failed > 0) {
    process.exit(1);
  }
}
