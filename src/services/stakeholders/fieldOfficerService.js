/**
 * AgriBridge AI — Field Officer & Extension Workflow Service (Phase 10)
 * Manages farm assignments, deterministic priority queues, field visit lifecycles,
 * and farmer support request escalations.
 */

import { VISIT_STATUS, REQUEST_STATUS, createFieldVisit, createSupportRequest } from './stakeholderTypes.js';

// In-memory store for visits and requests
let fieldVisitsStore = [
  createFieldVisit({
    visitId: 'visit-101',
    farmId: 'farm-1',
    officerId: 'officer-nashik-01',
    officerName: 'Vijay Deshmukh (Senior Extension Officer)',
    scheduledDate: '2026-10-02T10:00:00.000Z',
    status: VISIT_STATUS.PLANNED,
    purpose: 'Foliar Blotch Inspection & Soil Sampling',
    notes: 'Prioritized due to recent high humidity and localized canopy stress.'
  })
];

let supportRequestsStore = [
  createSupportRequest({
    requestId: 'req-201',
    farmId: 'farm-1',
    farmerName: 'Ramesh Patil',
    category: 'EXPERT_REVIEW',
    subject: 'Uncertain Purple Blotch lesions on late Kharif onion crop',
    description: 'Noticing purple concentric lesions on lower onion leaves. Seeking agronomist confirmation.',
    crop: 'Onion (Allium cepa)',
    urgency: 'HIGH',
    status: REQUEST_STATUS.ASSIGNED,
    assignedTo: 'officer-nashik-01'
  })
];

/**
 * Computes deterministic Priority Farm Queue for an assigned officer
 * Uses real signals (risk score, water stress, heat stress, pending actions)
 * @param {Array<object>} farms - List of farm objects with telemetry/context
 * @returns {Array<object>} Prioritized farm list with explainable drivers
 */
export function calculatePriorityFarmQueue(farms = []) {
  if (!Array.isArray(farms) || farms.length === 0) return [];

  const evaluated = farms.map(farm => {
    const reasons = [];
    let priorityScore = 0;

    // 1. Weather / Heat Stress Check
    const temp = farm.weather?.temperature || farm.weather?.current?.temp || 25;
    if (temp >= 38) {
      priorityScore += 35;
      reasons.push(`Extreme heat stress (${temp}°C)`);
    } else if (temp >= 34) {
      priorityScore += 20;
      reasons.push(`Elevated ambient temperature (${temp}°C)`);
    }

    // 2. Soil Moisture & Water Balance
    const moisture = farm.soil?.moisture ?? (farm.soil?.soilMoisture ?? 50);
    if (moisture < 25) {
      priorityScore += 30;
      reasons.push(`Critical root-zone moisture deficit (${moisture}%)`);
    } else if (moisture < 35) {
      priorityScore += 15;
      reasons.push(`Low soil moisture reserve (${moisture}%)`);
    }

    // 3. Satellite Canopy Stress
    const ndvi = farm.satellite?.ndvi ?? 0.70;
    if (ndvi < 0.45) {
      priorityScore += 25;
      reasons.push(`Canopy vigor decline (NDVI ${ndvi.toFixed(2)})`);
    }

    // 4. Pending Unresolved Alerts / Actions
    const pendingActions = farm.pendingActionsCount || (farm.actions ? farm.actions.filter(a => a.status === 'PENDING').length : 0);
    if (pendingActions > 0) {
      priorityScore += Math.min(20, pendingActions * 5);
      reasons.push(`${pendingActions} pending high-priority agronomic action(s)`);
    }

    const priorityLevel = priorityScore >= 60 ? 'HIGH' : priorityScore >= 30 ? 'MEDIUM' : 'LOW';

    return {
      farmId: farm.id,
      farmName: farm.name || 'Unnamed Farm',
      location: farm.location?.name || farm.location || 'Agro-Climatic Zone',
      crop: farm.crop?.name || farm.crop || 'Field Crop',
      priorityScore,
      priorityLevel,
      drivers: reasons.length > 0 ? reasons : ['Normal crop health parameters'],
      explanation: reasons.length > 0 ? reasons.join(' + ') : 'Routine seasonal monitoring'
    };
  });

  // Sort descending by priority score
  return evaluated.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Schedules a new field visit
 * @param {object} params
 * @returns {object} Created FieldVisit
 */
export function scheduleFieldVisit(params) {
  const visit = createFieldVisit(params);
  fieldVisitsStore.unshift(visit);
  return visit;
}

/**
 * Updates visit lifecycle status
 * @param {string} visitId
 * @param {string} status - from VISIT_STATUS
 * @param {object} [completionData] - { observations, photos, recommendations, notes }
 * @returns {object|null}
 */
export function updateFieldVisitStatus(visitId, status, completionData = {}) {
  const visit = fieldVisitsStore.find(v => v.visitId === visitId);
  if (!visit) return null;

  visit.status = status;
  if (status === VISIT_STATUS.STARTED && !visit.actualDate) {
    visit.actualDate = new Date().toISOString();
  }
  if (status === VISIT_STATUS.COMPLETED) {
    visit.completedAt = new Date().toISOString();
    if (completionData.observations) visit.observations = completionData.observations;
    if (completionData.photos) visit.photos = completionData.photos;
    if (completionData.recommendations) visit.recommendations = completionData.recommendations;
    if (completionData.notes) visit.notes = completionData.notes;
  }
  return visit;
}

/**
 * Lists field visits with optional filters
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function listFieldVisits(filters = {}) {
  return fieldVisitsStore.filter(v => {
    if (filters.officerId && v.officerId !== filters.officerId) return false;
    if (filters.farmId && v.farmId !== filters.farmId) return false;
    if (filters.status && v.status !== filters.status) return false;
    return true;
  });
}

/**
 * Submits a new support request from farmer
 * @param {object} params
 * @returns {object} Created SupportRequest
 */
export function submitSupportRequest(params) {
  const req = createSupportRequest(params);
  supportRequestsStore.unshift(req);
  return req;
}

/**
 * Updates support request status / assignment
 * @param {string} requestId
 * @param {object} updates - { status, assignedTo, resolutionNotes }
 * @returns {object|null}
 */
export function updateSupportRequest(requestId, updates = {}) {
  const req = supportRequestsStore.find(r => r.requestId === requestId);
  if (!req) return null;

  if (updates.status) req.status = updates.status;
  if (updates.assignedTo) req.assignedTo = updates.assignedTo;
  if (updates.resolutionNotes) req.resolutionNotes = updates.resolutionNotes;
  req.updatedAt = new Date().toISOString();

  return req;
}

/**
 * Lists support requests
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function listSupportRequests(filters = {}) {
  return supportRequestsStore.filter(r => {
    if (filters.farmId && r.farmId !== filters.farmId) return false;
    if (filters.assignedTo && r.assignedTo !== filters.assignedTo) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.category && r.category !== filters.category) return false;
    return true;
  });
}
