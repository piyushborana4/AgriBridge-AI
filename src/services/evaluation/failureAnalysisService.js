/**
 * AgriBridge AI — AI Failure Analysis & Root Cause Center (Phase 8)
 * Tracks, categorizes, and audits AI failures with structured root-cause attribution
 * and corrective-action tracking.
 */

import { FAILURE_CATEGORIES, FAILURE_SEVERITY } from './evaluationContracts.js';

// Universal in-memory failure log
let failureLogs = [
  {
    id: 'fail-001',
    category: FAILURE_CATEGORIES.LOW_CONFIDENCE,
    severity: FAILURE_SEVERITY.LOW,
    rootCause: 'user_input_issue',
    summary: 'Blurry foliage photo caused low-confidence diagnosis (0.52). Model safely abstained.',
    component: 'Crop Doctor ViT / Multimodal Vision',
    timestamp: '2026-09-27T14:20:00.000Z',
    correctiveAction: 'ui_clarification',
    correctiveStatus: 'resolved',
    notes: 'Prompted farmer to capture steady daylight close-up.'
  },
  {
    id: 'fail-002',
    category: FAILURE_CATEGORIES.MISSING_EVIDENCE,
    severity: FAILURE_SEVERITY.MODERATE,
    rootCause: 'data_issue',
    summary: 'Soil nitrogen advisory lacked laboratory lab test; fallback to regional baseline.',
    component: 'Agronomic Context Engine',
    timestamp: '2026-09-28T09:15:00.000Z',
    correctiveAction: 'data_source_correction',
    correctiveStatus: 'in_progress',
    notes: 'Notified farmer to upload official Soil Health Card lab results.'
  }
];

/**
 * Lists recorded AI failure logs
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function listFailureLogs(filters = {}) {
  return failureLogs.filter(f => {
    if (filters.category && f.category !== filters.category) return false;
    if (filters.severity && f.severity !== filters.severity) return false;
    if (filters.rootCause && f.rootCause !== filters.rootCause) return false;
    return true;
  });
}

/**
 * Records a new AI failure incident
 * @param {object} params
 * @returns {object} Created Failure incident
 */
export function recordFailureIncident({
  category = FAILURE_CATEGORIES.LOW_CONFIDENCE,
  severity = FAILURE_SEVERITY.MODERATE,
  rootCause = 'unknown',
  summary,
  component = 'AI Core',
  correctiveAction = 'investigate',
  notes = ''
}) {
  const incident = {
    id: `fail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    category,
    severity,
    rootCause,
    summary: summary || 'Unspecified AI diagnostic/advisory anomaly',
    component,
    timestamp: new Date().toISOString(),
    correctiveAction,
    correctiveStatus: 'open',
    notes
  };

  failureLogs.unshift(incident);
  return incident;
}

/**
 * Updates corrective action status on a failure
 * @param {string} incidentId
 * @param {string} newStatus - 'open' | 'in_progress' | 'resolved'
 * @param {string} [notes]
 * @returns {object|null}
 */
export function updateCorrectiveAction(incidentId, newStatus, notes = '') {
  const incident = failureLogs.find(f => f.id === incidentId);
  if (!incident) return null;
  incident.correctiveStatus = newStatus;
  if (notes) incident.notes = notes;
  return incident;
}

/**
 * Computes failure category breakdown and summary stats
 * @returns {object} Summary stats
 */
export function getFailureAnalysisSummary() {
  const total = failureLogs.length;
  const categories = {};
  const severities = {};
  const rootCauses = {};

  failureLogs.forEach(f => {
    categories[f.category] = (categories[f.category] || 0) + 1;
    severities[f.severity] = (severities[f.severity] || 0) + 1;
    rootCauses[f.rootCause] = (rootCauses[f.rootCause] || 0) + 1;
  });

  return {
    totalIncidents: total,
    openIncidents: failureLogs.filter(f => f.correctiveStatus === 'open').length,
    inProgressIncidents: failureLogs.filter(f => f.correctiveStatus === 'in_progress').length,
    resolvedIncidents: failureLogs.filter(f => f.correctiveStatus === 'resolved').length,
    breakdownByCategory: categories,
    breakdownBySeverity: severities,
    breakdownByRootCause: rootCauses
  };
}
