/**
 * Action Repository & Operations Engine - AgriBridge AI (Phase 5)
 * Manages operational farm actions generated deterministically from
 * Farm Intelligence -> Recommendation Engine -> Decision Engine -> Action Center.
 *
 * Enforces action lifecycle: pending -> in_progress -> completed -> feedback / outcome.
 * Preserves full history (never destroys historical actions).
 */

const STORAGE_KEY = 'agribridge_actions_v1';

/**
 * Seed initial actions based on farm context & recommendations
 */
function getInitialActions() {
  return [
    {
      id: 'ACT-2026-001',
      farmId: 'farm-1',
      title: 'Inspect Drainage Channels in North Parcel',
      description: 'Clear silt and vegetative debris from secondary drainage swales to prevent root-zone waterlogging.',
      reason: 'Recent precipitation (24mm) combined with high clay soil retention poses localized saturation risk.',
      priority: 'high',
      urgency: 'today',
      status: 'pending',
      createdAt: '2026-09-28T08:30:00.000Z',
      dueAt: '2026-09-30T18:00:00.000Z',
      completedAt: null,
      evidenceIds: ['SIG-WX-RAIN-001', 'SIG-SOIL-MOIST-001'],
      sourceRecommendationId: 'REC-DRAIN-01',
      category: 'soil_management',
      isRegenerative: false
    },
    {
      id: 'ACT-2026-002',
      farmId: 'farm-1',
      title: 'Scout Lower Leaf Canopy for Purple Blotch Lesions',
      description: 'Perform 20-point transect inspection across parcel B focusing on dense foliage where humidity accumulates.',
      reason: 'Microclimate sensor indicates sustained relative humidity (>72%) at 26°C favorable for foliar pathogen sporulation.',
      priority: 'high',
      urgency: 'today',
      status: 'in_progress',
      createdAt: '2026-09-29T07:15:00.000Z',
      dueAt: '2026-09-30T17:00:00.000Z',
      completedAt: null,
      evidenceIds: ['SIG-WX-HUMID-001', 'ANOM-PATHOGEN-001'],
      sourceRecommendationId: 'REC-PATH-02',
      category: 'crop_protection',
      isRegenerative: false
    },
    {
      id: 'ACT-2026-003',
      farmId: 'farm-1',
      title: 'Calibrate Pulse Drip Rate for Bulbing Stage',
      description: 'Adjust emitter scheduling to 2x 25-minute pulses to match elevated crop evapotranspiration (ET₀ 4.8 mm/day).',
      reason: 'Onion bulb enlargement stage has high sensitivity to rapid moisture fluctuations.',
      priority: 'medium',
      urgency: 'this_week',
      status: 'pending',
      createdAt: '2026-09-29T11:00:00.000Z',
      dueAt: '2026-10-02T12:00:00.000Z',
      completedAt: null,
      evidenceIds: ['SIG-WX-ET0-001', 'SIG-STAGE-BULB-001'],
      sourceRecommendationId: 'REC-IRR-03',
      category: 'irrigation',
      isRegenerative: false
    },
    {
      id: 'ACT-2026-004',
      farmId: 'farm-1',
      title: 'Incorporate Biochar & Vermicompost Mulch',
      description: 'Apply 2 tonnes/ha stabilized compost along drip lines to build active soil organic matter stock.',
      reason: 'Regenerative Plan Practice: Enhances microbial respiration and cation exchange capacity.',
      priority: 'medium',
      urgency: 'this_week',
      status: 'pending',
      createdAt: '2026-09-27T09:00:00.000Z',
      dueAt: '2026-10-05T18:00:00.000Z',
      completedAt: null,
      evidenceIds: ['SIG-SOIL-OM-001'],
      sourceRecommendationId: 'REC-REGEN-COMPOST',
      category: 'soil_management',
      isRegenerative: true,
      regenerativePractice: 'Soil Carbon Stock Enrichment',
      regenerativeStatus: 'planned'
    },
    {
      id: 'ACT-2026-005',
      farmId: 'farm-1',
      title: 'Applied Potassium Schoenite Foliar Spray',
      description: 'Completed 1.5% K₂O spray application across Block A to support bulb turgor.',
      reason: 'Pre-harvest vegetative monitoring indicated marginal potassium reserves in leaf tissue.',
      priority: 'high',
      urgency: 'today',
      status: 'completed',
      createdAt: '2026-09-25T08:00:00.000Z',
      dueAt: '2026-09-26T18:00:00.000Z',
      completedAt: '2026-09-26T14:30:00.000Z',
      evidenceIds: ['SIG-SOIL-K-001'],
      sourceRecommendationId: 'REC-NUT-05',
      category: 'soil_management',
      observationNotes: 'Sprayed early morning at 07:00 AM before wind speed picked up. No leaf scorch observed.',
      feedbackOutcome: {
        rating: 'helpful',
        label: 'Yes, helped significantly',
        observedEffect: 'Leaf color uniformity restored within 48 hours.',
        recordedAt: '2026-09-28T16:00:00.000Z'
      }
    }
  ];
}

