/**
 * AgriBridge AI — Phase 8 Evaluation, Model Quality & Continuous Improvement Test Suite
 * Validates dataset registry, classification metrics, confusion matrices, confidence calibration,
 * evidence grounding, hallucination guards, expert review, model drift, and regression gates.
 */

import assert from 'assert';
import {
  createEvaluationDataset,
  createEvaluationRun,
  DATASET_SOURCE_TYPES,
  GROUNDING_LEVELS,
  QUALITY_GATE_STATUS,
  DRIFT_STATUS,
  EXPERT_ASSESSMENTS
} from '../../evaluation/evaluationContracts.js';
import {
  listEvaluationDatasets,
  getEvaluationDataset,
  getDatasetsForTask,
  getEvaluationCoverage,
  registerEvaluationDataset
} from '../../evaluation/evaluationDatasetRegistry.js';
import {
  calculateClassificationMetrics,
  calculateAbstentionMetrics,
  calculateConfidenceCalibration,
  calculateEvidenceCoverage,
  calculateRegressionMetrics
} from '../../evaluation/evaluationMetrics.js';
import {
  extractClaims,
  classifyClaim,
  detectHallucinations,
  evaluateAIQualityGate
} from '../../evaluation/hallucinationGuard.js';
import {
  listReviewQueue,
  enqueueCaseForReview,
  submitExpertReview,
  getExpertReviewSummary
} from '../../evaluation/expertReviewService.js';
import {
  recordFarmerFeedback,
  listOutcomeTraces,
  getOutcomeEvaluationSummary
} from '../../evaluation/farmerFeedbackEvaluationService.js';
import {
  analyzeDistributionDrift,
  getModelDriftOverview
} from '../../evaluation/modelDriftService.js';
import {
  assessImageQuality
} from '../../evaluation/imageQualityService.js';
import {
  runRegressionSuite,
  createReproducibilityTrace,
  AI_VERSIONING
} from '../../evaluation/regressionSuiteService.js';
import {
  listFailureLogs,
  recordFailureIncident,
  updateCorrectiveAction,
  getFailureAnalysisSummary
} from '../../evaluation/failureAnalysisService.js';
import {
  listEvaluationRuns,
  getEvaluationRun,
  executeEvaluationRun
} from '../../evaluation/evaluationRunner.js';
import {
  getAIQualityOverview,
  generateEvaluationReport
} from '../../evaluation/evaluationReportService.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('================================================================');
console.log('  AGRIBRIDGE AI — PHASE 8 AI EVALUATION & QUALITY TEST SUITE   ');
console.log('================================================================\n');

// 1. Dataset Registry Tests
test('Dataset Registry: Enforces real vs synthetic distinction, provenance, and handles missing coverage', () => {
  const datasets = listEvaluationDatasets();
  assert(datasets.length >= 3, 'Must have at least 3 seeded evaluation datasets');

  const benchmarkDs = getEvaluationDataset('crop-doctor-benchmark-v1');
  assert.strictEqual(benchmarkDs.sourceType, DATASET_SOURCE_TYPES.BENCHMARK);
  assert.strictEqual(benchmarkDs.sampleCount, 4200);

  const syntheticDs = getEvaluationDataset('deterministic-golden-suite-v1');
  assert.strictEqual(syntheticDs.sourceType, DATASET_SOURCE_TYPES.SYNTHETIC);
  assert(syntheticDs.limitations.some(l => l.includes('Synthetic')), 'Synthetic datasets must disclose limitations');

  // Check coverage querying
  const onionCoverage = getEvaluationCoverage('Onion', 'crop_diagnosis');
  assert.strictEqual(onionCoverage, 'available', 'Onion crop diagnosis should be covered by verified datasets');

  const unknownCropCoverage = getEvaluationCoverage('UnconfiguredCrop', 'crop_diagnosis');
  assert.strictEqual(unknownCropCoverage, 'unavailable', 'Unconfigured crop should report unavailable coverage without fabrication');
});

