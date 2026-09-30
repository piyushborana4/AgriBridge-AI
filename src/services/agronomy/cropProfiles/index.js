/**
 * AgriBridge AI — Crop Profile Registry
 * Central lookup for all validated crop agronomic profiles with alias matching and universal generic fallback.
 */

import { onionProfile } from './onionProfile.js';
import { riceProfile } from './riceProfile.js';
import { wheatProfile } from './wheatProfile.js';
import { maizeProfile } from './maizeProfile.js';
import { tomatoProfile } from './tomatoProfile.js';
import { potatoProfile } from './potatoProfile.js';
import { soybeanProfile } from './soybeanProfile.js';

export const CROP_PROFILES = {
  onion: onionProfile,
  rice: riceProfile,
  wheat: wheatProfile,
  maize: maizeProfile,
  tomato: tomatoProfile,
  potato: potatoProfile,
  soybean: soybeanProfile
};

// Aliases mapping common agricultural terms to registered profiles
const CROP_ALIASES = {
  // Onion aliases
  onion: 'onion',
  onions: 'onion',
  pyaz: 'onion',
  kanda: 'onion',
  allium: 'onion',
  allium_cepa: 'onion',

  // Rice aliases
  rice: 'rice',
  paddy: 'rice',
  dhan: 'rice',
  oryza: 'rice',
  oryza_sativa: 'rice',

  // Wheat aliases
  wheat: 'wheat',
  gehun: 'wheat',
  triticum: 'wheat',
  triticum_aestivum: 'wheat',

  // Maize aliases
  maize: 'maize',
  corn: 'maize',
  makka: 'maize',
  zea_mays: 'maize',

  // Tomato aliases
  tomato: 'tomato',
  tomatoes: 'tomato',
  tamatar: 'tomato',
  solanum_lycopersicum: 'tomato',

  // Potato aliases
  potato: 'potato',
  potatoes: 'potato',
  aloo: 'potato',
  alu: 'potato',
  solanum_tuberosum: 'potato',

  // Soybean aliases
  soybean: 'soybean',
  soybeans: 'soybean',
  soya: 'soybean',
  glycine_max: 'soybean'
};

/**
 * Universal generic baseline profile for unrecognized crops
 */
export const genericCropProfile = {
  cropId: 'generic_crop',
  commonName: 'General Crop',
  botanicalName: 'Plantae sp.',
  category: 'General Field Crop',
  regions: ['Global Agronomic Baseline'],
  referenceSources: ['FAO-56 Universal Guidelines'],

  baseTemperatureC: 10.0,
  optimalTempMinC: 18.0,
  optimalTempMaxC: 28.0,
  heatStressThresholdC: 35.0,
  coldStressThresholdC: 5.0,
  frostDamageThresholdC: 0.0,
  nocturnalHeatThresholdC: 24.0,

  growthStages: [
    {
      id: 'vegetative_early',
      name: 'Emergence & Early Vegetative',
      typicalDasRange: [0, 30],
      cropCoefficientKc: 0.5,
      rootDepthCm: 25,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Seedling damping off', 'Moisture deficit'],
      managementFocus: 'Ensure seedling establishment and root growth.'
    },
    {
      id: 'vegetative_peak',
      name: 'Peak Vegetative & Canopy Growth',
      typicalDasRange: [31, 60],
      cropCoefficientKc: 0.85,
      rootDepthCm: 50,
      waterSensitivity: 'high',
      heatSensitivity: 'medium',
      keyRisks: ['Foliar leaf spots', 'Nutrient deficiency'],
      managementFocus: 'Maintain balanced moisture and adequate fertility.'
    },
    {
      id: 'reproductive_flowering',
      name: 'Flowering & Reproductive Phase',
      typicalDasRange: [61, 90],
      cropCoefficientKc: 1.15,
      rootDepthCm: 70,
      waterSensitivity: 'critical',
      heatSensitivity: 'critical',
      keyRisks: ['Heat desiccation', 'Water deficit causing flower drop'],
      managementFocus: 'Protect against extreme temperature and soil moisture stress.'
    },
    {
      id: 'ripening_maturation',
      name: 'Maturation & Harvest Readiness',
      typicalDasRange: [91, 120],
      cropCoefficientKc: 0.65,
      rootDepthCm: 70,
      waterSensitivity: 'low',
      heatSensitivity: 'medium',
      keyRisks: ['Excess rainfall causing rotting or sprouting'],
      managementFocus: 'Prepare for harvest as foliage senesces.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [6.0, 7.5],
    texturePreference: ['Loam', 'Sandy Loam', 'Clay Loam'],
    salinityThresholdDsM: 2.0,
    waterloggingTolerance: 'low',
    drainageRequirement: 'well_drained'
  },

  diseaseConduciveness: [
    {
      id: 'generic_fungal_foliar',
      name: 'Foliar Blight / Leaf Spot',
      pathogen: 'Foliar fungal complex',
      favorableTempMinC: 20,
      favorableTempMaxC: 30,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 8,
      vulnerableStages: ['vegetative_peak', 'reproductive_flowering'],
      scoutingAdvice: 'Check canopy understories for fungal spotting after prolonged damp periods.'
    }
  ],

  pestPressure: [
    {
      id: 'sucking_insects',
      name: 'Sucking Pests (Aphids / Thrips / Whitefly)',
      scientificName: 'Hemiptera complex',
      favorableTempMinC: 22,
      favorableTempMaxC: 32,
      favorableHumidityMinPct: 50,
      scoutingAdvice: 'Inspect young shoots and undersides of leaves.'
    }
  ]
};

/**
 * Look up agronomic profile by crop name, ID, or alias.
 * @param {string} cropQuery - Name or ID of the crop
 * @returns {object} The matched crop profile or generic fallback with matched status
 */
export function getCropProfile(cropQuery) {
  if (!cropQuery || typeof cropQuery !== 'string') {
    return { ...genericCropProfile, isGenericFallback: true };
  }

  const normalized = cropQuery.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const matchedKey = CROP_ALIASES[normalized] || CROP_ALIASES[cropQuery.trim().toLowerCase()];

  if (matchedKey && CROP_PROFILES[matchedKey]) {
    return { ...CROP_PROFILES[matchedKey], isGenericFallback: false };
  }

  // Substring search
  for (const [alias, key] of Object.entries(CROP_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return { ...CROP_PROFILES[key], isGenericFallback: false };
    }
  }

  return { ...genericCropProfile, isGenericFallback: true, queryProvided: cropQuery };
}

/**
 * List all available registered crop profiles
 */
export function listRegisteredCrops() {
  return Object.values(CROP_PROFILES).map(p => ({
    cropId: p.cropId,
    commonName: p.commonName,
    botanicalName: p.botanicalName,
    category: p.category,
    stagesCount: p.growthStages.length,
    referenceSources: p.referenceSources
  }));
}
