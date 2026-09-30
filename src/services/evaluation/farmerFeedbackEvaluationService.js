/**
 * AgriBridge AI — Farmer Feedback & Outcome Evaluation Service (Phase 8)
 * Connects recommendations to completed actions, ground-truth farmer observations, and real outcomes.
 * Enforces the critical rule: Action completed != recommendation worked.
 * Never fabricates unverified yield claims.
 */

// Universal in-memory outcome store
let outcomeTraces = [
  {
    traceId: 'trace-rec-001',
    farmId: 'farm-1',
    recommendationId: 'rec-foliar-air-circ-01',
    recommendationTitle: 'Improve Row Aeration & Sanitize Blight Lesions',
    crop: 'Onion (Allium cepa)',
    dateRecommended: '2026-09-18T09:00:00.000Z',
    actionTaken: true,
    actionCompletedAt: '2026-09-19T11:30:00.000Z',
    farmerRating: 'helpful',
    farmerObservation: 'Pruned infected lower foliage; lesion spread halted over the following 5 days.',
    outcomeState: 'positive',
    outcomeObservationDate: '2026-09-24T16:00:00.000Z',
    notes: 'Farmer reported visual improvement in canopy health.'
  }
];

/**
 * Records farmer feedback on an AI recommendation or Action
 * @param {object} params
 * @returns {object} Created or updated outcome trace
 */
export function recordFarmerFeedback({
  farmId,
  recommendationId,
  recommendationTitle,
  crop = 'General Crop',
  actionTaken = true,
  farmerRating = 'helpful',
  farmerObservation = '',
  outcomeState = 'unknown'
}) {
  const trace = {
    traceId: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    farmId,
    recommendationId,
    recommendationTitle: recommendationTitle || 'Agronomic Recommendation',
    crop,
    dateRecommended: new Date().toISOString(),
    actionTaken: Boolean(actionTaken),
    actionCompletedAt: actionTaken ? new Date().toISOString() : null,
    farmerRating,
    farmerObservation,
    outcomeState,
    outcomeObservationDate: new Date().toISOString(),
    notes: farmerObservation ? `Farmer observed: ${farmerObservation}` : 'Feedback recorded'
  };

  outcomeTraces.unshift(trace);
  return trace;
}

/**
 * Lists all outcome traces
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function listOutcomeTraces(filters = {}) {
  return outcomeTraces.filter(t => {
    if (filters.farmId && t.farmId !== filters.farmId) return false;
    if (filters.crop && t.crop !== filters.crop) return false;
    if (filters.outcomeState && t.outcomeState !== filters.outcomeState) return false;
    return true;
  });
}

/**
 * Computes outcome evaluation summary
 * @returns {object} Feedback & outcome metrics
 */
export function getOutcomeEvaluationSummary() {
  const total = outcomeTraces.length;
  if (total === 0) {
    return {
      totalTraces: 0,
      helpfulRate: null,
      actionAdoptionRate: null,
      positiveOutcomeRate: null,
      message: 'No farmer outcome traces recorded yet'
    };
  }

  const helpfulCount = outcomeTraces.filter(t => t.farmerRating === 'helpful' || t.farmerRating === 'worked').length;
  const actedCount = outcomeTraces.filter(t => t.actionTaken).length;
  const positiveOutcomes = outcomeTraces.filter(t => t.outcomeState === 'positive').length;

  return {
    totalTraces: total,
    helpfulRate: Number((helpfulCount / total).toFixed(3)),
    actionAdoptionRate: Number((actedCount / total).toFixed(3)),
    positiveOutcomeRate: actedCount > 0 ? Number((positiveOutcomes / actedCount).toFixed(3)) : null,
    disclaimer: 'Outcome statistics reflect farmer-reported field observations. They do not constitute randomized controlled agronomic trials.'
  };
}
