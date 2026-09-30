/**
 * Farm Intelligence Gemini Structured Response Schema - AgriBridge AI (Phase 4.5)
 * Strictly enforces that Gemini cites deterministic evidence IDs and follows schemas.
 */

export const farmIntelligenceSchema = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    situationSummary: { type: 'string' },
    agronomicReasoning: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          urgency: { 
            type: 'string',
            enum: ['immediate', 'today', 'this_week', 'monitor']
          },
          category: { 
            type: 'string',
            enum: ['irrigation', 'crop_protection', 'soil_management', 'operational']
          },
          title: { type: 'string' },
          action: { type: 'string' },
          rationale: { type: 'string' },
          evidenceIds: { 
            type: 'array',
            items: { type: 'string' }
          },
          impact: { type: 'string' }
        },
        required: ['id', 'urgency', 'category', 'title', 'action', 'rationale', 'evidenceIds']
      }
    },
    supporting_evidence_ids: {
      type: 'array',
      items: { type: 'string' }
    },
    confidenceAssessment: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        rating: { 
          type: 'string',
          enum: ['high', 'moderate', 'low', 'insufficient']
        },
        notes: { type: 'string' }
      },
      required: ['score', 'rating']
    },
    uncertainty: { type: 'string' }
  },
  required: [
    'headline',
    'situationSummary',
    'agronomicReasoning',
    'recommendations',
    'confidenceAssessment'
  ]
};

export function validateFarmIntelligenceResponse(data, validEvidenceIds = []) {
  const errors = [];
  const validIdSet = new Set(validEvidenceIds);

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  if (!data.headline) errors.push('Missing headline');
  if (!data.situationSummary) errors.push('Missing situationSummary');
  if (!data.agronomicReasoning) errors.push('Missing agronomicReasoning');

  if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
    errors.push('Recommendations must be a non-empty array');
  } else {
    data.recommendations.forEach((rec, idx) => {
      if (!rec.id || !rec.title || !rec.action || !rec.rationale) {
        errors.push(`Recommendation #${idx + 1} missing required fields`);
      }
      if (!['immediate', 'today', 'this_week', 'monitor'].includes(rec.urgency)) {
        errors.push(`Recommendation #${idx + 1} has invalid urgency: ${rec.urgency}`);
      }
      if (!['irrigation', 'crop_protection', 'soil_management', 'operational'].includes(rec.category)) {
        errors.push(`Recommendation #${idx + 1} has invalid category: ${rec.category}`);
      }

      // Check cited evidence IDs if ground truth is supplied
      if (validIdSet.size > 0 && Array.isArray(rec.evidenceIds)) {
        const unknownIds = rec.evidenceIds.filter(id => !validIdSet.has(id));
        if (unknownIds.length > 0) {
          errors.push(`Recommendation #${idx + 1} cites non-existent evidence IDs: ${unknownIds.join(', ')}`);
          // Strip hallucinated IDs
          rec.evidenceIds = rec.evidenceIds.filter(id => validIdSet.has(id));
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: data
  };
}
