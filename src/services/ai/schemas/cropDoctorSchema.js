/**
 * Crop Doctor Gemini Structured Response Schema - AgriBridge AI (Phase 4.5)
 */

export const cropDoctorSchema = {
  type: 'object',
  properties: {
    crop: { type: 'string' },
    plant_part: { 
      type: 'string',
      enum: ['leaf', 'stem', 'fruit', 'root', 'whole_plant', 'flower', 'not_applicable']
    },
    diagnosis: { type: 'string' },
    diagnosis_category: { 
      type: 'string',
      enum: ['disease', 'pest', 'nutrient_deficiency', 'abiotic_stress', 'healthy', 'uncertain']
    },
    confidence: { type: 'number' },
    severity: { 
      type: 'string',
      enum: ['low', 'moderate', 'high', 'uncertain']
    },
    symptoms: { 
      type: 'array',
      items: { type: 'string' }
    },
    possible_causes: { 
      type: 'array',
      items: { type: 'string' }
    },
    recommended_actions: { 
      type: 'array',
      items: { type: 'string' }
    },
    prevention: { 
      type: 'array',
      items: { type: 'string' }
    },
    needs_expert_review: { type: 'boolean' },
    uncertainty_reason: { type: 'string' }
  },
  required: [
    'crop',
    'diagnosis',
    'diagnosis_category',
    'confidence',
    'severity',
    'symptoms',
    'recommended_actions',
    'needs_expert_review'
  ]
};

export function validateCropDoctorResponse(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  if (!data.crop) errors.push('Missing crop');
  if (!data.diagnosis) errors.push('Missing diagnosis');
  if (!['disease', 'pest', 'nutrient_deficiency', 'abiotic_stress', 'healthy', 'uncertain'].includes(data.diagnosis_category)) {
    errors.push(`Invalid diagnosis_category: ${data.diagnosis_category}`);
  }
  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
    errors.push(`Invalid confidence: ${data.confidence}`);
  }
  if (!['low', 'moderate', 'high', 'uncertain'].includes(data.severity)) {
    errors.push(`Invalid severity: ${data.severity}`);
  }
  if (!Array.isArray(data.symptoms)) errors.push('Symptoms must be an array');
  if (!Array.isArray(data.recommended_actions)) errors.push('Recommended actions must be an array');

  // Conservative rule: if confidence < 70, must flag uncertain or needs_expert_review
  if (typeof data.confidence === 'number' && data.confidence < 70) {
    if (!data.needs_expert_review) {
      data.needs_expert_review = true;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: data
  };
}
