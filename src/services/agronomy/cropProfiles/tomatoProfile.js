/**
 * AgriBridge AI — Tomato Agronomic Profile (Solanum lycopersicum)
 * Source References: AVRDC (World Vegetable Center), FAO-56, ICAR-IIHR Bangalore.
 */

export const tomatoProfile = {
  cropId: 'tomato',
  commonName: 'Tomato',
  botanicalName: 'Solanum lycopersicum',
  category: 'Solanaceous Vegetable / Fruit',
  regions: ['Tropical', 'Subtropical', 'Temperate Protected & Open Field'],
  referenceSources: ['AVRDC Vegetable Production Guides', 'FAO-56', 'ICAR-IIHR Bangalore'],

  baseTemperatureC: 10.0,
  optimalTempMinC: 18.0,
  optimalTempMaxC: 27.0,
  heatStressThresholdC: 32.0, // >32°C day or >22°C night causes blossom drop
  coldStressThresholdC: 10.0,
  frostDamageThresholdC: 0.0,
  nocturnalHeatThresholdC: 22.0, // Critical for flower set

  growthStages: [
    {
      id: 'transplant_establishment',
      name: 'Transplanting & Root Establishment',
      typicalDasRange: [0, 25],
      cropCoefficientKc: 0.6,
      rootDepthCm: 25,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Transplant shock', 'Damping off', 'Cutworms'],
      managementFocus: 'Light frequent irrigation; stake seedlings.'
    },
    {
      id: 'vegetative_branching',
      name: 'Vegetative Growth & Early Flower Budding',
      typicalDasRange: [26, 45],
      cropCoefficientKc: 0.85,
      rootDepthCm: 50,
      waterSensitivity: 'high',
      heatSensitivity: 'high',
      keyRisks: ['Early blight (Alternaria solani)', 'Whitefly (Bemisia tabaci)', 'Tomato Leaf Curl Virus'],
      managementFocus: 'Prune suckers; install yellow sticky traps; maintain even soil moisture.'
    },
    {
      id: 'flowering_fruit_set',
      name: 'Flowering & Fruit Setting',
      typicalDasRange: [46, 75],
      cropCoefficientKc: 1.15,
      rootDepthCm: 70,
      waterSensitivity: 'critical', // Fluctuating moisture causes blossom end rot
      heatSensitivity: 'critical', // Day >32°C or Night >22°C aborts blossoms
      keyRisks: ['Blossom end rot (Calcium + water fluctuation)', 'Blossom drop from heat', 'Late blight'],
      managementFocus: 'Consistent drip irrigation; foliar calcium if deficiency signs appear.'
    },
    {
      id: 'fruit_development_ripening',
      name: 'Fruit Enlargement & Color Break',
      typicalDasRange: [76, 110],
      cropCoefficientKc: 1.15,
      rootDepthCm: 80,
      waterSensitivity: 'high',
      heatSensitivity: 'high',
      keyRisks: ['Fruit borer (Helicoverpa armigera)', 'Fruit cracking/splitting from sudden rain', 'Sunscald'],
      managementFocus: 'Avoid heavy flood irrigation after dry period to prevent fruit cracking.'
    },
    {
      id: 'harvesting_picks',
      name: 'Harvest Flushes & Maturation',
      typicalDasRange: [111, 140],
      cropCoefficientKc: 0.80,
      rootDepthCm: 80,
      waterSensitivity: 'medium',
      heatSensitivity: 'medium',
      keyRisks: ['Post-harvest rots', 'Mite flare-ups'],
      managementFocus: 'Harvest at breaker/pink stage for market transport.'
    }
  ],

  soilSuitability: {
    optimalPhRange: [6.0, 6.8],
    texturePreference: ['Sandy Loam', 'Loam', 'Well-drained Clay Loam'],
    salinityThresholdDsM: 2.5,
    waterloggingTolerance: 'low',
    drainageRequirement: 'well_drained'
  },

  diseaseConduciveness: [
    {
      id: 'early_blight',
      name: 'Early Blight',
      pathogen: 'Alternaria solani',
      favorableTempMinC: 22,
      favorableTempMaxC: 30,
      favorableHumidityMinPct: 80,
      favorableLeafWetnessHours: 8,
      vulnerableStages: ['vegetative_branching', 'flowering_fruit_set', 'fruit_development_ripening'],
      scoutingAdvice: 'Check lower leaves for dark brown spots with characteristic concentric rings ("target board" pattern).'
    },
    {
      id: 'late_blight',
      name: 'Late Blight',
      pathogen: 'Phytophthora infestans',
      favorableTempMinC: 12,
      favorableTempMaxC: 22,
      favorableHumidityMinPct: 90,
      favorableLeafWetnessHours: 10,
      vulnerableStages: ['flowering_fruit_set', 'fruit_development_ripening'],
      scoutingAdvice: 'Look for large water-soaked greasy patches turning purplish-black with white mildew underneath under cool wet conditions.'
    }
  ],

  pestPressure: [
    {
      id: 'whitefly',
      name: 'Whitefly (Vector for ToLCV)',
      scientificName: 'Bemisia tabaci',
      favorableTempMinC: 25,
      favorableTempMaxC: 35,
      favorableHumidityMinPct: 50,
      scoutingAdvice: 'Gently shake upper branches to look for tiny white moth-like flies; inspect undersides of apical leaves.'
    },
    {
      id: 'tomato_fruit_borer',
      name: 'Fruit Borer (Helicoverpa)',
      scientificName: 'Helicoverpa armigera',
      favorableTempMinC: 20,
      favorableTempMaxC: 32,
      favorableHumidityMinPct: 60,
      scoutingAdvice: 'Check flower buds and young fruits for boreholes with green caterpillars feeding partially inside.'
    }
  ]
};
