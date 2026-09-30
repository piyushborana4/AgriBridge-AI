/**
 * AGRIBRIDGE AI — Phase 5 Operations, Action Center & Assistant Test Suite
 *
 * Verifies:
 * 1. Action Center: Lifecycle (create, start, complete, snooze, dismiss, undo, feedback, sync).
 * 2. Farm Journal: Observation logging, search, filtering, and USER_PROVIDED evidence formatting.
 * 3. Crop Doctor Cases: Case creation, follow-up scheduling, and condition trajectory tracking.
 * 4. Digital Twin Timeline: Unified multi-stream assembly and outcome tracking without false causation.
 * 5. Assistant Context & Anti-Fabrication: Rejection of fabricated soil pH, proposed action confirmation.
 */

import assert from 'node:assert';
import { 
  createAction, 
  startAction, 
  completeAction, 
  snoozeAction, 
  dismissAction, 
  undoAction, 
  recordActionFeedback,
  getActions,
  syncActionsFromIntelligence
} from '../../operations/actionRepository.js';
import { 
  addJournalEntry, 
  getJournalEntries, 
  getJournalForEvidence 
} from '../../operations/journalRepository.js';
import { 
  createCase, 
  addCaseFollowUp, 
  getCases 
} from '../../operations/cropDoctorRepository.js';
import { 
  getUnifiedFarmTimeline, 
  getOutcomeTimeline, 
  getWhatChangedMetrics 
} from '../../operations/digitalTwinTimelineService.js';
import { 
  generateDeterministicAssistantResponse 
} from '../../ai/assistantService.js';
import { validateAssistantResponse } from '../../ai/schemas/index.js';
import { DataStatus, SourceType } from '../../data/provenanceTypes.js';

console.log('================================================================');
console.log('  AGRIBRIDGE AI — PHASE 5 OPERATIONS & ASSISTANT TEST SUITE     ');
console.log('================================================================\n');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(`  ${err.message}`);
  }
}

// -------------------------------------------------------------
// 1. Action Center Lifecycle Tests
// -------------------------------------------------------------
test('Action Center: Create, Start, Complete, Snooze, Dismiss, and Undo lifecycle', () => {
  const newAction = createAction({
    farmId: 'test-farm-01',
    title: 'Inspect Low-Lying Swale for Saturation',
    description: 'Clear ditch debris',
    reason: 'Heavy morning rainfall',
    priority: 'high',
    urgency: 'today',
    evidenceIds: ['SIG-WX-RAIN-001']
  });

  assert.strictEqual(newAction.status, 'pending', 'Initial status must be pending');
  assert.strictEqual(newAction.priority, 'high');

  // Start Action
  const started = startAction(newAction.id);
  assert.strictEqual(started.status, 'in_progress', 'Status must transition to in_progress');

  // Complete Action
  const completed = completeAction(newAction.id, {
    notes: 'Cleared 30m of furrow swale. Standing water drained in 20 min.'
  });
  assert.strictEqual(completed.status, 'completed', 'Status must transition to completed');
  assert.ok(completed.completedAt, 'completedAt timestamp must be recorded');
  assert.ok(completed.observationNotes.includes('furrow swale'));

  // Record Feedback
  const withFeedback = recordActionFeedback(newAction.id, 'helpful', 'Canopy vigor recovered in 48h.');
  assert.strictEqual(withFeedback.feedbackOutcome.rating, 'helpful');
  assert.ok(withFeedback.feedbackOutcome.label.includes('helped'));

  // Undo Action
  const undone = undoAction(newAction.id);
  assert.strictEqual(undone.status, 'pending', 'Undo must revert status to pending');
  assert.strictEqual(undone.completedAt, null, 'completedAt must be reset on undo');

  // Snooze Action
  const snoozed = snoozeAction(newAction.id, 3);
  assert.strictEqual(snoozed.status, 'snoozed');

  // Dismiss Action
  const dismissed = dismissAction(newAction.id, 'Plot harvested');
  assert.strictEqual(dismissed.status, 'dismissed');
  assert.strictEqual(dismissed.dismissReason, 'Plot harvested');
});