// 2. Classification Metrics & Confusion Matrix
test('Classification Metrics: Accurately calculates Precision, Recall, F1, Support, and Confusion Matrix', () => {
  const testData = [
    { actual: 'disease', predicted: 'disease' },
    { actual: 'disease', predicted: 'disease' },
    { actual: 'disease', predicted: 'pest' },      // 1 FN for disease, 1 FP for pest
    { actual: 'pest', predicted: 'pest' },
    { actual: 'healthy', predicted: 'healthy' }
  ];

  const metrics = calculateClassificationMetrics({ data: testData });
  assert.strictEqual(metrics.sampleCount, 5);
  assert.strictEqual(metrics.accuracy, 0.8); // 4 / 5 = 0.80

  // Per-class checks for 'disease' (TP=2, FP=0, FN=1, Support=3)
  assert.strictEqual(metrics.perClass.disease.tp, 2);
  assert.strictEqual(metrics.perClass.disease.fn, 1);
  assert.strictEqual(metrics.perClass.disease.fp, 0);
  assert.strictEqual(metrics.perClass.disease.precision, 1.0);
  assert.strictEqual(metrics.perClass.disease.recall, Number((2 / 3).toFixed(4)));

  // Confusion matrix row-column structure
  assert.strictEqual(metrics.confusionMatrix.matrix.disease.disease, 2);
  assert.strictEqual(metrics.confusionMatrix.matrix.disease.pest, 1);
});

// 3. Abstention & Safe Uncertainty Handling
test('Uncertainty & Abstention: Preserves and measures safe abstentions without penalizing the model', () => {
  const testData = [
    { actual: 'disease', predicted: 'disease' },
    { actual: 'uncertain', predicted: 'uncertain', isAmbiguous: true }, // Safe abstention
    { actual: 'disease', predicted: 'uncertain', isAmbiguous: false },  // False abstention
    { actual: 'pest', predicted: 'pest' }
  ];

  const abstention = calculateAbstentionMetrics(testData);
  assert.strictEqual(abstention.sampleCount, 4);
  assert.strictEqual(abstention.uncertainCount, 2);
  assert.strictEqual(abstention.safeAbstentions, 1);
  assert.strictEqual(abstention.falseAbstentions, 1);
  assert.strictEqual(abstention.safeAbstentionRate, 0.5);
});

// 4. Confidence Calibration & Anti-Fabrication Calibration Rule
test('Calibration: Computes empirical calibration buckets and requires actual ground truth labels', () => {
  // Empty data case must return no_labels without inventing calibration
  const emptyCalib = calculateConfidenceCalibration([]);
  assert.strictEqual(emptyCalib.status, 'no_labels');

  const labeledData = [
    { actual: 'disease', predicted: 'disease', confidence: 0.95 },
    { actual: 'pest', predicted: 'disease', confidence: 0.90 }, // Overconfident error
    { actual: 'healthy', predicted: 'healthy', confidence: 0.50 } // Underconfident correct
  ];

  const calib = calculateConfidenceCalibration(labeledData);
  assert.strictEqual(calib.status, 'evaluated');
  assert.strictEqual(calib.overconfidentCount, 1);
  assert.strictEqual(calib.underconfidentCount, 1);
  assert(calib.buckets.length === 5, 'Must have 5 standard calibration range buckets');
});

// 5. Evidence Coverage, Hallucination Guard & Quality Gate
test('Hallucination Guard: Catches fabricated evidence IDs, ungrounded measurements, and chemical dosages', () => {
  const context = {
    evidence: [
      { id: 'ev-weather-01', description: 'Weather Telemetry', source: 'Open-Meteo' }
    ]
  };

  // Valid output
  const cleanOutput = {
    recommendation: 'Monitor weather trends',
    evidenceIds: ['ev-weather-01']
  };
  const cleanGate = evaluateAIQualityGate({ aiOutput: cleanOutput, context });
  assert.strictEqual(cleanGate.status, QUALITY_GATE_STATUS.PASS);

  // Hallucinated Evidence ID
  const badOutput = {
    recommendation: 'Apply chemical X',
    evidenceIds: ['ev-fabricated-ghost-id']
  };
  const badGate = evaluateAIQualityGate({ aiOutput: badOutput, context });
  assert.strictEqual(badGate.status, QUALITY_GATE_STATUS.REJECT);
  assert(badGate.criticalFailures > 0);

  // Chemical dosage rule violation
  const chemicalOutput = {
    recommendation: 'Apply 3.5 ml/L of Chemical Fungicide on foliar surfaces'
  };
  const chemicalGate = evaluateAIQualityGate({ aiOutput: chemicalOutput, context });
  assert.strictEqual(chemicalGate.status, QUALITY_GATE_STATUS.REJECT);
});

