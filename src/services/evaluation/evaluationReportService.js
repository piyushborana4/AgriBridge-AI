/**
 * AgriBridge AI — Evaluation Report & Dossier Service (Phase 8)
 * Compiles comprehensive evaluation reports, model performance summaries, and limitation disclosures.
 */

import { listEvaluationRuns, getEvaluationRun } from './evaluationRunner.js';
import { listEvaluationDatasets } from './evaluationDatasetRegistry.js';
import { getModelDriftOverview } from './modelDriftService.js';
import { getExpertReviewSummary } from './expertReviewService.js';
import { getFailureAnalysisSummary } from './failureAnalysisService.js';
import { getOutcomeEvaluationSummary } from './farmerFeedbackEvaluationService.js';
import { runRegressionSuite } from './regressionSuiteService.js';

/**
 * Compiles a comprehensive AI Quality & Model Evaluation Overview
 * @returns {object} System-wide evaluation dossier
 */
export function getAIQualityOverview() {
  const runs = listEvaluationRuns();
  const datasets = listEvaluationDatasets();
  const drift = getModelDriftOverview();
  const expertReviews = getExpertReviewSummary();
  const failures = getFailureAnalysisSummary();
  const outcomes = getOutcomeEvaluationSummary();
  const regression = runRegressionSuite();

  return {
    overviewTitle: 'AgriBridge AI Model Quality & Continuous Improvement Dossier',
    evaluationStandard: 'Empirical Ground-Truth & Deterministic Safety Standard (Phase 8)',
    timestamp: new Date().toISOString(),
    runsSummary: {
      totalRuns: runs.length,
      recentRuns: runs.slice(0, 5)
    },
    datasetsSummary: {
      totalDatasets: datasets.length,
      realDatasetsCount: datasets.filter(d => d.sourceType !== 'synthetic').length,
      syntheticDatasetsCount: datasets.filter(d => d.sourceType === 'synthetic').length,
      datasets
    },
    drift,
    expertReviews,
    failures,
    outcomes,
    regressionGate: {
      gateStatus: regression.gateStatus,
      canDeploy: regression.canDeploy,
      passedCount: regression.passedCount,
      totalCases: regression.totalCases,
      decision: regression.decision
    },
    disclaimer: 'AgriBridge AI strictly reports evaluated metrics from verified ground-truth datasets. Unmeasured tasks or unconfigured crops are honestly flagged as unmeasured.'
  };
}

/**
 * Generates an exportable markdown / JSON evaluation report for a specific run
 * @param {string} runId
 * @returns {object|null}
 */
export function generateEvaluationReport(runId) {
  const run = getEvaluationRun(runId);
  if (!run) return null;

  return {
    reportTitle: `AI Evaluation Report — ${run.modelId} (${run.modelVersion})`,
    task: run.task,
    datasetId: run.datasetId,
    sampleCount: run.sampleCount,
    status: run.status,
    completedAt: run.completedAt,
    metrics: run.metrics,
    limitations: run.limitations,
    provenance: run.provenance
  };
}
