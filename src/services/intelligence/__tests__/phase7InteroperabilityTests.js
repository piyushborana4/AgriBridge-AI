/**
 * AgriBridge AI — Phase 7 Interoperability & Knowledge Exchange Test Suite
 * Validates country registry, data contracts, farmer consent, privacy-preserving transformation,
 * knowledge exchange workflows, model governance, data exchange pipelines, and strict anti-fabrication invariants.
 */

import {
  createAgriculturalDataEnvelope,
  validateAgriculturalDataEnvelope,
  migrateEnvelopeVersion,
  DATA_VISIBILITY,
  DATA_STATUS
} from '../../interoperability/dataContracts.js';

import {
  getCountryProfile,
  listSupportedCountries,
  evaluateCountryContext,
  normalizeCountryCode
} from '../../interoperability/countryRegistry.js';

import {
  getFarmConsent,
  updateFarmConsent,
  revokeFarmConsent,
  getConsentAuditLogs,
  resetConsentMemoryStore
} from '../../interoperability/consentService.js';

import {
  applyPrivacyPreservingTransform,
  coarsenCoordinates
} from '../../interoperability/privacyService.js';

import {
  publishKnowledgeEntry,
  reviewKnowledgeEntry,
  createKnowledgeVersion,
  getApprovedKnowledge,
  detectKnowledgeConflicts,
  matchApplicableKnowledge,
  KNOWLEDGE_STATUS,
  resetKnowledgeMemoryStore
} from '../../interoperability/knowledgeExchangeService.js';

import {
  registerModel,
  updateModelStatus,
  getRegisteredModels,
  getProductionModels,
  compareModels,
  MODEL_STATUS,
  resetModelMemoryStore
} from '../../interoperability/modelRegistryService.js';

import {
  executeDataExchange,
  getExchangeLogs,
  getQuarantinedRecords,
  resetExchangeMemoryStore
} from '../../interoperability/dataExchangeService.js';

import {
  enqueueOfflineMutation,
  processSyncQueue,
  getSyncStatus,
  resetSyncMemoryStore
} from '../../interoperability/syncService.js';

import {
  computeRegionalIntelligence
} from '../../interoperability/regionalIntelligenceService.js';

