/**
 * AgriBridge AI — AI Evaluation & Model Quality Contracts (Phase 8)
 * Standardized data schemas for evaluation runs, datasets, cases, expert reviews,
 * claim-to-evidence traces, model cards, and quality gates.
 */

export const EVALUATION_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const DATASET_SOURCE_TYPES = {
  LABELED_FARM_DATA: 'labeled_farm_data',
  EXPERT_REVIEW: 'expert_review',
  RESEARCH_DATASET: 'research_dataset',
  SYNTHETIC: 'synthetic',
  BENCHMARK: 'benchmark',
  USER_FEEDBACK: 'user_feedback'
};

export const CLAIM_TYPES = {
  OBSERVED: 'observed',
  DERIVED: 'derived',
  FORECAST: 'forecast',
  MODELED: 'modeled',
  KNOWLEDGE_BASED: 'knowledge_based',
  HYPOTHESIS: 'hypothesis',
  RECOMMENDATION: 'recommendation',
  UNCERTAIN: 'uncertain',
  UNSUPPORTED: 'unsupported'
};

export const GROUNDING_LEVELS = {
  FULLY_GROUNDED: 'fully_grounded',
  MOSTLY_GROUNDED: 'mostly_grounded',
  PARTIALLY_GROUNDED: 'partially_grounded',
  UNSUPPORTED: 'unsupported'
};

export const QUALITY_GATE_STATUS = {
  PASS: 'PASS',
  PASS_WITH_WARNING: 'PASS_WITH_WARNING',
  REJECT: 'REJECT',
  BLOCKED: 'BLOCKED'
};

export const EXPERT_ASSESSMENTS = {
  APPROPRIATE: 'appropriate',
  PARTIALLY_APPROPRIATE: 'partially_appropriate',
  INAPPROPRIATE: 'inappropriate',
  INSUFFICIENT_INFORMATION: 'insufficient_information'
};

export const REVIEW_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  REVIEWED: 'reviewed',
  NEEDS_MORE_DATA: 'needs_more_data',
  ESCALATED: 'escalated',
  CLOSED: 'closed'
};

export const FAILURE_CATEGORIES = {
  HALLUCINATION: 'hallucination',
  WRONG_DIAGNOSIS: 'wrong_diagnosis',
  UNSUPPORTED_RECOMMENDATION: 'unsupported_recommendation',
  INCORRECT_STAGE: 'incorrect_stage',
  INCORRECT_RISK: 'incorrect_risk',
  MISSING_EVIDENCE: 'missing_evidence',
  SCHEMA_FAILURE: 'schema_failure',
  LOW_CONFIDENCE: 'low_confidence',
  PROVIDER_DATA_ISSUE: 'provider_data_issue'
};

export const FAILURE_SEVERITY = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const DRIFT_STATUS = {
  STABLE: 'stable',
  WATCH: 'watch',
  DRIFT_DETECTED: 'drift_detected',
  INSUFFICIENT_DATA: 'insufficient_data'
};

/**
 * Creates a standardized EvaluationRun record
 */
export function createEvaluationRun({
  id = `eval-run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  modelId,
  modelVersion,
  task,
  datasetId,
  datasetVersion = '1.0.0',
  startedAt = new Date().toISOString(),
  completedAt = null,
  status = EVALUATION_STATUS.COMPLETED,
  metrics = {},
  sampleCount = 0,
  limitations = [],
  provenance = {}
}) {
  if (!modelId) throw new Error('EvaluationRun: modelId is required');
  if (!task) throw new Error('EvaluationRun: task is required');
  if (!datasetId) throw new Error('EvaluationRun: datasetId is required');

  return {
    id,
    modelId,
    modelVersion: modelVersion || '1.0.0',
    task,
    datasetId,
    datasetVersion,
    startedAt,
    completedAt: completedAt || new Date().toISOString(),
    status,
    metrics,
    sampleCount,
    limitations: Array.isArray(limitations) ? limitations : [],
    provenance: {
      evaluator: provenance.evaluator || 'AgriBridge Automated Evaluation Engine',
      environment: provenance.environment || 'production-eval',
      timestamp: provenance.timestamp || new Date().toISOString(),
      ...provenance
    }
  };
}

/**
 * Creates a standardized EvaluationDataset registration record
 */
export function createEvaluationDataset({
  id,
  name,
  version = '1.0.0',
  task,
  description,
  source,
  sourceType = DATASET_SOURCE_TYPES.RESEARCH_DATASET,
  sampleCount = 0,
  labelingMethod = 'Expert Agronomist Annotation',
  labelingQuality = 'High',
  createdAt = new Date().toISOString(),
  reviewedAt = null,
  limitations = [],
  provenance = {}
}) {
  if (!id) throw new Error('EvaluationDataset: id is required');
  if (!name) throw new Error('EvaluationDataset: name is required');
  if (!task) throw new Error('EvaluationDataset: task is required');
  if (!source) throw new Error('EvaluationDataset: source is required');

  return {
    id,
    name,
    version,
    task,
    description: description || name,
    source,
    sourceType,
    sampleCount: Number(sampleCount) || 0,
    labelingMethod,
    labelingQuality,
    createdAt,
    reviewedAt,
    limitations: Array.isArray(limitations) ? limitations : [],
    provenance: {
      curator: provenance.curator || 'AgriBridge AI Research Team',
      license: provenance.license || 'Proprietary / Research Use Only',
      ...provenance
    }
  };
}

/**
 * Creates a traceable Claim-to-Evidence record
 */
export function createClaimTrace({
  claimId = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  claimText,
  claimType = CLAIM_TYPES.DERIVED,
  groundingStatus = GROUNDING_LEVELS.FULLY_GROUNDED,
  evidenceIds = [],
  sources = [],
  confidence = 1.0,
  riskLevel = 'low'
}) {
  return {
    claimId,
    claimText,
    claimType,
    groundingStatus,
    evidenceIds,
    sources,
    confidence,
    riskLevel,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized Model Card
 */
export function createModelCard({
  modelId,
  name,
  version,
  purpose,
  task,
  inputs = [],
  outputs = [],
  supportedCrops = [],
  supportedRegions = [],
  trainingInfo = {},
  evaluationDatasets = [],
  metrics = {},
  limitations = [],
  knownFailureModes = [],
  approvalStatus = 'production',
  lastAudited = new Date().toISOString().split('T')[0]
}) {
  return {
    modelId,
    name,
    version,
    purpose,
    task,
    inputs,
    outputs,
    supportedCrops,
    supportedRegions,
    trainingInfo,
    evaluationDatasets,
    metrics,
    limitations,
    knownFailureModes,
    approvalStatus,
    lastAudited
  };
}
