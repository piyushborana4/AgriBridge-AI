/**
 * AgriBridge AI — Expert Agronomist Review & Human-in-the-Loop Service (Phase 8)
 * Manages peer review workflows for AI diagnoses, advisory outputs, and high-risk recommendations.
 * Preserves farmer privacy and tracks agronomist corrections as empirical evaluation evidence.
 */

import { EXPERT_ASSESSMENTS, REVIEW_STATUS } from './evaluationContracts.js';

// Universal in-memory fallback for review store
let reviewQueue = [
  {
    id: 'rev-case-001',
    targetType: 'crop_diagnosis',
    targetId: 'diag-onion-purple-blotch-01',
    farmRegion: 'Nashik, Maharashtra (Western Agromet Zone)',
    crop: 'Onion (Allium cepa)',
    initialAiOutput: {
      diagnosis: 'Purple Blotch (Alternaria porri)',
      confidence: 0.88,
      immediateAction: 'Remove affected lower leaves and avoid overhead sprinkler irrigation.'
    },
    reviewerId: 'agronomist-reviewer-04',
    reviewerRole: 'Senior Plant Pathologist (ICAR-DOGR)',
    assessment: EXPERT_ASSESSMENTS.APPROPRIATE,
    status: REVIEW_STATUS.REVIEWED,
    comments: 'Diagnosis matches foliar lesion morphology. Cultural recommendation is sound.',
    correctedRecommendation: null,
    createdAt: '2026-09-24T10:30:00.000Z',
    reviewedAt: '2026-09-25T14:15:00.000Z',
    provenance: {
      institution: 'ICAR-DOGR Extension Division',
      verificationMethod: 'Microscopic morphology check'
    }
  },
  {
    id: 'rev-case-002',
    targetType: 'farm_advisory',
    targetId: 'adv-cotton-water-stress-02',
    farmRegion: 'Aurangabad, Maharashtra (Central Marathwada)',
    crop: 'Cotton (Gossypium hirsutum)',
    initialAiOutput: {
      title: 'Supplemental Irrigation Scheduling',
      recommendation: 'Apply light irrigation to mitigate 4-day soil moisture deficit.',
      evidenceIds: ['weather-precip-forecast-01', 'soil-moisture-def-01']
    },
    reviewerId: 'agronomist-reviewer-09',
    reviewerRole: 'Irrigation & Soil Scientist',
    assessment: EXPERT_ASSESSMENTS.APPROPRIATE,
    status: REVIEW_STATUS.REVIEWED,
    comments: 'Consistent with crop water requirement at flowering stage.',
    correctedRecommendation: null,
    createdAt: '2026-09-26T08:00:00.000Z',
    reviewedAt: '2026-09-26T11:45:00.000Z',
    provenance: {
      institution: 'State Agricultural Extension Cell'
    }
  }
];

/**
 * Lists all expert review queue items
 * @param {object} [filters]
 * @returns {Array<object>} Filtered review items
 */
export function listReviewQueue(filters = {}) {
  return reviewQueue.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.crop && item.crop !== filters.crop) return false;
    if (filters.targetType && item.targetType !== filters.targetType) return false;
    return true;
  });
}

/**
 * Gets a specific review item by ID
 * @param {string} reviewId
 * @returns {object|null}
 */
export function getReviewItem(reviewId) {
  return reviewQueue.find(r => r.id === reviewId) || null;
}

/**
 * Submits a new AI case into the human-in-the-loop expert review queue
 * @param {object} params
 * @returns {object} Created Review item
 */
export function enqueueCaseForReview({
  targetType,
  targetId,
  farmRegion = 'Anonymized Agro-Climatic Zone',
  crop,
  initialAiOutput,
  issueReason = 'Routine Quality Audit'
}) {
  const newCase = {
    id: `rev-case-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    targetType,
    targetId,
    farmRegion,
    crop: crop || 'General Crop',
    initialAiOutput,
    issueReason,
    reviewerId: null,
    reviewerRole: null,
    assessment: null,
    status: REVIEW_STATUS.PENDING,
    comments: null,
    correctedRecommendation: null,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    provenance: {
      origin: 'AgriBridge Automated Quality Assurance'
    }
  };

  reviewQueue.unshift(newCase);
  return newCase;
}

/**
 * Submits an expert agronomist's review assessment
 * @param {object} params
 * @returns {object} Updated review item
 */
export function submitExpertReview({
  reviewId,
  reviewerId = 'agronomist-peer-reviewer',
  reviewerRole = 'Agronomy Expert',
  assessment,
  comments = '',
  correctedRecommendation = null
}) {
  const item = reviewQueue.find(r => r.id === reviewId);
  if (!item) throw new Error(`Review case ${reviewId} not found`);

  if (!Object.values(EXPERT_ASSESSMENTS).includes(assessment)) {
    throw new Error(`Invalid expert assessment: ${assessment}`);
  }

  item.reviewerId = reviewerId;
  item.reviewerRole = reviewerRole;
  item.assessment = assessment;
  item.comments = comments;
  item.correctedRecommendation = correctedRecommendation;
  item.status = REVIEW_STATUS.REVIEWED;
  item.reviewedAt = new Date().toISOString();

  return item;
}

/**
 * Computes aggregate expert review statistics
 * @returns {object} Review statistics
 */
export function getExpertReviewSummary() {
  const total = reviewQueue.length;
  const reviewed = reviewQueue.filter(r => r.status === REVIEW_STATUS.REVIEWED);
  const appropriate = reviewed.filter(r => r.assessment === EXPERT_ASSESSMENTS.APPROPRIATE).length;
  const partiallyAppropriate = reviewed.filter(r => r.assessment === EXPERT_ASSESSMENTS.PARTIALLY_APPROPRIATE).length;
  const inappropriate = reviewed.filter(r => r.assessment === EXPERT_ASSESSMENTS.INAPPROPRIATE).length;

  return {
    totalQueueCount: total,
    reviewedCount: reviewed.length,
    pendingCount: reviewQueue.filter(r => r.status === REVIEW_STATUS.PENDING).length,
    appropriateRatio: reviewed.length > 0 ? Number((appropriate / reviewed.length).toFixed(3)) : null,
    partiallyAppropriateRatio: reviewed.length > 0 ? Number((partiallyAppropriate / reviewed.length).toFixed(3)) : null,
    inappropriateRatio: reviewed.length > 0 ? Number((inappropriate / reviewed.length).toFixed(3)) : null
  };
}
