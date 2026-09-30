/**
 * AgriBridge AI — Potato Agronomic Profile (Solanum tuberosum)
 * Source References: CIP (International Potato Center), FAO-56, ICAR-CPRI Shimla.
 */

export const potatoProfile = {
  cropId: 'potato',
  commonName: 'Potato',
  botanicalName: 'Solanum tuberosum',
  category: 'Tuber / Vegetable',
  regions: ['Temperate', 'Subtropical Winter Plain', 'Highland'],
  referenceSources: ['CIP Potato Guide', 'FAO-56', 'ICAR-CPRI Shimla'],

  baseTemperatureC: 7.0,
  optimalTempMinC: 15.0,
  optimalTempMaxC: 22.0,
  heatStressThresholdC: 28.0, // Night temp >20°C or day >28°C stops tuberization
  coldStressThresholdC: 3.0,
  frostDamageThresholdC: -1.0, // Highly vulnerable to ground frost
  nocturnalHeatThresholdC: 20.0, // Essential for tuber initiation

  growthStages: [
    {
      id: 'sprout_emergence',
      name: 'Sprout Development & Emergence',
      typicalDasRange: [0, 20],
      cropCoefficientKc: 0.5,
      rootDepthCm: 20,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Black scurf (Rhizoctonia)', 'Cutworms', 'Seed piece decay'],
      managementFocus: 'Ensure loose, friable seedbed; protect sprouts from freezing frost.'
    },
    {
      id: 'vegetative_canopy',
      name: 'Vegetative Growth & Earthing Up',
      typicalDasRange: [21, 45],
      cropCoefficientKc: 0.8,
      rootDepthCm: 40,
      waterSensitivity: 'high',
      heatSensitivity: 'medium',
      keyRisks: ['Early blight', 'Aphid vectors'],
      managementFocus: 'Earthing up at 30-35 DAS to cover developing stolons and prevent tuber greening.'
    },
    {
      id: 'tuber_initiation',
      name: 'Tuber Initiation & Setting',
      typicalDasRange: [46, 65],
      cropCoefficientKc: 1.15,
      rootDepthCm: 50,
      waterSensitivity: 'critical',
      heatSensitivity: 'critical', // >20°C night temperature severely inhibits tuber set
      keyRisks: ['Tuber set failure due to warm nights', 'Late Blight (Phytophthora)'],
      managementFocus: 'Frequent light irrigations; monitor microclimate for late blight.'
    },
    {
      id: 'tuber_bulking',
      name: 'Tuber Bulking & Enlargement',
      typicalDasRange: [66, 95],
      cropCoefficientKc: 1.10,
      rootDepthCm: 60,
      waterSensitivity: 'critical', // Uneven water causes hollow heart and growth cracks
      heatSensitivity: 'high',
      keyRisks: ['Late blight tuber rot', 'Scab', 'Hollow heart from moisture swings'],
      managementFocus: 'Maintain constant soil moisture around 70-80% field capacity.'
    },
    {
      id: 'maturation_dehaulming',
      name: 'Maturation & Dehaulming (Skin Curing)',
      typicalDasRange: [96, 115],
      cropCoefficientKc: 0.70,
      rootDepthCm: 60,
      waterSensitivity: 'low',
      heatSensitivity: 'medium',
      keyRisks: ['Tuber rot under wet soil', 'Aphids on dying haulms'],
      managementFocus: 'Cut haulms (dehaulm) 10-12 days before harvest to harden tuber skin.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [5.2, 6.5],
    texturePreference: ['Sandy Loam', 'Silt Loam', 'Loose Friable Loam'],
    salinityThresholdDsM: 1.7,
    waterloggingTolerance: 'very_low',
    drainageRequirement: 'well_drained'
  },

  diseaseConduciveness: [
    {
      id: 'potato_late_blight',
      name: 'Late Blight (Phytophthora infestans)',
      pathogen: 'Phytophthora infestans',
      favorableTempMinC: 10,
      favorableTempMaxC: 22,
      favorableHumidityMinPct: 90,
      favorableLeafWetnessHours: 8,
      vulnerableStages: ['vegetative_canopy', 'tuber_initiation', 'tuber_bulking'],
      scoutingAdvice: 'Check canopy understories for water-soaked dark spots with white fungal down on margins during cool foggy weather.'
    }
  ],

  pestPressure: [
    {
      id: 'potato_tuber_moth',
      name: 'Potato Tuber Moth',
      scientificName: 'Phthorimaea operculella',
      favorableTempMinC: 20,
      favorableTempMaxC: 30,
      favorableHumidityMinPct: 40,
      scoutingAdvice: 'Check exposed tubers near ridge cracks for mining tunnels and frass.'
    }
  ]
};
