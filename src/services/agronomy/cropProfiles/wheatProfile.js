/**
 * AgriBridge AI — Wheat Agronomic Profile (Triticum aestivum)
 * Source References: CIMMYT, FAO-56, ICAR-IIWBR Karnal.
 */

export const wheatProfile = {
  cropId: 'wheat',
  commonName: 'Wheat',
  botanicalName: 'Triticum aestivum',
  category: 'Cereal / Rabi Grain',
  regions: ['Temperate', 'Subtropical Winter Indo-Gangetic Plains'],
  referenceSources: ['CIMMYT Agronomy Guide', 'FAO-56', 'ICAR-IIWBR Karnal'],

  baseTemperatureC: 4.0,
  optimalTempMinC: 12.0,
  optimalTempMaxC: 22.0,
  heatStressThresholdC: 30.0, // Terminal heat > 30°C in grain fill causes yield penalty
  coldStressThresholdC: -1.0,
  frostDamageThresholdC: -4.0,
  nocturnalHeatThresholdC: 18.0,

  growthStages: [
    {
      id: 'crown_root_initiation',
      name: 'Crown Root Initiation (CRI)',
      typicalDasRange: [0, 25],
      cropCoefficientKc: 0.4,
      rootDepthCm: 25,
      waterSensitivity: 'critical', // Most critical irrigation stage for wheat
      heatSensitivity: 'medium',
      keyRisks: ['Termites', 'Crown rot', 'Moisture deficit halting rooting'],
      managementFocus: 'First irrigation essential at 20-25 DAS to establish crown root network.'
    },
    {
      id: 'tillering_jointing',
      name: 'Tillering & Jointing',
      typicalDasRange: [26, 60],
      cropCoefficientKc: 0.8,
      rootDepthCm: 50,
      waterSensitivity: 'high',
      heatSensitivity: 'medium',
      keyRisks: ['Weed competition (Phalaris minor)', 'Stripe rust initial foci'],
      managementFocus: 'Apply remaining nitrogen top-dressing before jointing stage.'
    },
    {
      id: 'booting_heading_anthesis',
      name: 'Booting, Heading & Anthesis (Flowering)',
      typicalDasRange: [61, 85],
      cropCoefficientKc: 1.15,
      rootDepthCm: 80,
      waterSensitivity: 'critical',
      heatSensitivity: 'high',
      keyRisks: ['Yellow/Stripe Rust (Puccinia striiformis)', 'Karnal Bunt', 'Powdery mildew'],
      managementFocus: 'Irrigate to support spike development; avoid high winds after irrigation to prevent lodging.'
    },
    {
      id: 'grain_filling_milking',
      name: 'Milk & Dough Grain Filling',
      typicalDasRange: [86, 115],
      cropCoefficientKc: 1.05,
      rootDepthCm: 90,
      waterSensitivity: 'high',
      heatSensitivity: 'critical', // Terminal heat stress zone
      keyRisks: ['Terminal heat shriveling grains', 'Brown rust', 'Aphids'],
      managementFocus: 'Light irrigation to maintain canopy cooling and grain plumpness.'
    },
    {
      id: 'maturity_harvest',
      name: 'Hard Dough & Ripening',
      typicalDasRange: [116, 135],
      cropCoefficientKc: 0.4,
      rootDepthCm: 90,
      waterSensitivity: 'low',
      heatSensitivity: 'low',
      keyRisks: ['Unseasonal rain shattering grains', 'Lodging'],
      managementFocus: 'Allow field drying for combine harvesting.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [6.0, 7.5],
    texturePreference: ['Loam', 'Clay Loam', 'Silt Loam'],
    salinityThresholdDsM: 6.0, // Moderately tolerant
    waterloggingTolerance: 'low',
    drainageRequirement: 'well_drained'
  },

  diseaseConduciveness: [
    {
      id: 'yellow_rust',
      name: 'Yellow / Stripe Rust',
      pathogen: 'Puccinia striiformis',
      favorableTempMinC: 10,
      favorableTempMaxC: 18,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 6,
      vulnerableStages: ['tillering_jointing', 'booting_heading_anthesis'],
      scoutingAdvice: 'Look for bright yellow-orange pustules arranged in linear stripes on upper leaves.'
    },
    {
      id: 'brown_rust',
      name: 'Brown / Leaf Rust',
      pathogen: 'Puccinia triticina',
      favorableTempMinC: 18,
      favorableTempMaxC: 26,
      favorableHumidityMinPct: 80,
      favorableLeafWetnessHours: 6,
      vulnerableStages: ['booting_heading_anthesis', 'grain_filling_milking'],
      scoutingAdvice: 'Check for scattered round orange-brown pustules on leaf blades.'
    }
  ],

  pestPressure: [
    {
      id: 'wheat_aphid',
      name: 'Wheat Aphid',
      scientificName: 'Rhopalosiphum padi / Sitobion avenae',
      favorableTempMinC: 15,
      favorableTempMaxC: 25,
      favorableHumidityMinPct: 60,
      scoutingAdvice: 'Check undersides of flag leaves and emerging earheads for green/black aphid colonies.'
    }
  ]
};