let memoryActions = null;

/**
 * Load actions from storage
 */
export function loadActions() {
  if (typeof localStorage === 'undefined') {
    if (!memoryActions) {
      memoryActions = getInitialActions();
    }
    return memoryActions;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Silently fallback
  }
  const initial = getInitialActions();
  saveActions(initial);
  return initial;
}

/**
 * Save actions to storage
 */
export function saveActions(actions) {
  if (typeof localStorage === 'undefined') {
    memoryActions = actions;
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch (e) {
    // Silently fallback
  }
}

/**
 * Get actions for a specific farm or all farms with optional filtering
 */
export function getActions(farmId = null, filters = {}) {
  let actions = loadActions();

  if (farmId && farmId !== 'all') {
    actions = actions.filter(a => a.farmId === farmId);
  }

  if (filters.status && filters.status !== 'all') {
    actions = actions.filter(a => a.status === filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    actions = actions.filter(a => a.priority === filters.priority);
  }

  if (filters.urgency && filters.urgency !== 'all') {
    actions = actions.filter(a => a.urgency === filters.urgency);
  }

  if (filters.category && filters.category !== 'all') {
    actions = actions.filter(a => a.category === filters.category);
  }

  if (filters.isRegenerative !== undefined) {
    actions = actions.filter(a => Boolean(a.isRegenerative) === Boolean(filters.isRegenerative));
  }

  return actions;
}

/**
 * Create a new operational action
 */
export function createAction(actionData) {
  const actions = loadActions();
  const newAction = {
    id: actionData.id || `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    farmId: actionData.farmId || 'farm-1',
    title: actionData.title,
    description: actionData.description || '',
    reason: actionData.reason || '',
    priority: actionData.priority || 'medium',
    urgency: actionData.urgency || 'today',
    status: 'pending',
    createdAt: new Date().toISOString(),
    dueAt: actionData.dueAt || new Date(Date.now() + 86400000 * 2).toISOString(),
    completedAt: null,
    evidenceIds: Array.isArray(actionData.evidenceIds) ? actionData.evidenceIds : [],
    sourceRecommendationId: actionData.sourceRecommendationId || null,
    category: actionData.category || 'operational',
    isRegenerative: Boolean(actionData.isRegenerative),
    regenerativePractice: actionData.regenerativePractice || null,
    regenerativeStatus: actionData.isRegenerative ? 'planned' : undefined
  };

  actions.unshift(newAction);
  saveActions(actions);
  return newAction;
}

/**
 * Start an action (transitions pending -> in_progress)
 */
export function startAction(actionId) {
  const actions = loadActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  actions[index] = {
    ...actions[index],
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    regenerativeStatus: actions[index].isRegenerative ? 'started' : actions[index].regenerativeStatus
  };

  saveActions(actions);
  return actions[index];
}

/**
 * Complete an action with optional observation notes and photo
 */
export function completeAction(actionId, completionData = {}) {
  const actions = loadActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  actions[index] = {
    ...actions[index],
    status: 'completed',
    completedAt: new Date().toISOString(),
    observationNotes: completionData.notes || completionData.observationNotes || '',
    observationPhoto: completionData.photo || completionData.observationPhoto || null,
    regenerativeStatus: actions[index].isRegenerative ? 'completed' : actions[index].regenerativeStatus
  };

  saveActions(actions);
  return actions[index];
}

/**
 * Snooze an action by N days
 */
export function snoozeAction(actionId, days = 2) {
  const actions = loadActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  const currentDue = new Date(actions[index].dueAt || Date.now());
  const newDue = new Date(currentDue.getTime() + days * 86400000);

  actions[index] = {
    ...actions[index],
    status: 'snoozed',
    dueAt: newDue.toISOString(),
    snoozedAt: new Date().toISOString()
  };

  saveActions(actions);
  return actions[index];
}

/**
 * Dismiss an action with reason
 */
export function dismissAction(actionId, reason = '') {
  const actions = loadActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  actions[index] = {
    ...actions[index],
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
    dismissReason: reason
  };

  saveActions(actions);
  return actions[index];
}

/**
 * Undo action completion / dismissal (reverts to pending)
 */
export function undoAction(actionId) {
  const actions = loadActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  actions[index] = {
    ...actions[index],
    status: 'pending',
    completedAt: null,
    dismissedAt: null,
    dismissReason: null,
    regenerativeStatus: actions[index].isRegenerative ? 'planned' : undefined
  };

  saveActions(actions);
  return actions[index];
}

/**
 * Record farmer outcome feedback for a completed action
 */
export function recordActionFeedback(actionId, rating, outcomeNote = '') {
  const actions = loadActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  const ratingMap = {
    helpful: 'Yes, helped significantly',
    somewhat: 'Somewhat helpful',
    no: 'No, did not help',
    unsure: 'Not sure / Pending observation'
  };

  actions[index] = {
    ...actions[index],
    feedbackOutcome: {
      rating,
      label: ratingMap[rating] || rating,
      observedEffect: outcomeNote,
      recordedAt: new Date().toISOString()
    }
  };

  saveActions(actions);
  return actions[index];
}

/**
 * Synchronize actions from deterministic FarmIntelligence candidate recommendations
 */
export function syncActionsFromIntelligence(farmId, candidateRecommendations = []) {
  if (!Array.isArray(candidateRecommendations) || candidateRecommendations.length === 0) {
    return loadActions();
  }

  const existing = loadActions();
  const existingSourceIds = new Set(existing.map(a => a.sourceRecommendationId).filter(Boolean));

  let added = false;
  candidateRecommendations.forEach(rec => {
    if (rec.id && !existingSourceIds.has(rec.id)) {
      const priority = rec.urgency === 'immediate' ? 'critical' : rec.urgency === 'today' ? 'high' : 'medium';
      const urgency = rec.urgency === 'immediate' || rec.urgency === 'today' ? 'today' : rec.urgency === 'this_week' ? 'this_week' : 'monitor';

      existing.unshift({
        id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        farmId,
        title: rec.title,
        description: rec.action || rec.description || '',
        reason: rec.rationale || rec.reason || '',
        priority,
        urgency,
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + (urgency === 'today' ? 86400000 : 86400000 * 3)).toISOString(),
        completedAt: null,
        evidenceIds: Array.isArray(rec.evidenceIds) ? rec.evidenceIds : [],
        sourceRecommendationId: rec.id,
        category: rec.category || 'operational',
        isRegenerative: rec.category === 'soil_management' && (rec.title.toLowerCase().includes('compost') || rec.title.toLowerCase().includes('cover') || rec.title.toLowerCase().includes('organic'))
      });
      added = true;
    }
  });

  if (added) {
    saveActions(existing);
  }
  return existing;
}