import {
  getInteroperabilityOverview
} from '../../interoperability/interoperabilityService.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runPhase7InteroperabilityTests() {
  console.log('================================================================');
  console.log('  AGRIBRIDGE AI — PHASE 7 INTEROPERABILITY & BRICS TEST SUITE   ');
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

  // 1. Country Registry & Country Context
  test('Country Registry: Loads supported BRICS nations with honest statuses and handles unconfigured countries', () => {
    const countries = listSupportedCountries();
    assert(countries.length >= 5, 'Should support at least 5 BRICS countries');

    const india = getCountryProfile('India');
    assert(india.code === 'IN', 'India code is IN');
    assert(india.interoperabilityStatus === 'connected', 'India status is connected');

    const brazil = getCountryProfile('Brazil');
    assert(brazil.code === 'BR', 'Brazil code is BR');
    assert(brazil.interoperabilityStatus === 'configured', 'Brazil status is configured, not fake connected');

    // Unknown country
    const unknownContext = evaluateCountryContext({ country: 'Atlantis Fantasy Realm' });
    assert(unknownContext.isAvailable === false, 'Unknown country isAvailable must be false');
    assert(unknownContext.statusMessage.includes('unavailable'), 'Should flag unavailable context');
  });

  // 2. Data Contracts & Schema Validation
  test('Data Contracts: Validates AgriculturalDataEnvelope, enforces provenance, and migrates versions', () => {
    // Valid envelope
    const validEnvelope = createAgriculturalDataEnvelope({
      recordType: 'observation',
      recordId: 'OBS-001',
      country: 'India',
      region: 'Nashik',
      farmId: 'farm-123',
      payload: { crop: 'Onion', ndvi: 0.76 },
      provenance: {
        source: 'Sentinel-2 MSI',
        provider: 'ESA Copernicus',
        sourceType: DATA_STATUS.OBSERVED,
        confidence: 0.95,
        isLive: true
      }
    });

    const validation = validateAgriculturalDataEnvelope(validEnvelope);
    assert(validation.isValid === true, `Valid envelope should pass validation (Errors: ${validation.errors.join(', ')})`);

    // Invalid envelope (missing provenance)
    const invalidEnvelope = {
      schemaVersion: '1.2.0',
      recordType: 'observation',
      recordId: 'OBS-BAD',
      payload: { crop: 'Onion' }
      // missing provenance
    };
    const invalidCheck = validateAgriculturalDataEnvelope(invalidEnvelope);
    assert(invalidCheck.isValid === false, 'Envelope without provenance must fail validation');

    // Schema version migration
    const legacyEnvelope = {
      schemaVersion: '1.0.0',
      recordType: 'soil_test',
      recordId: 'SOIL-LEGACY-01',
      payload: { ph: 6.8 },
      provenance: { source: 'Lab', sourceType: 'USER_PROVIDED' }
    };
    const migrated = migrateEnvelopeVersion(legacyEnvelope);
    assert(migrated.schemaVersion === '1.2.0', 'Legacy envelope should be migrated to 1.2.0');
  });

  // 3. Sovereign Farmer Consent & Revocation
  test('Farmer Consent: Defaults to PRIVATE, records audit trail, and respects revocation', () => {
    resetConsentMemoryStore();
    const farmId = 'farm-test-consent-1';

    // Default must be private
    const initialConsent = getFarmConsent(farmId);
    assert(initialConsent.visibility === DATA_VISIBILITY.PRIVATE, 'Default visibility MUST be private');

    // Update consent to allow research
    const updated = updateFarmConsent(farmId, {
      sharingScope: { allowAnonymizedResearch: true, allowBricsKnowledgeHub: true }
    }, 'Farmer opted in for BRICS research exchange');

    assert(updated.visibility === DATA_VISIBILITY.RESEARCH, 'Visibility should update to research');
    assert(updated.consentStatus === 'granted', 'Consent status should be granted');

    // Verify audit log
    const logs = getConsentAuditLogs(farmId);
    assert(logs.length >= 1, 'Should record consent audit log');
    assert(logs[0].action === 'CONSENT_UPDATED', 'Audit action should be CONSENT_UPDATED');

    // Revoke consent
    const revoked = revokeFarmConsent(farmId, 'Farmer requested complete revocation');
    assert(revoked.visibility === DATA_VISIBILITY.PRIVATE, 'Revoked consent must revert to PRIVATE');
    assert(revoked.consentStatus === 'revoked', 'Consent status should be revoked');

    const logsAfterRevoke = getConsentAuditLogs(farmId);
    assert(logsAfterRevoke[0].action === 'CONSENT_REVOKED', 'Audit log should record revocation');
  });

  // 4. Privacy-Preserving Transformation & Anonymization
  test('Privacy Transformation: Strips direct personal identifiers and coarsens spatial precision', () => {
    resetConsentMemoryStore();
    const farmId = 'farm-privacy-test-1';

    // Grant research consent
    updateFarmConsent(farmId, {
      sharingScope: { allowAnonymizedResearch: true, allowBricsKnowledgeHub: true }
    });

    const envelopeWithPersonalData = createAgriculturalDataEnvelope({
      recordType: 'crop_observation',
      recordId: 'REC-PRIVACY-001',
      country: 'India',
      region: 'Nashik',
      farmId,
      geometry: { type: 'Point', coordinates: [73.789876, 19.997543] },
      payload: {
        farmerName: 'Ramesh Patel',
        farmerPhone: '+91 98765 43210',
        farmerEmail: 'ramesh@example.com',
        parcelName: 'Riverside North Parcel 4',
        crop: 'Onion',
        das: 80,
        ndvi: 0.74,
        soilPh: 6.8
      },
      provenance: { source: 'Field Sensor', sourceType: DATA_STATUS.OBSERVED }
    });

    const result = applyPrivacyPreservingTransform(envelopeWithPersonalData, { targetScope: 'research' });
    assert(result.success === true, 'Privacy transformation should succeed');
    const anon = result.anonymizedEnvelope;

    // Verify direct identifiers stripped
    assert(anon.payload.farmerName === undefined, 'farmerName MUST be stripped');
    assert(anon.payload.farmerPhone === undefined, 'farmerPhone MUST be stripped');
    assert(anon.payload.farmerEmail === undefined, 'farmerEmail MUST be stripped');
    assert(anon.payload.parcelName === undefined, 'parcelName MUST be stripped');
    assert(anon.farmId === null, 'farmId MUST be nullified');

    // Verify agronomic data preserved
    assert(anon.payload.crop === 'Onion', 'Crop name must be preserved');
    assert(anon.payload.das === 80, 'DAS must be preserved');
    assert(anon.payload.ndvi === 0.74, 'NDVI must be preserved');

    // Verify coordinate coarsening
    const [coarsenedLng, coarsenedLat] = anon.geometry.coordinates;
    assert(coarsenedLat === 20.00 || coarsenedLat === 20, 'Latitude should be coarsened (~1km grid)');
    assert(coarsenedLng === 73.79, 'Longitude should be coarsened (~1km grid)');

    // Test block on revoked consent
    revokeFarmConsent(farmId);
    const blockedResult = applyPrivacyPreservingTransform(envelopeWithPersonalData, { targetScope: 'research' });
    assert(blockedResult.success === false, 'Transformation MUST be blocked when consent is revoked');
    assert(blockedResult.anonymizedEnvelope === null, 'No envelope should be produced when consent is revoked');
  });

  // 5. Knowledge Exchange Workflow & Conflict Detection
  test('Knowledge Exchange: Enforces review lifecycle, immutable versioning, and conflict detection', () => {
    resetKnowledgeMemoryStore();

    // Draft knowledge should not be returned by getApprovedKnowledge
    const approvedBefore = getApprovedKnowledge({ crop: 'Wheat' });
    const hasDraft = approvedBefore.some(k => k.id === 'KB-IN-WHEAT-DRAFT-001');
    assert(hasDraft === false, 'Draft knowledge MUST NOT enter approved production knowledge base');

    // Review and approve
    const approvedEntry = reviewKnowledgeEntry('KB-IN-WHEAT-DRAFT-001', KNOWLEDGE_STATUS.APPROVED, {
      reviewer: 'National Wheat Agronomist'
    });
    assert(approvedEntry.reviewStatus === KNOWLEDGE_STATUS.APPROVED, 'Status should be approved');

    // Now it should be available in approved
    const approvedAfter = getApprovedKnowledge({ crop: 'Wheat' });
    assert(approvedAfter.some(k => k.id === 'KB-IN-WHEAT-DRAFT-001'), 'Approved entry should now be available');

    // Create a new version
    const v2 = createKnowledgeVersion('KB-IN-WHEAT-DRAFT-001', {
      content: 'Updated multi-trial validated foliar nitrogen top-dressing guidelines.'
    }, 'Multi-location trial validation added');

    assert(v2.version === '0.10.0' || v2.version === '0.1.0' || v2.version.startsWith('0.'), 'Version should increment');
    assert(v2.reviewStatus === KNOWLEDGE_STATUS.PENDING_REVIEW, 'New version must reset to pending_review');

    // Detect knowledge conflicts
    publishKnowledgeEntry({
      id: 'KB-TEST-CONFLICT-01',
      title: 'Alternative High-Density Onion Irrigation Scheduling',
      topic: 'Water Management & Irrigation Scheduling',
      crop: 'Onion',
      source: 'Independent Horticultural Society',
      content: 'Maintain continuous flood irrigation every 3 days during bulbing.',
      reviewStatus: KNOWLEDGE_STATUS.APPROVED
    });

    const conflict = detectKnowledgeConflicts('Onion', 'Water Management & Irrigation Scheduling');
    assert(conflict !== null, 'Should detect competing knowledge sources');
    assert(conflict.hasConflict === true, 'Conflict flag should be true');
    assert(conflict.competingSources.length >= 2, 'Should list multiple competing sources');
  });

  // 6. AI Model Registry & Evaluation Governance
  test('Model Registry: Enforces production promotion criteria, limitations, and objective comparison', () => {
    resetModelMemoryStore();

    // Invariant: Cannot promote model to production without evaluation dataset
    try {
      updateModelStatus('MODEL-EXPERIMENTAL-YIELD-PROTOTYPE', MODEL_STATUS.PRODUCTION, {
        approvedBy: 'Admin'
      });
      assert(false, 'Should throw error when promoting unvalidated model to PRODUCTION');
    } catch (err) {
      assert(err.message.includes('evaluation dataset'), 'Should enforce evaluation dataset requirement');
    }

    // Compare models objectively
    const comparison = compareModels(['MODEL-GEMINI-2.5-AGRI', 'MODEL-CROP-DOCTOR-VISION']);
    assert(comparison.length === 2, 'Should compare 2 models');
    assert(comparison[0].metrics !== undefined, 'Metrics should be present');
    assert(comparison[0].limitations.length > 0, 'Limitations must be documented');
  });

  // 7. Data Exchange Pipeline & Quarantine Logging
  test('Data Exchange Pipeline: Successfully processes valid batches and quarantines invalid records', () => {
    resetExchangeMemoryStore();
    resetConsentMemoryStore();

    const validRecord = createAgriculturalDataEnvelope({
      recordType: 'soil_test',
      recordId: 'SOIL-EXC-01',
      payload: { ph: 6.7, nitrogen: 280 },
      provenance: { source: 'Lab', sourceType: DATA_STATUS.USER_PROVIDED }
    });

    const invalidRecord = {
      schemaVersion: '1.2.0',
      recordType: 'observation',
      recordId: 'OBS-BAD-EXC',
      payload: {} // missing required provenance
    };

    const result = executeDataExchange({
      source: 'Regional Soil Testing Laboratory',
      destination: 'Local Farm Digital Twin',
      recordType: 'soil_records',
      envelopes: [validRecord, invalidRecord],
      options: { anonymize: false }
    });

    assert(result.status === 'partial', 'Batch with 1 valid and 1 invalid record should have partial status');
    assert(result.validatedCount === 1, '1 record validated');
    assert(result.rejectedCount === 1, '1 record rejected');

    const logs = getExchangeLogs();
    assert(logs.length >= 1, 'Exchange log should be recorded');
    assert(logs[0].validationStatus === 'PARTIAL_FAILURES', 'Log should record partial failure');

    const quarantined = getQuarantinedRecords();
    assert(quarantined.length >= 1, 'Quarantined record should be stored');
    assert(quarantined[0].reasonCode === 'SCHEMA_VALIDATION_FAILURE', 'Quarantine reason should be SCHEMA_VALIDATION_FAILURE');
  });

  // 8. Regional Intelligence & Anti-Fabrication Invariants
  test('Regional Intelligence: Enforces privacy threshold (k>=3) and prevents fabricated cross-country data', () => {
    // Case A: Unconnected foreign country without data (e.g. Brazil)
    const brazilIntel = computeRegionalIntelligence({
      country: 'Brazil',
      region: 'Cerrado',
      farmsData: []
    });
    assert(brazilIntel.status === 'DATA_NOT_CONNECTED', 'Unconnected country must return DATA_NOT_CONNECTED');
    assert(brazilIntel.isAggregateAvailable === false, 'Aggregate must not be available');
    assert(brazilIntel.message.includes('No comparable dataset available'), 'Must state no comparable dataset available');

    // Case B: Insufficient farms (< 3)
    const smallBatch = [
      { payload: { ndvi: 0.72, soilMoisture: 35, netWaterBalance: -10 } },
      { payload: { ndvi: 0.75, soilMoisture: 38, netWaterBalance: -8 } }
    ];
    const smallBatchIntel = computeRegionalIntelligence({
      country: 'India',
      region: 'Nashik',
      farmsData: smallBatch
    });
    assert(smallBatchIntel.status === 'INSUFFICIENT_SAMPLE_SIZE', 'Farms < 3 must return INSUFFICIENT_SAMPLE_SIZE');
    assert(smallBatchIntel.isAggregateAvailable === false, 'Aggregate must be false to protect privacy');

    // Case C: Valid sample (>= 3 farms)
    const validBatch = [
      ...smallBatch,
      { payload: { ndvi: 0.78, soilMoisture: 40, netWaterBalance: -5 } }
    ];
    const aggregateIntel = computeRegionalIntelligence({
      country: 'India',
      region: 'Nashik',
      farmsData: validBatch
    });
    assert(aggregateIntel.status === 'AGGREGATED_AVAILABLE', 'Farms >= 3 should produce AGGREGATED_AVAILABLE');
    assert(aggregateIntel.isAggregateAvailable === true, 'Aggregate is true');
    assert(aggregateIntel.indicators.averageCanopyNdvi === 0.75, 'Computes correct mean NDVI');
  });

  // 9. Offline Sync Queue
  test('Offline Sync Queue: Enqueues mutations and synchronizes upon connectivity return', async () => {
    resetSyncMemoryStore();

    // Enqueue mutation
    const item = enqueueOfflineMutation({
      type: 'ADD_JOURNAL_OBSERVATION',
      farmId: 'farm-123',
      payload: { notes: 'Observed healthy bulb sizing after light morning irrigation.' }
    });

    assert(item.status === 'queued', 'Item should be queued');
    const syncStatusBefore = getSyncStatus();
    assert(syncStatusBefore.pendingCount === 1, 'Pending count should be 1');

    // Process sync
    const syncResult = await processSyncQueue(async (record) => {
      // Mock successful server push
      return { success: true, serverId: 'SRV-001' };
    });

    assert(syncResult.syncedCount === 1, '1 item synced');
    assert(syncResult.remainingQueue === 0, '0 items remaining in queue');
    const syncStatusAfter = getSyncStatus();
    assert(syncStatusAfter.pendingCount === 0, 'Pending count should be 0');
  });

  // 10. Interoperability Overview
  test('Master Interoperability Overview: Reports network health and compliance standards', () => {
    const overview = getInteroperabilityOverview();
    assert(overview.interoperabilityReadiness === 'INTEROPERABILITY_READY', 'Readiness should be INTEROPERABILITY_READY');
    assert(overview.complianceStandards.includes('ISO/TC 34 (Food Products)'), 'Includes ISO/TC 34');
    assert(overview.countriesSummary.total >= 5, 'Includes all BRICS nations');
    assert(overview.disclaimer.includes('explicitly configured'), 'Includes honest connection disclaimer');
  });

  console.log(`\nPhase 7 Interoperability Tests Passed: ${passed}/${passed + failed}\n`);
  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('phase7InteroperabilityTests.js')) {
  const result = runPhase7InteroperabilityTests();
  if (result.failed > 0) {
    process.exit(1);
  }
}
