/**
 * AgriBridge AI — Soybean Agronomic Profile (Glycine max)
 * Source References: EMBRAPA, FAO-56, ICAR-IISR Indore.
 */

export const soybeanProfile = {
  cropId: 'soybean',
  commonName: 'Soybean',
  botanicalName: 'Glycine max',
  category: 'Legume / Oilseed',
  regions: ['Tropical', 'Subtropical', 'Temperate Rainfed & Irrigated'],
  referenceSources: ['EMBRAPA Soja Tech Manual', 'FAO-56', 'ICAR-IISR Indore'],

  baseTemperatureC: 10.0,
  optimalTempMinC: 20.0,
  optimalTempMaxC: 30.0,
  heatStressThresholdC: 35.0, // Pod abortion if >35°C during R1-R3
  coldStressThresholdC: 10.0,
  frostDamageThresholdC: 0.0,
  nocturnalHeatThresholdC: 24.0,

  growthStages: [
    {
      id: 'vegetative_nodulation',
      name: 'VE - V4 Emergence & Nodulation',
      typicalDasRange: [0, 30],
      cropCoefficientKc: 0.4,
      rootDepthCm: 30,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Stem fly', 'Girdle beetle', 'Crusting hindering emergence'],
      managementFocus: 'Ensure Bradyrhizobium inoculation; scout for early stem borers.'
    },
    {
      id: 'flowering_pod_initiation',
      name: 'R1 - R3 Flowering & Early Podding',
      typicalDasRange: [31, 55],
      cropCoefficientKc: 1.05,
      rootDepthCm: 60,
      waterSensitivity: 'critical', // Drought triggers massive flower drop
      heatSensitivity: 'critical',
      keyRisks: ['Flower & pod drop under moisture stress', 'Yellow Mosaic Virus (Whitefly)'],
      managementFocus: 'Crucial irrigation stage under dry spells; protect against defoliators.'
    },
    {
      id: 'pod_filling_seed_size',
      name: 'R4 - R6 Full Pod to Full Seed',
      typicalDasRange: [56, 85],
      cropCoefficientKc: 1.15,
      rootDepthCm: 80,
      waterSensitivity: 'critical',
      heatSensitivity: 'high',
      keyRisks: ['Rust (Phakopsora pachyrhizi)', 'Pod borer (Helicoverpa)', 'Spodoptera litura'],
      managementFocus: 'Maintain soil moisture to ensure complete seed filling.'
    },
    {
      id: 'maturation_leaf_drop',
      name: 'R7 - R8 Beginning to Full Maturity',
      typicalDasRange: [86, 105],
      cropCoefficientKc: 0.50,
      rootDepthCm: 80,
      waterSensitivity: 'low',
      heatSensitivity: 'low',
      keyRisks: ['Pod shattering if over-dry', 'Seed rotting if unseasonal rain'],
      managementFocus: 'Harvest when 95% of pods reach mature brown/tan color.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [6.0, 7.0],
    texturePreference: ['Clay Loam', 'Loam', 'Silt Loam', 'Deep Vertisols (Black Cotton Soil)'],
    salinityThresholdDsM: 5.0,
    waterloggingTolerance: 'low',
    drainageRequirement: 'well_drained'
  },

  diseaseConduciveness: [
    {
      id: 'asian_soybean_rust',
      name: 'Asian Soybean Rust',
      pathogen: 'Phakopsora pachyrhizi',
      favorableTempMinC: 18,
      favorableTempMaxC: 28,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 6,
      vulnerableStages: ['flowering_pod_initiation', 'pod_filling_seed_size'],
      scoutingAdvice: 'Check undersides of middle and lower canopy leaves for tiny tan to reddish-brown raised pustules.'
    }
  ],

  pestPressure: [
    {
      id: 'girdle_beetle',
      name: 'Girdle Beetle',
      scientificName: 'Oberopsis brevis',
      favorableTempMinC: 24,
      favorableTempMaxC: 32,
      favorableHumidityMinPct: 75,
      scoutingAdvice: 'Inspect petiole and stem junctions for typical dual ring girdles and wilting branch tips.'
    }
  ]
};
