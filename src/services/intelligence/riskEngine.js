import { RISK_CATEGORY_WEIGHTS, GROWTH_STAGE_SENSITIVITY } from './intelligenceConstants.js';

/**
 * Deterministic Farm Risk Engine
 * Computes multi-signal risk aggregation using explainable weighted rules.
 * Produces FarmRiskIndex (0-100) and categorized FarmRisk items.
 */
export function evaluateFarmRisks(signalsOrContext, anomalies = [], farmContextOpt = null) {
  let signalsObj = signalsOrContext;
  let farmContext = farmContextOpt || {};

  // If first param is farmContext
  if (signalsOrContext && !signalsOrContext.list && signalsOrContext.name) {
    farmContext = signalsOrContext;
    signalsObj = { list: [] };
  }

  const signals = Array.isArray(signalsObj) ? signalsObj : (signalsObj?.list || []);
  const findSig = (id) => signals.find(s => s.id === id);

  const ndviSig = findSig('sig-satellite-ndvi');
  const rainSig = findSig('sig-weather-precipitation');
  const tempSig = findSig('sig-weather-temp');
  const et0Sig = findSig('sig-weather-et0');
  const humidSig = findSig('sig-weather-humidity');
  const soilMoistSig = findSig('sig-soil-moisture');
  const soilPhSig = findSig('sig-soil-ph');

  const risks = [];

  // --- 1. WATER STRESS RISK (Weight: 30%) ---
  let waterScore = 15;
  const waterSignals = [];

  const rainVal = rainSig?.value ?? farmContext.weather?.rainfall7d ?? 15;
  const et0Val = et0Sig?.value ?? farmContext.weather?.et0 ?? 4.5;
  const soilMoistVal = soilMoistSig?.value ?? farmContext.soil?.moisture?.surface ?? 35;
  const tempVal = tempSig?.value ?? farmContext.weather?.temperature ?? 28;

  if (rainVal < 5) {
    waterScore += 25;
    waterSignals.push(`Low 7-day rainfall (${rainVal} mm)`);
  }
  if (et0Val > 5.0) {
    waterScore += 20;
    waterSignals.push(`Elevated ET₀ demand (${et0Val} mm/day)`);
  }
  if (soilMoistVal < 25) {
    waterScore += 35;
    waterSignals.push(`Soil moisture deficit (${soilMoistVal}%)`);
  } else if (soilMoistVal < 32) {
    waterScore += 15;
    waterSignals.push(`Sub-optimal soil moisture (${soilMoistVal}%)`);
  }
  if (tempVal > 36) {
    waterScore += 15;
    waterSignals.push(`High ambient temperature (${tempVal}°C)`);
  }

  waterScore = Math.min(100, waterScore);
  risks.push({
    id: 'risk-water',
    category: 'water',
    score: waterScore,
    level: waterScore >= 60 ? 'high' : waterScore >= 35 ? 'moderate' : 'low',
    title: waterScore >= 60 ? 'Severe Root-Zone Water Deficit' : waterScore >= 35 ? 'Moderate Evaporative Stress' : 'Balanced Water Balance',
    description: waterSignals.length > 0 ? waterSignals.join('; ') : 'Moisture levels and rainfall are within normal bounds.',
    signals: waterSignals
  });

  // --- 2. VEGETATION RISK (Weight: 25%) ---
  let vegScore = 15;
  const vegSignals = [];
  const ndviChange = ndviSig?.percentageChange ?? 0;

  if (ndviChange <= -20) {
    vegScore += 65;
    vegSignals.push(`Rapid NDVI decline of ${Math.abs(ndviChange)}%`);
  } else if (ndviChange <= -10) {
    vegScore += 40;
    vegSignals.push(`Moderate NDVI decline of ${Math.abs(ndviChange)}%`);
  } else if (ndviChange <= -5) {
    vegScore += 20;
    vegSignals.push(`Slight NDVI drop (${Math.abs(ndviChange)}%)`);
  }

  vegScore = Math.min(100, vegScore);
  risks.push({
    id: 'risk-vegetation',
    category: 'vegetation',
    score: vegScore,
    level: vegScore >= 60 ? 'high' : vegScore >= 35 ? 'moderate' : 'low',
    title: vegScore >= 60 ? 'Significant Vegetation Stress Detected' : vegScore >= 35 ? 'Canopy Vigor Fluctuation' : 'Healthy Active Biomass',
    description: vegSignals.length > 0 ? vegSignals.join('; ') : 'Multispectral canopy indices indicate vigorous photosynthetic biomass.',
    signals: vegSignals
  });

  // --- 3. EXTREME WEATHER RISK (Weight: 20%) ---
  let weatherScore = 15;
  const weatherSignals = [];

  if (tempVal >= 40) {
    weatherScore += 60;
    weatherSignals.push(`Extreme thermal spike (${tempVal}°C)`);
  } else if (tempVal >= 36) {
    weatherScore += 35;
    weatherSignals.push(`Elevated daytime heat (${tempVal}°C)`);
  }
  if (rainVal >= 60) {
    weatherScore += 45;
    weatherSignals.push(`Heavy precipitation event (${rainVal} mm)`);
  }

  weatherScore = Math.min(100, weatherScore);
  risks.push({
    id: 'risk-weather',
    category: 'weather',
    score: weatherScore,
    level: weatherScore >= 60 ? 'high' : weatherScore >= 35 ? 'moderate' : 'low',
    title: weatherScore >= 60 ? 'Critical Weather Anomaly' : weatherScore >= 35 ? 'Adverse Weather Conditions' : 'Favorable Weather Horizon',
    description: weatherSignals.length > 0 ? weatherSignals.join('; ') : 'Ambient meteorological conditions align with seasonal norms.',
    signals: weatherSignals
  });

  // --- 4. DISEASE CONDUCIVENESS RISK (Weight: 15%) ---
  let diseaseScore = 15;
  const diseaseSignals = [];
  const humidVal = humidSig?.value ?? farmContext.weather?.humidity ?? 60;

  if (humidVal >= 85 && tempVal >= 18 && tempVal <= 30) {
    diseaseScore += 55;
    diseaseSignals.push(`Persistent high humidity (${humidVal}%) & moderate temp (${tempVal}°C)`);
  } else if (humidVal >= 75) {
    diseaseScore += 30;
    diseaseSignals.push(`Elevated relative humidity (${humidVal}%)`);
  }

  diseaseScore = Math.min(100, diseaseScore);
  risks.push({
    id: 'risk-disease',
    category: 'disease',
    score: diseaseScore,
    level: diseaseScore >= 60 ? 'high' : diseaseScore >= 35 ? 'moderate' : 'low',
    title: diseaseScore >= 60 ? 'High Disease Conducive Microclimate' : diseaseScore >= 35 ? 'Elevated Foliar Wetness Potential' : 'Low Disease Conduciveness',
    description: diseaseSignals.length > 0 ? diseaseSignals.join('; ') : 'Atmospheric moisture levels do not indicate accelerated pathogen sporulation.',
    signals: diseaseSignals
  });

  // --- 5. SOIL HEALTH RISK (Weight: 10%) ---
  let soilScore = 15;
  const soilSignals = [];
  const phVal = soilPhSig?.value ?? farmContext.soil?.pH ?? 6.8;

  if (phVal < 6.0 || phVal > 7.8) {
    soilScore += 40;
    soilSignals.push(`Soil pH (${phVal}) out of optimal range (6.2-7.5)`);
  }
  if (soilMoistVal < 20 || soilMoistVal > 85) {
    soilScore += 35;
    soilSignals.push(`Sub-optimal soil moisture condition (${soilMoistVal}%)`);
  }

  soilScore = Math.min(100, soilScore);
  risks.push({
    id: 'risk-soil',
    category: 'soil',
    score: soilScore,
    level: soilScore >= 60 ? 'high' : soilScore >= 35 ? 'moderate' : 'low',
    title: soilScore >= 60 ? 'Soil Stress / Imbalance' : soilScore >= 35 ? 'Moderate Soil Adjustment Needed' : 'Balanced Soil Matrix',
    description: soilSignals.length > 0 ? soilSignals.join('; ') : 'Soil reaction and physical metrics within productive thresholds.',
    signals: soilSignals
  });

  // Aggregated Farm Risk Index (0 - 100)
  const weightedIndex = Math.round(
    waterScore * RISK_CATEGORY_WEIGHTS.water +
    vegScore * RISK_CATEGORY_WEIGHTS.vegetation +
    weatherScore * RISK_CATEGORY_WEIGHTS.weather +
    diseaseScore * RISK_CATEGORY_WEIGHTS.disease +
    soilScore * RISK_CATEGORY_WEIGHTS.soil
  );

  // Compounding multi-hazard synergy: If multiple risk pillars are simultaneously elevated
  const highRiskCount = risks.filter(r => r.score >= 50).length;
  const compoundMultiplier = highRiskCount >= 3 ? 1.20 : highRiskCount >= 2 ? 1.08 : 1.0;

  const overallScore = Math.min(100, Math.max(5, Math.round(weightedIndex * compoundMultiplier)));
  const overallCategory = overallScore >= 70 ? 'critical' : overallScore >= 50 ? 'high' : overallScore >= 30 ? 'moderate' : 'low';

  return {
    overallScore,
    farmRiskIndex: overallScore,
    overallCategory,
    overallRiskLevel: overallCategory,
    risks
  };
}
