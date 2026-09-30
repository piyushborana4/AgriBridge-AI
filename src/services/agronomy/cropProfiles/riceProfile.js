/**
 * AgriBridge AI — Rice Agronomic Profile (Oryza sativa)
 * Source References: IRRI (International Rice Research Institute), FAO-56, ICAR-NRRI.
 */

export const riceProfile = {
  cropId: 'rice',
  commonName: 'Rice (Paddy)',
  botanicalName: 'Oryza sativa',
  category: 'Cereal / Grain',
  regions: ['Tropical', 'Subtropical Humid', 'Monsoon River Basins'],
  referenceSources: ['IRRI Rice Knowledge Bank', 'FAO-56', 'ICAR-NRRI Cuttack'],

  baseTemperatureC: 10.0,
  optimalTempMinC: 22.0,
  optimalTempMaxC: 32.0,
  heatStressThresholdC: 35.0, // Spikelet sterility if > 35°C during flowering
  coldStressThresholdC: 15.0,
  frostDamageThresholdC: 5.0,
  nocturnalHeatThresholdC: 25.0, // Elevated respiration losses at night

  growthStages: [
    {
      id: 'nursery_transplanting',
      name: 'Nursery & Transplanting / Seedling',
      typicalDasRange: [0, 25],
      cropCoefficientKc: 1.05,
      rootDepthCm: 15,
      waterSensitivity: 'high',
      heatSensitivity: 'medium',
      keyRisks: ['Seedling rot', 'Submergence shock', 'Iron deficiency in alkaline soils'],
      managementFocus: 'Maintain shallow standing water (2-3 cm); ensure good seedling vigor.'
    },
    {
      id: 'tillering',
      name: 'Active & Maximum Tillering',
      typicalDasRange: [26, 55],
      cropCoefficientKc: 1.15,
      rootDepthCm: 30,
      waterSensitivity: 'high',
      heatSensitivity: 'medium',
      keyRisks: ['Yellow stem borer', 'Bacterial leaf blight', 'Weed competition'],
      managementFocus: 'Alternate wetting and drying (AWD) where applicable; top-dress nitrogen.'
    },
    {
      id: 'panicle_initiation_booting',
      name: 'Panicle Initiation & Booting',
      typicalDasRange: [56, 80],
      cropCoefficientKc: 1.25,
      rootDepthCm: 45,
      waterSensitivity: 'critical',
      heatSensitivity: 'high',
      keyRisks: ['Rice blast (Magnaporthe oryzae)', 'Sheath blight', 'Stem borer entry'],
      managementFocus: 'Crucial water stage: do NOT allow field to dry out. Apply potassium.'
    },
    {
      id: 'flowering_heading',
      name: 'Heading & Anthesis (Flowering)',
      typicalDasRange: [81, 95],
      cropCoefficientKc: 1.25,
      rootDepthCm: 50,
      waterSensitivity: 'critical',
      heatSensitivity: 'critical', // >35°C causes floret sterility
      keyRisks: ['Spikelet sterility under heatwave', 'False smut', 'Gundhi bug'],
      managementFocus: 'Maintain continuous 3-5 cm water layer to cool canopy microclimate.'
    },
    {
      id: 'grain_filling_maturation',
      name: 'Milk, Dough & Ripening',
      typicalDasRange: [96, 125],
      cropCoefficientKc: 0.95,
      rootDepthCm: 50,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Lodging', 'Brown spot', 'Terminal drought shriveling'],
      managementFocus: 'Drain field 10 days before harvest for uniform ripening.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [5.5, 7.0],
    texturePreference: ['Clay', 'Clay Loam', 'Silty Clay (Low permeability)'],
    salinityThresholdDsM: 3.0,
    waterloggingTolerance: 'high', // Adapted to flooded / anaerobic conditions
    drainageRequirement: 'moderate_to_poor'
  },

  diseaseConduciveness: [
    {
      id: 'rice_blast',
      name: 'Rice Blast',
      pathogen: 'Magnaporthe oryzae',
      favorableTempMinC: 22,
      favorableTempMaxC: 28,
      favorableHumidityMinPct: 90,
      favorableLeafWetnessHours: 10,
      vulnerableStages: ['tillering', 'panicle_initiation_booting', 'flowering_heading'],
      scoutingAdvice: 'Check spindle-shaped lesions with gray-white centers and brownish margins on leaves.'
    },
    {
      id: 'sheath_blight',
      name: 'Sheath Blight',
      pathogen: 'Rhizoctonia solani',
      favorableTempMinC: 28,
      favorableTempMaxC: 32,
      favorableHumidityMinPct: 85,
      favorableLeafWetnessHours: 8,
      vulnerableStages: ['tillering', 'panicle_initiation_booting'],
      scoutingAdvice: 'Inspect lower leaf sheaths near waterline for oval or irregular greenish-grey spots.'
    }
  ],

  pestPressure: [
    {
      id: 'stem_borer',
      name: 'Yellow Stem Borer',
      scientificName: 'Scirpophaga incertulas',
      favorableTempMinC: 24,
      favorableTempMaxC: 32,
      favorableHumidityMinPct: 70,
      scoutingAdvice: 'Scout for egg masses covered in buff hair on leaf tips and "deadhearts" during vegetative stage.'
    },
    {
      id: 'brown_planthopper',
      name: 'Brown Planthopper (BPH)',
      scientificName: 'Nilaparvata lugens',
      favorableTempMinC: 25,
      favorableTempMaxC: 30,
      favorableHumidityMinPct: 80,
      scoutingAdvice: 'Part canopy at water level and check stems for hopper density and "hopper burn" patches.'
    }
  ]
};
