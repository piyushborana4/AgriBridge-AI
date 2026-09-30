/**
 * AI Advisory Gemini Structured Response Schema - AgriBridge AI (Phase 4.5)
 */

export const advisorySchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    priority: { 
      type: 'string',
      enum: ['low', 'medium', 'high']
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reason: { type: 'string' },
          urgency: { 
            type: 'string',
            enum: ['today', 'this_week', 'monitor']
          }
        },
        required: ['title', 'reason', 'urgency']
      }
    },
    risks: { 
      type: 'array',
      items: { type: 'string' }
    },
    supporting_factors: { 
      type: 'array',
      items: { type: 'string' }
    },
    uncertainty: { type: 'string' }
  },
  required: ['summary', 'priority', 'actions']
};

export function validateAdvisoryResponse(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  if (!data.summary || typeof data.summary !== 'string') {
    errors.push('Missing summary');
  }
  if (!['low', 'medium', 'high'].includes(data.priority)) {
    errors.push(`Invalid priority: ${data.priority}`);
  }
  if (!Array.isArray(data.actions) || data.actions.length === 0) {
    errors.push('Actions must be a non-empty array');
  } else {
    data.actions.forEach((act, idx) => {
      if (!act.title || !act.reason) {
        errors.push(`Action #${idx + 1} missing title or reason`);
      }
      if (!['today', 'this_week', 'monitor'].includes(act.urgency)) {
        errors.push(`Action #${idx + 1} has invalid urgency: ${act.urgency}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: data
  };
}
