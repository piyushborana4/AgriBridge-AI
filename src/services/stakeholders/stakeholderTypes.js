/**
 * AgriBridge AI — Multi-Stakeholder & Digital Public Good Type Contracts (Phase 10)
 * Standardized data structures for Stakeholder Roles, Field Visits, Support Requests,
 * Multi-Tenancy Organizations, Research Trials, and Federated DPG Knowledge Packs.
 */

export const STAKEHOLDER_ROLES = {
  FARMER: 'FARMER',
  EXPERT: 'EXPERT',
  FIELD_OFFICER: 'FIELD_OFFICER',
  RESEARCHER: 'RESEARCHER',
  AGRICULTURAL_ORGANIZATION: 'AGRICULTURAL_ORGANIZATION',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM'
};

export const VISIT_STATUS = {
  PLANNED: 'PLANNED',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const REQUEST_STATUS = {
  SUBMITTED: 'SUBMITTED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED'
};

export const TRUST_LEVELS = {
  AUTHORITATIVE: 'AUTHORITATIVE',       // ICAR, Embrapa, CAAS, ARC official publications
  EXPERT_REVIEWED: 'EXPERT_REVIEWED',   // Peer-reviewed by accredited agronomists
  RESEARCH_SOURCE: 'RESEARCH_SOURCE',   // Academic publications and institutional datasets
  USER_REPORTED: 'USER_REPORTED',       // Farmer field observation
  AI_GENERATED: 'AI_GENERATED',         // Synthesis from Gemini / ML models
  UNVERIFIED: 'UNVERIFIED'              // Unchecked community submissions
};

export const DATA_SOVEREIGNTY_POLICIES = {
  PRIVATE: 'PRIVATE',                   // Local device / owner only
  INSTITUTIONAL: 'INSTITUTIONAL',       // Cooperative / FPO internal use
  REGIONAL: 'REGIONAL',                 // District agricultural office
  SHARED: 'SHARED',                     // Anonymized cross-organization pool ($k \ge 3$)
  PUBLIC: 'PUBLIC'                      // Open Digital Public Good
};

export const ORGANIZATION_TYPES = {
  FARMER_GROUP: 'FARMER_GROUP',
  COOPERATIVE: 'COOPERATIVE',
  RESEARCH_INSTITUTION: 'RESEARCH_INSTITUTION',
  AGRICULTURAL_DEPARTMENT: 'AGRICULTURAL_DEPARTMENT',
  NGO: 'NGO',
  PRIVATE_AGRI_ORGANIZATION: 'PRIVATE_AGRI_ORGANIZATION'
};

/**
 * Creates a Field Visit Record
 */
export function createFieldVisit({
  visitId = `visit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  officerId,
  officerName = 'Agricultural Extension Officer',
  scheduledDate,
  actualDate = null,
  status = VISIT_STATUS.PLANNED,
  purpose = 'Routine Agronomic Inspection',
  observations = [],
  photos = [],
  recommendations = [],
  followUpDate = null,
  notes = ''
}) {
  if (!farmId) throw new Error('FieldVisit: farmId is required');
  if (!officerId) throw new Error('FieldVisit: officerId is required');

  return {
    visitId,
    farmId,
    officerId,
    officerName,
    scheduledDate: scheduledDate || new Date().toISOString(),
    actualDate,
    status,
    purpose,
    observations: Array.isArray(observations) ? observations : [],
    photos: Array.isArray(photos) ? photos : [],
    recommendations: Array.isArray(recommendations) ? recommendations : [],
    followUpDate,
    notes,
    createdAt: new Date().toISOString()
  };
}

/**
 * Creates a Farmer Support Request
 */
export function createSupportRequest({
  requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  farmId,
  farmerName = 'Registered Farmer',
  category = 'EXPERT_REVIEW', // 'EXPERT_REVIEW' | 'FIELD_VISIT' | 'CROP_PROBLEM' | 'IRRIGATION_ISSUE'
  subject,
  description,
  crop = 'General Crop',
  urgency = 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status = REQUEST_STATUS.SUBMITTED,
  assignedTo = null,
  resolutionNotes = null,
  attachments = []
}) {
  if (!farmId) throw new Error('SupportRequest: farmId is required');
  if (!subject) throw new Error('SupportRequest: subject is required');

  return {
    requestId,
    farmId,
    farmerName,
    category,
    subject,
    description: description || subject,
    crop,
    urgency,
    status,
    assignedTo,
    resolutionNotes,
    attachments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Creates an Organization / Multi-Tenancy Record
 */
export function createOrganization({
  orgId,
  name,
  orgType = ORGANIZATION_TYPES.COOPERATIVE,
  country = 'India',
  region = 'Maharashtra',
  adminUserId,
  memberUserIds = [],
  assignedFarmIds = [],
  sovereigntyPolicy = DATA_SOVEREIGNTY_POLICIES.INSTITUTIONAL
}) {
  if (!orgId) throw new Error('Organization: orgId is required');
  if (!name) throw new Error('Organization: name is required');

  return {
    orgId,
    name,
    orgType,
    country,
    region,
    adminUserId: adminUserId || 'org-admin-default',
    memberUserIds: Array.isArray(memberUserIds) ? memberUserIds : [],
    assignedFarmIds: Array.isArray(assignedFarmIds) ? assignedFarmIds : [],
    sovereigntyPolicy,
    createdAt: new Date().toISOString()
  };
}

/**
 * Creates a Federated Digital Public Good Knowledge Pack
 */
export function createKnowledgePack({
  packId,
  title,
  crop,
  region,
  agroClimaticZone,
  practiceType,
  description,
  recommendation,
  trustLevel = TRUST_LEVELS.AUTHORITATIVE,
  source,
  publisher,
  version = '1.0.0',
  language = 'en',
  validFrom = '2026-01-01',
  validUntil = '2028-12-31',
  evidenceType = 'Peer-reviewed agronomic extension manual',
  license = 'Creative Commons Attribution 4.0 (CC BY 4.0)'
}) {
  if (!packId) throw new Error('KnowledgePack: packId is required');
  if (!title) throw new Error('KnowledgePack: title is required');
  if (!crop) throw new Error('KnowledgePack: crop is required');
  if (!source) throw new Error('KnowledgePack: source is required');

  return {
    packId,
    title,
    crop,
    region: region || 'Universal',
    agroClimaticZone: agroClimaticZone || 'Sub-Tropical',
    practiceType: practiceType || 'Regenerative Agronomy',
    description,
    recommendation,
    trustLevel,
    source,
    publisher: publisher || source,
    version,
    language,
    validFrom,
    validUntil,
    evidenceType,
    license,
    dpgCompliant: true,
    createdAt: new Date().toISOString()
  };
}
