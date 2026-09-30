import { apiRequest } from './geminiClient';
import { buildFarmContext } from './advisoryService';

/**
 * Generates tailored regenerative transition scores and practice recommendations
 */
export async function getRegenerativePlanInsights(farm) {
  const farmContext = buildFarmContext(farm);
  if (!farmContext) {
    return { success: false, error: 'No farm context' };
  }

  const response = await apiRequest('/ai/regenerative-plan', { farmContext }, 15000);

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data
    };
  }

  // Local fallback
  return {
    success: true,
    data: {
      score: 74,
      strengths: [
        `Active ${farm.irrigationType || 'micro-irrigation'} minimizes runoff erosion`,
        `Baseline organic matter (${farm.organicMatter || 2.8}%) provides active biological foundation`
      ],
      improvementAreas: [
        'High reliance on single synthetic nitrogen top-dressings',
        'Fallow periods between seasonal crop cycles without cover crop protection'
      ],
      recommendedPractices: [
        {
          practice: 'Multi-Species Leguminous Cover Cropping',
          reason: `Increases biological nitrogen fixation for ${farm.crops?.[0] || 'crops'} and builds root biomass.`,
          expectedBenefit: '+0.8% organic matter over 18 months',
          timeHorizon: 'Month 2–4'
        },
        {
          practice: 'Minimum-Till Seeding & Surface Mulching',
          reason: `Protects moisture retention in ${farm.soilType || 'soil'} and prevents surface crusting.`,
          expectedBenefit: '25% reduction in evaporative water loss',
          timeHorizon: 'Month 4–8'
        },
        {
          practice: 'On-Farm Vermicompost & Microbial Inoculants',
          reason: 'Restores mycorrhizal fungal networks in root rhizosphere.',
          expectedBenefit: '15% increase in phosphorus bioavailability',
          timeHorizon: 'Month 6–12'
        }
      ],
      aiMode: 'prototype',
      notice: 'Prototype AI mode — connect Gemini API for live analysis.'
    }
  };
}
