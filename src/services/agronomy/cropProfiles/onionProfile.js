/**
 * AgriBridge AI — Onion Agronomic Profile (Allium cepa)
 * Source References: FAO Irrigation and Drainage Paper 56, ICAR-DOGR (Directorate of Onion and Garlic Research), TNAU Agritech.
 */

export const onionProfile = {
  cropId: 'onion',
  commonName: 'Onion',
  botanicalName: 'Allium cepa',
  category: 'Vegetable / Bulb',
  regions: ['Tropical', 'Subtropical', 'Temperate Semi-Arid'],
  referenceSources: ['FAO-56', 'ICAR-DOGR', 'TNAU Agritech Portal'],
  
  // Base Temperature & GDD
  baseTemperatureC: 6.0,
  optimalTempMinC: 15.0,
  optimalTempMaxC: 28.0,
  heatStressThresholdC: 34.0,
  coldStressThresholdC: 4.0,
  frostDamageThresholdC: 0.0,
  nocturnalHeatThresholdC: 22.0,

  // Growth Stages (Typical Duration in Days from Sowing / Transplanting)
  growthStages: [
    {
      id: 'nursery_seedling',
      name: 'Nursery & Emergence',
      typicalDasRange: [0, 45],
      cropCoefficientKc: 0.5,
      rootDepthCm: 15,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Damping off', 'Soil crusting', 'Desiccation'],
      managementFocus: 'Maintain gentle moisture; protect from direct scorching sun.'
    },
    {
      id: 'vegetative',
      name: 'Vegetative Growth (Foliage Development)',
      typicalDasRange: [46, 75],
      cropCoefficientKc: 0.75,
      rootDepthCm: 25,
      waterSensitivity: 'high',
      heatSensitivity: 'medium',
      keyRisks: ['Thrips tabaci', 'Purple blotch initial infection', 'Nitrogen deficiency'],
      managementFocus: 'Balanced nitrogen and micronutrients; regular light irrigations.'
    },
    {
      id: 'bulb_initiation',
      name: 'Bulb Initiation & Early Sizing',
      typicalDasRange: [76, 105],
      cropCoefficientKc: 1.05,
      rootDepthCm: 30,
      waterSensitivity: 'critical',
      heatSensitivity: 'high',
      keyRisks: ['Purple blotch (Alternaria porri)', 'Stemphylium blight', 'Water stress causing split bulbs'],
      managementFocus: 'Peak water demand; stop heavy nitrogen; ensure potassium and sulfur availability.'
    },
    {
      id: 'bulb_development',
      name: 'Bulb Enlargement & Maturation',
      typicalDasRange: [106, 130],
      cropCoefficientKc: 0.95,
      rootDepthCm: 30,
      waterSensitivity: 'high',
      heatSensitivity: 'high',
      keyRisks: ['Neck rot', 'Sunscald', 'Bacterial soft rot under excess moisture'],
      managementFocus: 'Consistent soil moisture without inundation; avoid wetting bulb necks.'
    },
    {
      id: 'senescence_harvest',
      name: 'Neck Fall & Harvest Readiness',
      typicalDasRange: [131, 150],
      cropCoefficientKc: 0.60,
      rootDepthCm: 30,
      waterSensitivity: 'low',
      heatSensitivity: 'medium',
      keyRisks: ['Post-harvest rots if irrigated late', 'Sprouting in storage'],
      managementFocus: 'Withhold irrigation 10-15 days prior to harvest to allow neck curing.'
    }
  ],

  // Soil & Water Requirements
  soilSuitability: {
    optimalPhRange: [6.0, 7.5],
    texturePreference: ['Sandy Loam', 'Loam', 'Silt Loam', 'Clay Loam with good drainage'],
    salinityThresholdDsM: 1.2, // Sensitive to salinity
    waterloggingTolerance: 'very_low', // Extremely vulnerable to shallow standing water
    drainageRequirement: 'well_drained'
  },

  // Disease Conducive Environmental Parameters
  diseaseConduciveness: [
    {
      id: 'purple_blotch',
      name: 'Purple Blotch',
      pathogen: 'Alternaria porri',
      favorableTempMinC: 20,
      favorableTempMaxC: 30,
      favorableHumidityMinPct: 80,
      favorableLeafWetnessHours: 8,
      vulnerableStages: ['bulb_initiation', 'bulb_development'],
      scoutingAdvice: 'Inspect older foliage for small water-soaked lesions with purplish centers.'
    },
    {
      id: 'downy_mildew',
      name: 'Downy Mildew',
      pathogen: 'Peronospora destructor',
      favorableTempMinC: 10,
      favorableTempMaxC: 22,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 10,
      vulnerableStages: ['vegetative', 'bulb_initiation'],
      scoutingAdvice: 'Check for violet-grey downy growth on leaves during cool, damp mornings.'
    },
    {
      id: 'stemphylium_blight',
      name: 'Stemphylium Leaf Blight',
      pathogen: 'Stemphylium vesicarium',
      favorableTempMinC: 18,
      favorableTempMaxC: 28,
      favorableHumidityMinPct: 80,
      favorableLeafWetnessHours: 6,
      vulnerableStages: ['bulb_initiation', 'bulb_development'],
      scoutingAdvice: 'Look for elongated pale yellow to white spots turning brown.'
    },
    {
      id: 'bacterial_soft_rot',
      name: 'Bacterial Soft Rot / Neck Rot',
      pathogen: 'Pectobacterium carotovorum',
      favorableTempMinC: 25,
      favorableTempMaxC: 35,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 12,
      vulnerableStages: ['bulb_development', 'senescence_harvest'],
      scoutingAdvice: 'Watch for soft, foul-smelling bulb collars after heavy unseasonal rainfall.'
    }
  ],

  // Pest Environmental Conditions
  pestPressure: [
    {
      id: 'onion_thrips',
      name: 'Onion Thrips',
      scientificName: 'Thrips tabaci',
      favorableTempMinC: 24,
      favorableTempMaxC: 36,
      favorableHumidityMaxPct: 65, // Favored by hot dry weather
      scoutingAdvice: 'Examine leaf axils and bases for silvery feeding streaks and minute black specks.'
    }
  ]
};
