/**
 * Crop Doctor Case Repository - AgriBridge AI (Phase 5)
 * Transforms Crop Doctor into a full clinical case management workflow:
 * - Case creation with initial AI diagnosis & confidence
 * - Follow-up scheduling and multi-temporal image tracking
 * - Condition trajectory analysis (improving / monitoring / worsening / uncertain)
 * - Strict safety: never claims improvement unless verified by subsequent observation
 */

const STORAGE_KEY = 'agribridge_crop_doctor_cases_v1';

function getInitialCases() {
  return [
    {
      caseId: 'CASE-2026-089',
      farmId: 'farm-1',
      crop: 'Onion',
      plantPart: 'leaf',
      diagnosis: 'Early Purple Blotch (Alternaria porri)',
      diagnosisCategory: 'disease',
      confidence: 86,
      severity: 'moderate',
      createdAt: '2026-09-25T10:30:00.000Z',
      recommendedActions: [
        'Prune and safely destroy lower infected leaves with lesions',
        'Improve inter-row ventilation to reduce microclimate humidity',
        'Avoid overhead sprinkler irrigation in late afternoon'
      ],
      status: 'monitoring',
      followUpDate: '2026-09-29',
      initialImage: null,
      followUps: [
        {
          id: 'FLW-001',
          date: '2026-09-29T14:20:00.000Z',
          image: null,
          note: 'Checked after removing affected leaves and improving furrow drainage.',
          followUpDiagnosis: 'Lesion spread halted. New shoot growth is healthy.',
          conditionStatus: 'improving',
          confidence: 82
        }
      ]
    },
    {
      caseId: 'CASE-2026-084',
      farmId: 'farm-1',
      crop: 'Onion',
      plantPart: 'leaf',
      diagnosis: 'Thrips Feeding Punctures & Silvery Flecking',
      diagnosisCategory: 'pest',
      confidence: 91,
      severity: 'low',
      createdAt: '2026-09-20T08:00:00.000Z',
      recommendedActions: [
        'Install yellow and blue sticky traps at canopy level',
        'Spray 1% Neem oil emulsion (10,000 ppm) in late evening'
      ],
      status: 'resolved',
      followUpDate: '2026-09-24',
      initialImage: null,
      followUps: [
        {
          id: 'FLW-002',
          date: '2026-09-24T11:00:00.000Z',
          image: null,
          note: 'Sticky traps deployed. Pest density dropped below economic threshold.',
          followUpDiagnosis: 'No active thrips colonies detected on young central leaves.',
          conditionStatus: 'resolved',
          confidence: 94
        }
      ]
    }
  ];
}

let memoryCases = null;

export function loadCases() {
  if (typeof localStorage === 'undefined') {
    if (!memoryCases) {
      memoryCases = getInitialCases();
    }
    return memoryCases;
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
  const initial = getInitialCases();
  saveCases(initial);
  return initial;
}

export function saveCases(cases) {
  if (typeof localStorage === 'undefined') {
    memoryCases = cases;
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    // Silently fallback
  }
}

export function getCases(farmId = null, filters = {}) {
  let cases = loadCases();

  if (farmId && farmId !== 'all') {
    cases = cases.filter(c => c.farmId === farmId);
  }

  if (filters.status && filters.status !== 'all') {
    cases = cases.filter(c => c.status === filters.status);
  }

  if (filters.crop && filters.crop !== 'all') {
    cases = cases.filter(c => c.crop?.toLowerCase() === filters.crop.toLowerCase());
  }

  return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCaseById(caseId) {
  const cases = loadCases();
  return cases.find(c => c.caseId === caseId) || null;
}

export function createCase(caseData) {
  const cases = loadCases();
  const followUpDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const newCase = {
    caseId: caseData.caseId || `CASE-${Date.now().toString().slice(-6)}`,
    farmId: caseData.farmId || 'farm-1',
    crop: caseData.crop || 'Onion',
    plantPart: caseData.plantPart || caseData.plant_part || 'leaf',
    diagnosis: caseData.diagnosis || 'Unspecified Agronomic Anomaly',
    diagnosisCategory: caseData.diagnosisCategory || caseData.diagnosis_category || 'disease',
    confidence: caseData.confidence || 75,
    severity: caseData.severity || 'moderate',
    createdAt: new Date().toISOString(),
    recommendedActions: Array.isArray(caseData.recommended_actions) ? caseData.recommended_actions : (caseData.recommendedActions || []),
    status: caseData.confidence < 70 ? 'expert_review' : 'open',
    followUpDate: caseData.followUpDate || followUpDate,
    initialImage: caseData.image || caseData.initialImage || null,
    uncertaintyReason: caseData.uncertainty_reason || '',
    followUps: []
  };

  cases.unshift(newCase);
  saveCases(cases);
  return newCase;
}

/**
 * Add a follow-up inspection to a case
 */
export function addCaseFollowUp(caseId, followUpData = {}) {
  const cases = loadCases();
  const index = cases.findIndex(c => c.caseId === caseId);
  if (index === -1) return null;

  const conditionStatus = followUpData.conditionStatus || 'monitoring';

  const followUp = {
    id: `FLW-${Date.now()}`,
    date: new Date().toISOString(),
    image: followUpData.image || null,
    note: followUpData.note || '',
    followUpDiagnosis: followUpData.diagnosis || 'Follow-up inspection recorded.',
    conditionStatus,
    confidence: followUpData.confidence || 80
  };

  const updatedStatus = conditionStatus === 'resolved' ? 'resolved' : conditionStatus === 'improving' ? 'monitoring' : cases[index].status;

  cases[index] = {
    ...cases[index],
    status: updatedStatus,
    followUps: [...(cases[index].followUps || []), followUp]
  };

  saveCases(cases);
  return cases[index];
}

export function updateCaseStatus(caseId, status) {
  const cases = loadCases();
  const index = cases.findIndex(c => c.caseId === caseId);
  if (index === -1) return null;

  cases[index] = {
    ...cases[index],
    status
  };

  saveCases(cases);
  return cases[index];
}