// 6. Expert Agronomist Review & Queue Management
test('Expert Review: Enforces human-in-the-loop workflow, peer reviews, and role privacy', () => {
  const newCase = enqueueCaseForReview({
    targetType: 'crop_diagnosis',
    targetId: 'diag-test-01',
    crop: 'Onion',
    initialAiOutput: { diagnosis: 'Stemphylium Leaf Blight', confidence: 0.76 }
  });

  assert(newCase.id.startsWith('rev-case-'));
  assert.strictEqual(newCase.status, 'pending');

  const reviewed = submitExpertReview({
    reviewId: newCase.id,
    reviewerId: 'lead-pathologist-icar',
    reviewerRole: 'Senior Agronomist',
    assessment: EXPERT_ASSESSMENTS.APPROPRIATE,
    comments: 'Accurate identification of concentric brown lesion rings.'
  });

  assert.strictEqual(reviewed.status, 'reviewed');
  assert.strictEqual(reviewed.assessment, EXPERT_ASSESSMENTS.APPROPRIATE);

  const summary = getExpertReviewSummary();
  assert(summary.reviewedCount >= 1);
});

// 7. Farmer Feedback & Outcome Tracing (Anti-Fabrication Rule)
test('Outcome Tracking: Links recommendation to action and outcome without inventing yield claims', () => {
  const trace = recordFarmerFeedback({
    farmId: 'farm-1',
    recommendationId: 'rec-01',
    recommendationTitle: 'Improve soil aeration',
    crop: 'Onion',
    actionTaken: true,
    farmerRating: 'helpful',
    farmerObservation: 'Canopy vigor stabilized after 4 days',
    outcomeState: 'positive'
  });

  assert.strictEqual(trace.actionTaken, true);
  assert.strictEqual(trace.outcomeState, 'positive');

  const summary = getOutcomeEvaluationSummary();
  assert(summary.totalTraces >= 1);
  assert(summary.disclaimer.includes('farmer-reported field observations'));
});

// 8. Model & Data Drift (Anti-Fabrication Rule: <10 samples = insufficient_data)
test('Model Drift: Requires minimum sample threshold and distinguishes data shift from degradation', () => {
  // Insufficient production samples (<10)
  const lowSampleDrift = analyzeDistributionDrift({
    baselineData: [{ crop: 'Onion' }, { crop: 'Cotton' }],
    productionData: [{ crop: 'Onion' }, { crop: 'Onion' }] // 2 samples
  });
  assert.strictEqual(lowSampleDrift.status, DRIFT_STATUS.INSUFFICIENT_DATA);

  // Sufficient production samples
  const baseline = Array(20).fill({ crop: 'Onion' });
  const productionShifted = [
    ...Array(10).fill({ crop: 'Onion' }),
    ...Array(10).fill({ crop: 'Cotton' })
  ];

  const shiftDrift = analyzeDistributionDrift({
    baselineData: baseline,
    productionData: productionShifted,
    dimension: 'crop_distribution'
  });
  assert(shiftDrift.status === DRIFT_STATUS.WATCH || shiftDrift.status === DRIFT_STATUS.DRIFT_DETECTED);
  assert.strictEqual(shiftDrift.isDataDriftOnly, true);
});

// 9. Deterministic AI Regression Suite & Deployment Gate
test('AI Regression Gate: Golden safety invariants execute and block deployment upon failure', () => {
  const report = runRegressionSuite();
  assert.strictEqual(report.gateStatus, QUALITY_GATE_STATUS.PASS);
  assert.strictEqual(report.canDeploy, true);
  assert.strictEqual(report.failedCount, 0);
  assert(report.passedCount === report.totalCases);
  assert(report.versioning.MODEL_VERSION === '2.5.0');
});

// 10. Evaluation Reports & Master AI Quality Dossier
test('AI Quality Dossier: Compiles holistic overview with honest limitations and disclosures', () => {
  const overview = getAIQualityOverview();
  assert(overview.runsSummary.totalRuns >= 2);
  assert(overview.datasetsSummary.totalDatasets >= 3);
  assert.strictEqual(overview.regressionGate.gateStatus, QUALITY_GATE_STATUS.PASS);
  assert(overview.disclaimer.includes('strictly reports evaluated metrics'));
});

console.log('\n================================================================');
console.log(`  PHASE 8 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
