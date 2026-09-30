/**
 * AGRIBRIDGE AI — PHASE 10 AUTOMATED TEST SUITE
 * Multi-Stakeholder Intelligence, Field Officer Operations, Cooperative Multi-Tenancy,
 * Academic Research Data Governance, and Federated BRICS Digital Public Good (DPG).
 */

import {
  STAKEHOLDER_ROLES,
  VISIT_STATUS,
  REQUEST_STATUS,
  TRUST_LEVELS,
  DATA_SOVEREIGNTY_POLICIES,
  ORGANIZATION_TYPES,
  createFieldVisit,
  createSupportRequest,
  createOrganization,
  createKnowledgePack,
  calculatePriorityFarmQueue,
  scheduleFieldVisit,
  updateFieldVisitStatus,
  listFieldVisits,
  submitSupportRequest,
  updateSupportRequest,
  listSupportRequests,
  listOrganizations,
  getOrganization,
  registerOrganization,
  checkTenantAccess,
  executeCrossOrgSharing,
  listOrgSharingAudit,
  listResearchTrials,
  registerResearchTrial,
  exportToJSON,
  exportToCSV,
  exportToGeoJSON,
  listKnowledgePacks,
  registerKnowledgePack,
  validateTranslationSafety,
  detectKnowledgeDiscrepancies
} from '../../stakeholders/stakeholderGateway.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

