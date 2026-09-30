/**
 * AgriBridge AI — AI Assistant Spatial Tools & Safety Guard (Phase 11)
 * Provides deterministic spatial query tools to Gemini / AI Assistant and enforces
 * spatial safety invariants (no disease hallucination from imagery alone, honest resolution).
 */

import { getFarmGeometry } from './geometryService.js';
import { listFields, getField, calculateFieldIntelligence } from './fieldIntelligenceService.js';
import { listSatelliteObservations, compareSatelliteDates } from './satelliteTimelineService.js';
import { getFarmTopography, evaluateDrainageRisk } from './topographyDrainageService.js';
import { getActions } from '../operations/actionRepository.js';

export const AI_SPATIAL_TOOLS = {
  getFarmGeometry: {
    description: 'Retrieves verified boundary geometry or GPS point and location quality for a farm',
    execute: ({ farmId }) => getFarmGeometry(farmId)
  },

  getFields: {
    description: 'Lists all managed fields, crop varieties, areas, and planting dates for a farm',
    execute: ({ farmId }) => listFields(farmId)
  },

  getFieldIntelligence: {
    description: 'Computes field-level crop stage, vegetative index, moisture, and risk drivers',
    execute: ({ farmId, fieldId, farmContext = {} }) => {
      const field = getField(farmId, fieldId);
      if (!field) return { error: `Field ${fieldId} not found on farm ${farmId}` };
      return calculateFieldIntelligence(field, farmContext);
    }
  },

  getFieldRisk: {
    description: 'Returns deterministic risk score and contributing factors for a specific field',
    execute: ({ farmId, fieldId, farmContext = {} }) => {
      const field = getField(farmId, fieldId);
      if (!field) return { error: `Field ${fieldId} not found` };
      const intel = calculateFieldIntelligence(field, farmContext);
      return {
        fieldId,
        name: field.name,
        risk: intel.risk,
        cropStage: intel.cropStage
      };
    }
  },

  getFieldSatelliteTrend: {
    description: 'Retrieves multi-date satellite NDVI/NDWI observations and cloud coverage history',
    execute: ({ farmId, fieldId, timeWindow = '90D' }) => {
      return listSatelliteObservations(farmId, { fieldId, timeWindow, validOnly: true });
    }
  },

  getFieldActions: {
    description: 'Lists active and completed agronomic actions linked to a field',
    execute: ({ farmId }) => getActions(farmId)
  }
};

/**
 * AI Spatial Safety Guard
 * Verifies that AI responses about spatial crop stress do NOT declare definitive pathogen diagnoses
 * without physical ground tissue tests or Crop Doctor follow-ups.
 * @param {string} assistantText - Model generated text
 * @returns {{ isSafe: boolean, flaggedReason?: string, sanitizedResponse?: string }}
 */
export function validateSpatialAISafety(assistantText = '') {
  if (!assistantText) return { isSafe: true, text: '' };

  const unsafePatterns = [
    /this map proves (the presence of|that).*?(fungus|blight|rot|virus|wilt)/i,
    /satellite ndvi confirms (the crop has|an outbreak of).*?(disease|pest)/i,
    /the red area is definitely infested with/i
  ];

  for (const pattern of unsafePatterns) {
    if (pattern.test(assistantText)) {
      return {
        isSafe: false,
        flaggedReason: 'AI asserted definitive disease diagnosis exclusively from remote sensing imagery.',
        sanitizedResponse: 'Available satellite data indicates localized vegetation decline and canopy stress in this area. However, remote sensing alone cannot establish a specific pathological diagnosis without physical ground tissue inspection.'
      };
    }
  }

  return {
    isSafe: true,
    sanitizedResponse: assistantText
  };
}
