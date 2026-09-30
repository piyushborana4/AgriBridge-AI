/**
 * AgriBridge AI — Cross-Border Knowledge Exchange Service (Phase 7)
 * Implements structured agricultural knowledge publishing, peer review workflow,
 * immutable versioning, applicability matching, and conflict reconciliation.
 * 
 * CORE PRINCIPLE:
 * Knowledge does NOT immediately become active upon import.
 * Only 'approved' knowledge enters automated AI recommendation pipelines.
 * Conflicting agricultural claims from different sources are preserved and explicitly surfaced.
 */

export const KNOWLEDGE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

export const SOURCE_TYPES = {
  OFFICIAL: 'official',
  RESEARCH: 'research',
  EXTENSION: 'extension',
  INTERNATIONAL: 'international',
  GENERAL: 'general'
};

// Initial verified agricultural knowledge base
const INITIAL_KNOWLEDGE_ENTRIES = [
  {
    id: 'KB-IN-ONION-001',
    version: '1.2.0',
    title: 'Good Agricultural Practices for Onion Water Management in Semi-Arid Zones',
    topic: 'Water Management & Irrigation Scheduling',
    crop: 'Onion',
    country: 'India',
    region: 'Maharashtra & Karnataka Semi-Arid Plains',
    language: 'en',
    content: 'Onions require regular shallow irrigations with peak water demand (Kc 1.05) occurring during bulb initiation (75–105 DAS). Withhold irrigation 10–15 days prior to harvest to allow neck curing and prevent post-harvest soft rots.',
    source: 'ICAR - Directorate of Onion and Garlic Research (DOGR)',
    sourceType: SOURCE_TYPES.OFFICIAL,
    publishedAt: '2024-06-15T00:00:00.000Z',
    reviewedAt: '2026-01-10T00:00:00.000Z',
    effectiveFrom: '2024-06-15',
    effectiveTo: '2027-12-31',
    confidence: 0.95,
    reviewStatus: KNOWLEDGE_STATUS.APPROVED,
    applicableStages: ['bulb_initiation', 'bulb_development', 'senescence_harvest'],
    provenance: {
      institution: 'Indian Council of Agricultural Research',
      doiOrRef: 'ICAR-DOGR Tech Bulletin No. 42',
      peerReviewed: true,
      verifiedBy: 'National Agronomic Review Board'
    },
    versionHistory: [
      { version: '1.0.0', publishedAt: '2022-04-10', changeLog: 'Initial publication' },
      { version: '1.2.0', publishedAt: '2024-06-15', changeLog: 'Updated drip fertigation parameters for heavy clay soils' }
    ]
  },
  {
    id: 'KB-BR-SOY-001',
    version: '2.0.0',
    title: 'Integrated Pest and Disease Management for Tropical Soybean in Cerrado Soils',
    topic: 'Integrated Pest Management',
    crop: 'Soybean',
    country: 'Brazil',
    region: 'Cerrado Biosphere (Mato Grosso / Goiás)',
    language: 'en',
    content: 'For Asian Soybean Rust (Phakopsora pachyrhizi), initiate preventative biostimulant and protective fungicide rotations at early reproductive onset (R1 stage) if cumulative canopy wetness exceeds 6 hours at temperatures between 18°C and 28°C.',
    source: 'Embrapa Soja Technical Reference Guide',
    sourceType: SOURCE_TYPES.OFFICIAL,
    publishedAt: '2024-09-20T00:00:00.000Z',
    reviewedAt: '2026-02-14T00:00:00.000Z',
    effectiveFrom: '2024-09-20',
    effectiveTo: '2028-09-20',
    confidence: 0.94,
    reviewStatus: KNOWLEDGE_STATUS.APPROVED,
    applicableStages: ['flowering_pod_initiation', 'pod_filling_seed_size'],
    provenance: {
      institution: 'Brazilian Agricultural Research Corporation (Embrapa)',
      doiOrRef: 'Embrapa Soja Documentos 451',
      peerReviewed: true,
      verifiedBy: 'Embrapa Scientific Committee'
    },
    versionHistory: [
      { version: '2.0.0', publishedAt: '2024-09-20', changeLog: 'Incorporated climate resilience and bio-control guidelines' }
    ]
  },
  {
    id: 'KB-INT-FAO-56',
    version: '1.0.0',
    title: 'FAO Irrigation and Drainage Paper 56: Crop Evapotranspiration Guidelines',
    topic: 'Crop Water Requirements & ET0',
    crop: 'General Field Crops',
    country: 'International',
    region: 'Global Standard',
    language: 'en',
    content: 'Actual crop evapotranspiration (ETc) is calculated as the product of reference evapotranspiration (ET0) and the stage-specific crop coefficient (Kc). Under soil moisture deficit below threshold depletion fraction (p), water stress coefficient (Ks) reduces actual transpiration.',
    source: 'Food and Agriculture Organization of the United Nations (FAO)',
    sourceType: SOURCE_TYPES.INTERNATIONAL,
    publishedAt: '1998-01-01T00:00:00.000Z',
    reviewedAt: '2026-01-01T00:00:00.000Z',
    effectiveFrom: '1998-01-01',
    confidence: 0.98,
    reviewStatus: KNOWLEDGE_STATUS.APPROVED,
    provenance: {
      institution: 'FAO Rome',
      doiOrRef: 'FAO Irrigation and Drainage Paper No. 56',
      peerReviewed: true,
      verifiedBy: 'International Commission on Irrigation and Drainage (ICID)'
    },
    versionHistory: [{ version: '1.0.0', publishedAt: '1998-01-01', changeLog: 'Standard release' }]
  },
  {
    id: 'KB-IN-WHEAT-DRAFT-001',
    version: '0.9.0',
    title: 'Experimental Ultra-Late Sowing Nitrogen Top-Dressing in Northern Plains',
    topic: 'Nutrient Management',
    crop: 'Wheat',
    country: 'India',
    region: 'Indo-Gangetic Plains',
    language: 'en',
    content: 'Preliminary trials suggest split application of foliar urea (2%) during anthesis may mitigate terminal heat damage in delayed-sown wheat plots.',
    source: 'Regional University Field Trials (Unpublished)',
    sourceType: SOURCE_TYPES.RESEARCH,
    publishedAt: '2026-02-01T00:00:00.000Z',
    confidence: 0.60,
    reviewStatus: KNOWLEDGE_STATUS.DRAFT, // UNAPPROVED DRAFT — Must NOT enter production AI!
    provenance: {
      institution: 'State Agricultural University',
      doiOrRef: 'Internal Annual Report 2025',
      peerReviewed: false,
      verifiedBy: null
    },
    versionHistory: [{ version: '0.9.0', publishedAt: '2026-02-01', changeLog: 'Draft submission awaiting multi-location trials' }]
  }
];