test('Action Center: Deterministic recommendations sync into actions without duplicates', () => {
  const recommendations = [
    {
      id: 'REC-IRR-99',
      title: 'Apply Pulse Irrigation',
      action: 'Run drip for 30 min',
      rationale: 'High ET0',
      urgency: 'today',
      category: 'irrigation',
      evidenceIds: ['SIG-WX-ET0-001']
    }
  ];

  const actions = syncActionsFromIntelligence('test-farm-01', recommendations);
  const synced = actions.find(a => a.sourceRecommendationId === 'REC-IRR-99');
  assert.ok(synced, 'Recommendation must be converted into an action');
  assert.strictEqual(synced.urgency, 'today');

  // Second sync must not create duplicates
  const actions2 = syncActionsFromIntelligence('test-farm-01', recommendations);
  const matching = actions2.filter(a => a.sourceRecommendationId === 'REC-IRR-99');
  assert.strictEqual(matching.length, 1, 'Duplicate recommendations must not be duplicated');
});

// -------------------------------------------------------------
// 2. Farm Journal & Observation Tests
// -------------------------------------------------------------
test('Farm Journal: Adds observation, filters by type, and formats as USER_PROVIDED evidence', () => {
  const entry = addJournalEntry({
    farmId: 'test-farm-01',
    field: 'South Parcel B',
    crop: 'Onion',
    growthStage: 'Bulbing',
    observationType: 'disease_symptom',
    title: 'Isolated purple spot on leaf tip',
    note: 'Found 2 plants with minor spot. Weather has been foggy in mornings.',
    tags: ['leaf-spot', 'foliar']
  });

  assert.ok(entry.id, 'Entry must have an ID');
  assert.strictEqual(entry.observationType, 'disease_symptom');

  // Filter verification
  const filtered = getJournalEntries('test-farm-01', { observationType: 'disease_symptom' });
  assert.ok(filtered.some(e => e.id === entry.id), 'Filter by type must include newly added entry');

  // Evidence format conversion for Context Engine
  const evidenceList = getJournalForEvidence('test-farm-01');
  const matchingEvidence = evidenceList.find(e => e.id === entry.linkedEvidenceId);
  
  assert.ok(matchingEvidence, 'Journal entry must be converted to an evidence item');
  assert.strictEqual(matchingEvidence.status, DataStatus.USER_PROVIDED, 'Status must be USER_PROVIDED');
  assert.strictEqual(matchingEvidence.sourceType, SourceType.FARMER_INPUT, 'Source must be FARMER_INPUT');
  assert.ok(matchingEvidence.provenanceNotes.includes('Treated as USER_PROVIDED'));
});

// -------------------------------------------------------------
// 3. Crop Doctor Clinical Case Management Tests
// -------------------------------------------------------------
test('Crop Doctor: Creates case, records follow-up inspection, and tracks condition trajectory', () => {
  const clinicalCase = createCase({
    farmId: 'test-farm-01',
    crop: 'Onion',
    plant_part: 'leaf',
    diagnosis: 'Early Alternaria Leaf Blight',
    diagnosis_category: 'disease',
    confidence: 85,
    severity: 'moderate',
    recommended_actions: ['Prune affected leaves', 'Increase plant spacing']
  });

  assert.ok(clinicalCase.caseId, 'Case ID must be created');
  assert.strictEqual(clinicalCase.status, 'open', 'Initial status must be open');
  assert.ok(clinicalCase.followUpDate, 'Next follow-up date must be scheduled');

  // Add Follow-up Inspection
  const updatedCase = addCaseFollowUp(clinicalCase.caseId, {
    note: 'Pruned infected leaves. No new lesions on fresh foliage.',
    conditionStatus: 'improving',
    confidence: 90
  });

  assert.strictEqual(updatedCase.followUps.length, 1, 'Follow-up must be recorded');
  assert.strictEqual(updatedCase.followUps[0].conditionStatus, 'improving');
  assert.strictEqual(updatedCase.status, 'monitoring', 'Status must transition to monitoring');
});

