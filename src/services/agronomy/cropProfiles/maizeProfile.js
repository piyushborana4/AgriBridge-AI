/**
 * AgriBridge AI — Maize Agronomic Profile (Zea mays)
 * Source References: CIMMYT Maize Program, FAO-56, ICAR-IIMR.
 */

export const maizeProfile = {
  cropId: 'maize',
  commonName: 'Maize (Corn)',
  botanicalName: 'Zea mays',
  category: 'Cereal / Coarse Grain',
  regions: ['Tropical', 'Subtropical', 'Temperate Rainfed & Irrigated'],
  referenceSources: ['CIMMYT Maize Field Guide', 'FAO-56', 'ICAR-IIMR Ludhiana'],

  baseTemperatureC: 10.0,
  optimalTempMinC: 18.0,
  optimalTempMaxC: 30.0,
  heatStressThresholdC: 35.0, // Tasseling heat > 35°C dessicates pollen
  coldStressThresholdC: 8.0,
  frostDamageThresholdC: 0.0,
  nocturnalHeatThresholdC: 24.0,

  growthStages: [
    {
      id: 'vegetative_early',
      name: 'V1 - V6 Seedling & Knee High',
      typicalDasRange: [0, 30],
      cropCoefficientKc: 0.4,
      rootDepthCm: 30,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Fall armyworm (Spodoptera frugiperda)', 'Shoot fly', 'Weed competition'],
      managementFocus: 'Early weed management; scout whorls for Fall Armyworm pinholes.'
    },
    {
      id: 'vegetative_late',
      name: 'V7 - VT Rapid Growth & Tasseling Prep',
      typicalDasRange: [31, 55],
      cropCoefficientKc: 0.85,
      rootDepthCm: 60,
      waterSensitivity: 'high',
      heatSensitivity: 'high',
      keyRisks: ['Maydis leaf blight', 'Stem borer', 'Nitrogen deficiency'],
      managementFocus: 'Peak nutrient accumulation; side-dress nitrogen.'
    },
    {
      id: 'flowering_silking',
      name: 'R1 Silking & Tasseling (Anthesis)',
      typicalDasRange: [56, 70],
      cropCoefficientKc: 1.20,
      rootDepthCm: 80,
      waterSensitivity: 'critical', // Moisture stress here causes severe yield loss
      heatSensitivity: 'critical',
      keyRisks: ['Pollen desiccation (>35°C)', 'Silk emergence delay (ASI)', 'Turcicum leaf blight'],
      managementFocus: 'Never allow drought stress during silking; ensure adequate moisture.'
    },
    {
      id: 'grain_filling_milking',
      name: 'R2 Blister - R4 Dough',
      typicalDasRange: [71, 95],
      cropCoefficientKc: 1.15,
      rootDepthCm: 90,
      waterSensitivity: 'high',
      heatSensitivity: 'high',
      keyRisks: ['Ear rots (Fusarium, Aspergillus)', 'Stalk rot'],
      managementFocus: 'Maintain soil moisture to maximize kernel weight.'
    },
    {
      id: 'maturation_black_layer',
      name: 'R5 Dent - R6 Physiological Maturity',
      typicalDasRange: [96, 115],
      cropCoefficientKc: 0.6,
      rootDepthCm: 90,
      waterSensitivity: 'low',
      heatSensitivity: 'low',
      keyRisks: ['Cob mold from rain', 'Lodging'],
      managementFocus: 'Check for black layer at kernel base; prepare for harvest.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [5.8, 7.2],
    texturePreference: ['Well-drained Loam', 'Silt Loam', 'Sandy Loam'],
    salinityThresholdDsM: 1.7,
    waterloggingTolerance: 'very_low', // Sensitive to even 24-48h flooding
    drainageRequirement: 'well_drained'
  },

  diseaseConduciveness: [
    {
      id: 'turcicum_leaf_blight',
      name: 'Turcicum / Northern Corn Leaf Blight',
      pathogen: 'Exserohilum turcicum',
      favorableTempMinC: 18,
      favorableTempMaxC: 27,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 8,
      vulnerableStages: ['vegetative_late', 'flowering_silking'],
      scoutingAdvice: 'Look for long elliptical grayish-green or tan lesions on lower leaves.'
    }
  ],

  pestPressure: [
    {
      id: 'fall_armyworm',
      name: 'Fall Armyworm (FAW)',
      scientificName: 'Spodoptera frugiperda',
      favorableTempMinC: 22,
      favorableTempMaxC: 32,
      favorableHumidityMinPct: 60,
      scoutingAdvice: 'Scout central whorls for "window pane" feeding damage, frass (sawdust-like droppings), and larvae.'
    }
  ]
};