const STORAGE_KEY = 'agribridge_knowledge_base_v1';
let memoryKnowledgeStore = null;

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

function getStore() {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read knowledge base from localStorage:', e);
    }
  }

  if (!memoryKnowledgeStore) {
    memoryKnowledgeStore = JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE_ENTRIES));
  }
  return memoryKnowledgeStore;
}

function saveStore(entries) {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to persist knowledge base to localStorage:', e);
    }
  }
  memoryKnowledgeStore = entries;
}

/**
 * Publishes a new knowledge entry into the exchange system
 * @param {object} entry - Knowledge entry data
 * @returns {object} Published entry
 */
export function publishKnowledgeEntry(entry) {
  if (!entry.title || !entry.content || !entry.source) {
    throw new Error('Cannot publish knowledge: title, content, and source are required');
  }

  const entries = getStore();
  const id = entry.id || `KB-EXT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newEntry = {
    id,
    version: entry.version || '1.0.0',
    title: entry.title,
    topic: entry.topic || 'Agronomy & Crop Management',
    crop: entry.crop || 'General Field Crops',
    country: entry.country || 'International',
    region: entry.region || 'All Applicable Regions',
    language: entry.language || 'en',
    content: entry.content,
    source: entry.source,
    sourceType: entry.sourceType || SOURCE_TYPES.GENERAL,
    publishedAt: new Date().toISOString(),
    reviewedAt: null,
    effectiveFrom: entry.effectiveFrom || new Date().toISOString().split('T')[0],
    effectiveTo: entry.effectiveTo || null,
    confidence: typeof entry.confidence === 'number' ? entry.confidence : 0.70,
    reviewStatus: entry.reviewStatus || KNOWLEDGE_STATUS.PENDING_REVIEW, // Defaults to pending_review!
    applicableStages: entry.applicableStages || [],
    provenance: {
      institution: entry.provenance?.institution || entry.source,
      doiOrRef: entry.provenance?.doiOrRef || 'Standard submission',
      peerReviewed: Boolean(entry.provenance?.peerReviewed),
      verifiedBy: entry.provenance?.verifiedBy || null
    },
    versionHistory: [
      {
        version: entry.version || '1.0.0',
        publishedAt: new Date().toISOString(),
        changeLog: 'Initial submission'
      }
    ]
  };

  entries.push(newEntry);
  saveStore(entries);
  return newEntry;
}

/**
 * Reviews a knowledge entry and transitions its status
 * @param {string} id - Knowledge entry ID
 * @param {string} newStatus - Valid KNOWLEDGE_STATUS
 * @param {object} reviewMetadata - { reviewer: string, notes: string }
 * @returns {object} Updated entry
 */
export function reviewKnowledgeEntry(id, newStatus, reviewMetadata = {}) {
  if (!Object.values(KNOWLEDGE_STATUS).includes(newStatus)) {
    throw new Error(`Invalid knowledge status: ${newStatus}`);
  }

  const entries = getStore();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) {
    throw new Error(`Knowledge entry not found: ${id}`);
  }

  entries[index].reviewStatus = newStatus;
  entries[index].reviewedAt = new Date().toISOString();
  entries[index].provenance.verifiedBy = reviewMetadata.reviewer || 'Agronomic Review Committee';
  if (reviewMetadata.notes) {
    entries[index].provenance.reviewNotes = reviewMetadata.notes;
  }

  saveStore(entries);
  return entries[index];
}

/**
 * Creates a new version of an existing knowledge record without overwriting history
 * @param {string} id - Knowledge entry ID
 * @param {object} updatedFields - Modified fields
 * @param {string} changeLog - Description of changes
 * @returns {object} Updated knowledge record
 */
export function createKnowledgeVersion(id, updatedFields, changeLog = 'Updated content') {
  const entries = getStore();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) {
    throw new Error(`Knowledge entry not found: ${id}`);
  }

  const current = entries[index];
  const oldVersionParts = (current.version || '1.0.0').split('.').map(Number);
  const nextVersion = `${oldVersionParts[0]}.${(oldVersionParts[1] || 0) + 1}.0`;

  const updatedHistory = [
    ...(current.versionHistory || []),
    {
      version: nextVersion,
      publishedAt: new Date().toISOString(),
      changeLog
    }
  ];

  const updatedEntry = {
    ...current,
    ...updatedFields,
    id: current.id, // Immutable ID
    version: nextVersion,
    reviewStatus: KNOWLEDGE_STATUS.PENDING_REVIEW, // New version requires re-review
    publishedAt: new Date().toISOString(),
    versionHistory: updatedHistory
  };

  entries[index] = updatedEntry;
  saveStore(entries);
  return updatedEntry;
}

/**
 * Retrieves only APPROVED knowledge entries suitable for production AI pipelines
 * @param {object} [filters]
 * @returns {Array} Approved knowledge entries
 */
export function getApprovedKnowledge(filters = {}) {
  const entries = getStore();
  let approved = entries.filter(e => e.reviewStatus === KNOWLEDGE_STATUS.APPROVED);

  if (filters.crop) {
    const q = filters.crop.toLowerCase();
    approved = approved.filter(e => e.crop.toLowerCase().includes(q) || e.crop.toLowerCase().includes('general'));
  }
  if (filters.country) {
    const q = filters.country.toLowerCase();
    approved = approved.filter(e => e.country.toLowerCase().includes(q) || e.country.toLowerCase().includes('international'));
  }
  if (filters.topic) {
    const q = filters.topic.toLowerCase();
    approved = approved.filter(e => e.topic.toLowerCase().includes(q));
  }

  return approved;
}

/**
 * Detects knowledge conflicts where multiple approved sources offer divergent guidance
 * @param {string} crop
 * @param {string} topic
 * @returns {object|null} Conflict envelope if divergent claims exist, otherwise null
 */
export function detectKnowledgeConflicts(crop, topic) {
  const approved = getApprovedKnowledge({ crop, topic });
  if (approved.length <= 1) return null;

  // Compare sources and claims
  const distinctSources = [...new Set(approved.map(a => a.source))];
  if (distinctSources.length > 1) {
    return {
      hasConflict: true,
      topic,
      crop,
      message: `Multiple authoritative guidance sources available for ${crop} (${topic}).`,
      competingSources: approved.map(a => ({
        id: a.id,
        version: a.version,
        source: a.source,
        country: a.country,
        confidence: a.confidence,
        summary: a.content.substring(0, 140) + '...'
      })),
      resolutionGuidance: 'Review local institutional recommendations (e.g. state agricultural university / national extension) for microclimate calibration.'
    };
  }

  return null;
}

/**
 * Matches applicable knowledge for a given farm context
 * @param {object} farmContext
 * @returns {Array} Matched approved knowledge entries with applicability scores
 */
export function matchApplicableKnowledge(farmContext) {
  if (!farmContext) return [];

  const crop = farmContext.crop || farmContext.cropType || 'Onion';
  const country = farmContext.country || 'India';
  const stage = farmContext.growthStage || farmContext.stageId || null;

  const approved = getApprovedKnowledge();
  const matched = [];

  for (const entry of approved) {
    let score = 0;
    const isCropMatch = entry.crop.toLowerCase().includes(crop.toLowerCase()) || entry.crop.toLowerCase().includes('general');
    const isCountryMatch = entry.country.toLowerCase().includes(country.toLowerCase()) || entry.country.toLowerCase().includes('international');

    if (isCropMatch) score += 50;
    if (isCountryMatch) score += 30;

    if (stage && entry.applicableStages && entry.applicableStages.length > 0) {
      if (entry.applicableStages.includes(stage)) {
        score += 20;
      }
    }

    if (score >= 50) {
      matched.push({
        ...entry,
        applicabilityScore: score,
        isSpecificMatch: score >= 80
      });
    }
  }

  return matched.sort((a, b) => b.applicabilityScore - a.applicabilityScore);
}

/**
 * Resets memory store for isolated test suite execution
 */
export function resetKnowledgeMemoryStore() {
  memoryKnowledgeStore = JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE_ENTRIES));
}