// -------------------------------------------------------------
// 4. Digital Twin Timeline & Outcome Analytics Tests
// -------------------------------------------------------------
test('Digital Twin: Unifies actions, observations, satellite passes, and outcome causality', () => {
  const timeline = getUnifiedFarmTimeline('test-farm-01');
  assert.ok(timeline.length > 0, 'Unified timeline must contain multi-stream events');

  // Verify Outcome Timeline
  const outcomes = getOutcomeTimeline('test-farm-01');
  outcomes.forEach(out => {
    assert.ok(out.actionId, 'Outcome must link to an action ID');
    assert.strictEqual(out.correlationNote, 'Observed after action implementation.', 'Must not claim false causation');
  });

  // Verify What Changed metrics calculation
  const mockContext = {
    riskScore: 34,
    weather: { current: { rainfall: 28.0 } },
    soil: { moisture: { surface: 36 } },
    satellite: { currentNdvi: 0.72, previousNdvi: 0.75 }
  };
  const mockPrev = {
    riskScore: 28,
    weather: { current: { rainfall: 18.0 } },
    soil: { moisture: { surface: 30 } },
    satellite: { currentNdvi: 0.75 }
  };

  const whatChanged = getWhatChangedMetrics(mockContext, mockPrev);
  assert.strictEqual(whatChanged.hasSufficientData, true);
  assert.strictEqual(whatChanged.changes.length, 4, 'Must compute 4 core metric deltas');
  const rainChange = whatChanged.changes.find(c => c.metric.includes('Rainfall'));
  assert.strictEqual(rainChange.direction, 'up');
  assert.ok(rainChange.deltaPct > 0);
});

// -------------------------------------------------------------
// 5. Context-Aware Assistant & Truth-in-Data Tests
// -------------------------------------------------------------
test('Assistant: Accurately explains missing soil lab test and distinguishes modeled estimates', () => {
  // Scenario 1: Farm without lab test
  const contextWithoutLab = {
    farm: { id: 'farm-1', name: 'Nashik Parcel 1', crop: 'Onion', growthStage: 'Bulbing' },
    weather: { temp: 28, humidity: 65, rainfall7d: 22, isLive: true },
    satellite: { currentNdvi: 0.74, sourceBadge: 'LATEST OBSERVATION' },
    soil: { isLabTest: false, ph: 7.0, sourceBadge: 'MODELED ESTIMATE' },
    intelligence: { riskScore: 30, confidenceScore: 80, evidenceIds: ['SIG-WX-TEMP-001'] },
    activeActions: []
  };

  const response1 = generateDeterministicAssistantResponse('What is my soil pH?', contextWithoutLab);
  
  assert.ok(response1.answer.includes('do not have a verified laboratory soil pH measurement'), 'Must state lab test is missing');
  assert.ok(response1.answer.includes('ISRIC SoilGrids 2.0') || response1.answer.includes('modeled estimate'), 'Must flag modeled estimate');
  assert.ok(response1.proposedAction, 'Must propose action to schedule lab test');
  assert.strictEqual(response1.proposedAction.category, 'soil_management');

  // Scenario 2: Farm with verified lab test
  const contextWithLab = {
    ...contextWithoutLab,
    soil: { isLabTest: true, ph: 6.8, nitrogen: 220, organicMatter: 2.8, sourceBadge: 'FARMER ENTERED' }
  };

  const response2 = generateDeterministicAssistantResponse('What is my soil pH?', contextWithLab);
  assert.ok(response2.answer.includes('6.8'), 'Must state verified pH');
  assert.ok(response2.answer.includes('Soil Health Card'), 'Must cite verified lab source');
  assert.strictEqual(response2.proposedAction, null, 'Must not propose lab test if already verified');
});

test('Assistant: Strips hallucinated evidence IDs via schema validator', () => {
  const rawResponse = {
    answer: 'Irrigate field immediately.',
    evidence_ids: ['SIG-WX-TEMP-001', 'SIG-HALLUCINATED-AI-888'],
    suggestedQuestions: ['What about humidity?']
  };

  const validGroundTruthIds = ['SIG-WX-TEMP-001'];
  const result = validateAssistantResponse(rawResponse, validGroundTruthIds);

  assert.strictEqual(result.isValid, true);
  assert.deepStrictEqual(result.sanitized.evidence_ids, ['SIG-WX-TEMP-001'], 'Must strip hallucinated evidence IDs');
});

console.log(`\nPhase 5 Operations & Assistant Tests Passed: ${passCount}/${totalCount}\n`);

if (passCount !== totalCount) {
  process.exit(1);
}