export async function runPhase10StakeholderTests() {
  console.log('================================================================');
  console.log('  AGRIBRIDGE AI — PHASE 10 MULTI-STAKEHOLDER & DPG TEST SUITE   ');
  console.log('================================================================\n');

  // Test 1: Field Officer Deterministic Priority Farm Queue
  try {
    const mockFarms = [
      {
        id: 'farm-stress-01',
        name: 'Nashik High-Stress Plot',
        location: 'Nashik, Maharashtra',
        crop: 'Onion',
        weather: { temperature: 39 }, // +35 (Extreme heat)
        soil: { moisture: 20 },      // +30 (Critical deficit)
        satellite: { ndvi: 0.40 },   // +25 (Canopy vigor decline)
        pendingActionsCount: 2       // +10
      },
      {
        id: 'farm-normal-02',
        name: 'Pune Healthy Vineyard',
        location: 'Pune, Maharashtra',
        crop: 'Grapes',
        weather: { temperature: 28 },
        soil: { moisture: 65 },
        satellite: { ndvi: 0.78 },
        pendingActionsCount: 0
      }
    ];

    const queue = calculatePriorityFarmQueue(mockFarms);
    assert(
      queue.length === 2 && queue[0].farmId === 'farm-stress-01' && queue[0].priorityScore >= 90 && queue[0].priorityLevel === 'HIGH',
      'Field Officer: Deterministic priority queue ranks high-stress farm first with explainable drivers'
    );
  } catch (err) {
    assert(false, `Field Officer Priority Queue failed: ${err.message}`);
  }

  // Test 2: Field Visit Lifecycle
  try {
    const newVisit = scheduleFieldVisit({
      farmId: 'farm-1',
      officerId: 'officer-test-01',
      officerName: 'Dr. Sunita Kulkarni',
      purpose: 'Foliar disease ground verification',
      scheduledDate: '2026-10-05T09:00:00.000Z'
    });

    assert(newVisit.status === VISIT_STATUS.PLANNED, 'Field Visit: Successfully scheduled with PLANNED status');

    const started = updateFieldVisitStatus(newVisit.visitId, VISIT_STATUS.STARTED);
    assert(started.status === VISIT_STATUS.STARTED && started.actualDate !== null, 'Field Visit: Transitions to STARTED and records actual timestamp');

    const completed = updateFieldVisitStatus(newVisit.visitId, VISIT_STATUS.COMPLETED, {
      observations: ['Ground soil compaction observed in Zone 3', 'Mild thrips feeding detected on outer leaves'],
      recommendations: ['Apply organic neem oil spray 3ml/L', 'Schedule light drip cycle to reduce thermal stress'],
      notes: 'Advised farmer on drip calibration.'
    });

    assert(
      completed.status === VISIT_STATUS.COMPLETED && completed.observations.length === 2 && completed.recommendations.length === 2,
      'Field Visit: Transitions to COMPLETED and stores field observations and recommendations'
    );
  } catch (err) {
    assert(false, `Field Visit Lifecycle failed: ${err.message}`);
  }

  // Test 3: Farmer Support Request Workflow
  try {
    const request = submitSupportRequest({
      farmId: 'farm-1',
      farmerName: 'Kishore Bhalerao',
      category: 'CROP_PROBLEM',
      subject: 'Yellowing tips in sugarcane ratoon crop',
      description: 'Lower foliage exhibiting chlorosis after heavy irrigation.',
      crop: 'Sugarcane',
      urgency: 'HIGH'
    });

    assert(request.requestId && request.status === REQUEST_STATUS.SUBMITTED, 'Support Request: Created in SUBMITTED state');

    const updated = updateSupportRequest(request.requestId, {
      status: REQUEST_STATUS.RESOLVED,
      assignedTo: 'officer-nashik-01',
      resolutionNotes: 'Identified temporary iron chlorosis due to waterlogging; advised foliar ferrous sulphate spray.'
    });

    assert(
      updated.status === REQUEST_STATUS.RESOLVED && updated.resolutionNotes.includes('iron chlorosis'),
      'Support Request: Resolved with agronomist resolution notes'
    );
  } catch (err) {
    assert(false, `Support Request workflow failed: ${err.message}`);
  }

  // Test 4: Cooperative Multi-Tenancy & Tenant Isolation Boundary
  try {
    const privateOrg = registerOrganization({
      orgId: 'org-private-coop-99',
      name: 'Sahyadri Private Organic Producer Guild',
      orgType: ORGANIZATION_TYPES.FARMER_GROUP,
      adminUserId: 'admin-sahyadri',
      memberUserIds: ['farmer-s-01', 'farmer-s-02'],
      assignedFarmIds: ['farm-s-1'],
      sovereigntyPolicy: DATA_SOVEREIGNTY_POLICIES.PRIVATE
    });

    const isMemberAllowed = checkTenantAccess({ id: 'farmer-s-01', role: 'FARMER' }, 'org-private-coop-99');
    const isOutsiderBlocked = checkTenantAccess({ id: 'farmer-stranger-999', role: 'FARMER' }, 'org-private-coop-99');
    const isAdminAllowed = checkTenantAccess({ id: 'super-admin-01', role: 'ADMIN' }, 'org-private-coop-99');

    assert(
      isMemberAllowed === true && isOutsiderBlocked === false && isAdminAllowed === true,
      'Tenant Isolation: Enforces strict data boundary between member, outsider, and administrator'
    );
  } catch (err) {
    assert(false, `Tenant Isolation failed: ${err.message}`);
  }

  // Test 5: Cross-Organization Sharing & Sovereignty Enforcement
  try {
    let privateBlocked = false;
    try {
      executeCrossOrgSharing({
        sourceOrgId: 'org-private-coop-99',
        targetOrgId: 'org-icar-research-02',
        actorUserId: 'admin-sahyadri'
      });
    } catch (e) {
      privateBlocked = e.message.includes('PRIVATE');
    }

    assert(privateBlocked, 'Data Sovereignty: Rejects cross-organization sharing when source org policy is PRIVATE');

    const validShare = executeCrossOrgSharing({
      sourceOrgId: 'org-nashik-fpo-01',
      targetOrgId: 'org-icar-research-02',
      actorUserId: 'admin-fpo-01',
      purpose: 'Anonymized soil health baseline aggregation'
    });

    const auditLogs = listOrgSharingAudit();
    assert(
      validShare.status === 'AUTHORIZED' && auditLogs.some(a => a.shareId === validShare.shareId),
      'Data Sharing: Authorizes allowed institutional sharing and records immutable audit log'
    );
  } catch (err) {
    assert(false, `Cross-Organization Sharing failed: ${err.message}`);
  }

  // Test 6: Academic Research & Agronomic Trials
  try {
    const trial = registerResearchTrial({
      title: 'Microbial Inoculant Efficacy in Vertisols under Drought Stress',
      crop: 'Soybean (Glycine max)',
      institution: 'State Agricultural University & BRICS Soil Lab',
      treatment: 'Rhizobium + PSB Liquid Biofertilizer Seed Treatment',
      control: 'Uninoculated Control Plot',
      participatingFarmsCount: 8,
      status: 'ACTIVE'
    });

    assert(
      trial.trialId && trial.treatment.includes('Biofertilizer') && trial.participatingFarmsCount === 8,
      'Research Trials: Registers scientific trial with rigorous Treatment vs Control protocols'
    );
  } catch (err) {
    assert(false, `Research Trials failed: ${err.message}`);
  }

  // Test 7: Multi-Format Research Data Export (JSON, CSV, GeoJSON) with Strict Privacy
  try {
    const mockResearchData = [
      {
        crop: 'Onion',
        region: 'Nashik District',
        coordinates: { lat: 20.012345, lng: 73.789012 },
        satellite: { ndvi: 0.68 },
        weather: { temperature: 31.4 },
        soil: { moisture: 42 },
        isLive: true,
        source: 'Sentinel-2 Remote Sensing'
      }
    ];

    const jsonExportStr = exportToJSON(mockResearchData);
    const jsonParsed = JSON.parse(jsonExportStr);
    assert(
      jsonParsed.data[0].coordinates.lat === 20.01 && jsonParsed.data[0].provenance.status === 'REAL',
      'Research Export: JSON output coarsens coordinates to 2 decimal places and preserves REAL provenance'
    );

    const csvExport = exportToCSV(mockResearchData);
    assert(
      csvExport.includes('RecordId,Crop,Region,Latitude,Longitude') && csvExport.includes('20.01,73.79'),
      'Research Export: CSV output exports standard tabular structure with coarsened coordinates'
    );

    const geoJson = exportToGeoJSON(mockResearchData);
    assert(
      geoJson.type === 'FeatureCollection' && geoJson.features[0].geometry.type === 'Point' && geoJson.features[0].geometry.coordinates[0] === 73.79,
      'Research Export: GeoJSON output conforms to RFC 7946 standard with [lng, lat] coordinate order'
    );
  } catch (err) {
    assert(false, `Research Export formats failed: ${err.message}`);
  }

  // Test 8: Federated Digital Public Good Knowledge Packs
  try {
    const customPack = registerKnowledgePack({
      packId: 'dpg-pack-icar-biochar-04',
      title: 'Agricultural Biochar Application in Degraded Vertisols',
      crop: 'Cotton & Pulses',
      region: 'Semi-Arid Tropics',
      agroClimaticZone: 'Zone 7',
      practiceType: 'Soil Carbon Enhancement',
      description: 'Application of cotton stalk biochar at 5 t/ha to increase soil cation exchange capacity and moisture retention.',
      recommendation: 'Incorporate ground cotton stalk biochar into top 15cm soil layer during pre-monsoon field preparation.',
      trustLevel: TRUST_LEVELS.AUTHORITATIVE,
      source: 'Central Institute for Cotton Research (CICR) Bulletin 2026',
      license: 'Creative Commons Attribution 4.0 (CC BY 4.0)'
    });

    const packs = listKnowledgePacks({ crop: 'Cotton & Pulses' });
    assert(
      packs.length === 1 && packs[0].dpgCompliant === true && packs[0].trustLevel === TRUST_LEVELS.AUTHORITATIVE,
      'Digital Public Good: Registers verifiable DPG Knowledge Pack with Open License & Authoritative Trust Level'
    );
  } catch (err) {
    assert(false, `DPG Knowledge Packs failed: ${err.message}`);
  }

  // Test 9: Multilingual Translation Safety Wrapper
  try {
    const originalEnglish = 'Apply 250 kg/ha neem cake at 15cm bed height with 48-hour irrigation intervals.';
    const safeTranslation = '250 किग्रा/हेक्टेयर नीम की खली 15 सेमी ऊंची क्यारियों में 48 घंटे के सिंचाई अंतराल पर डालें।';
    const corruptedTranslation = 'नीम की खली 500 किग्रा/हेक्टेयर डालें।'; // Distorted numbers

    const safeResult = validateTranslationSafety({
      text: originalEnglish,
      fromLang: 'en',
      toLang: 'hi',
      translatedText: safeTranslation
    });

    const unsafeResult = validateTranslationSafety({
      text: originalEnglish,
      fromLang: 'en',
      toLang: 'hi',
      translatedText: corruptedTranslation
    });

    assert(
      safeResult.isSafe === true && unsafeResult.isSafe === false,
      'Translation Safety: Verifies numerical quantity preservation and catches distorted dosage invariants'
    );
  } catch (err) {
    assert(false, `Translation Safety failed: ${err.message}`);
  }

  // Test 10: Multi-Source Agronomic Discrepancy Detection
  try {
    const packs = listKnowledgePacks();
    const discrepancyCheck = detectKnowledgeDiscrepancies(packs);

    assert(
      discrepancyCheck.hasConflict === true && discrepancyCheck.publishers.length >= 2 && discrepancyCheck.dossier.length >= 3,
      'Discrepancy Detection: Identifies divergent regional agronomic practices and provides transparent multi-source dossier'
    );
  } catch (err) {
    assert(false, `Discrepancy Detection failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`  PHASE 10 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`Phase 10 Test Suite Failed with ${failed} failure(s)`);
  }

  return { passed, failed, total: passed + failed };
}

// Self-run when executed directly via Node
if (process.argv[1] && process.argv[1].endsWith('phase10StakeholderTests.js')) {
  runPhase10StakeholderTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
