/**
 * Central Gemini Response Schemas Index - AgriBridge AI (Phase 4.5)
 */

export * from './cropDoctorSchema.js';
export * from './advisorySchema.js';
export * from './farmIntelligenceSchema.js';

export const regenerativePlanSchema = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    strengths: { type: 'array', items: { type: 'string' } },
    improvementAreas: { type: 'array', items: { type: 'string' } },
    recommendedPractices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          practice: { type: 'string' },
          reason: { type: 'string' },
          expectedBenefit: { type: 'string' },
          timeHorizon: { type: 'string' }
        },
        required: ['practice', 'reason', 'expectedBenefit']
      }
    },
    soilCarbonProjection: {
      type: 'object',
      properties: {
        baselineTonnesPerHa: { type: 'number' },
        targetTonnesPerHa: { type: 'number' },
        annualSequestrationRate: { type: 'string' }
      }
    }
  },
  required: ['score', 'strengths', 'improvementAreas', 'recommendedPractices']
};

export const assistantSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    response: { type: 'string' },
    key_points: { type: 'array', items: { type: 'string' } },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    recommended_actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['title', 'reason']
      }
    },
    proposed_action: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string' },
        urgency: { type: 'string' },
        category: { type: 'string' }
      }
    },
    suggestedQuestions: { type: 'array', items: { type: 'string' } },
    referencedEvidenceIds: { type: 'array', items: { type: 'string' } },
    data_caveats: { type: 'string' },
    uncertainty: { type: 'string' }
  }
};

export function validateAssistantResponse(data, validEvidenceIds = []) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  const text = data.answer || data.response;
  if (!text || typeof text !== 'string') {
    errors.push('Missing answer or response text');
  }

  // Strip non-existent evidence IDs
  if (validEvidenceIds.length > 0) {
    const validSet = new Set(validEvidenceIds);
    if (Array.isArray(data.evidence_ids)) {
      data.evidence_ids = data.evidence_ids.filter(id => validSet.has(id));
    }
    if (Array.isArray(data.referencedEvidenceIds)) {
      data.referencedEvidenceIds = data.referencedEvidenceIds.filter(id => validSet.has(id));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: data
  };
}

export const scenarioSchema = {
  type: 'object',
  properties: {
    scenarioName: { type: 'string' },
    projectedRiskScore: { type: 'number' },
    primaryVulnerabilities: { type: 'array', items: { type: 'string' } },
    proactiveMitigations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          urgency: { type: 'string' },
          rationale: { type: 'string' }
        },
        required: ['action', 'urgency', 'rationale']
      }
    }
  },
  required: ['scenarioName', 'projectedRiskScore', 'proactiveMitigations']
};
