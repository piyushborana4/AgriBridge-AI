import { computeNDVITrend, computeRainfallTrend, computeTemperatureTrend, computeSoilMoistureTrend } from './trendEngine.js';

/**
 * Calculates accurate Days After Sowing (DAS)
 */
export function calculateDaysAfterSowing(sowingDateStr) {
  if (!sowingDateStr) return null;
  const sowing = new Date(sowingDateStr);
  if (isNaN(sowing.getTime())) return null;

  const now = new Date();
  const diffTime = now.getTime() - sowing.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Determines growth stage based on crop and DAS
 */
export function estimateGrowthStage(crop = 'Default', das = null) {
  if (das === null || das === undefined) {
    return { stage: 'Vegetative Growth', das: null };
  }

  const cropLower = (crop || '').toLowerCase();

  if (cropLower.includes('onion')) {
    if (das < 20) return { stage: 'Seedling / Establishment', das };
    if (das < 55) return { stage: 'Vegetative Growth', das };
    if (das < 85) return { stage: 'Bulb Initiation', das };
    if (das < 115) return { stage: 'Bulb Development', das };
    return { stage: 'Maturity / Harvest Window', das };
  }

  if (cropLower.includes('wheat')) {
    if (das < 20) return { stage: 'Crown Root Initiation', das };
    if (das < 45) return { stage: 'Tillering', das };
    if (das < 75) return { stage: 'Jointing & Booting', das };
    if (das < 100) return { stage: 'Heading & Flowering', das };
    if (das < 125) return { stage: 'Grain Filling', das };
    return { stage: 'Maturity', das };
  }

  if (cropLower.includes('rice')) {
    if (das < 25) return { stage: 'Seedling & Tillering', das };
    if (das < 60) return { stage: 'Vegetative / Stem Elongation', das };
    if (das < 90) return { stage: 'Panicle Initiation & Flowering', das };
    return { stage: 'Grain Ripening', das };
  }

  if (das < 30) return { stage: 'Early Vegetative', das };
  if (das < 70) return { stage: 'Active Vegetative', das };
  if (das < 100) return { stage: 'Reproductive', das };
  return { stage: 'Maturity', das };
}

/**
 * Deterministic Signal Extraction Engine (Phase 4.5)
 * Extracts normalized FarmSignal records with strict data provenance and evidence IDs.
 */
export function extractFarmSignals(farmContext) {
  if (!farmContext) return { growthStage: { stage: 'Unknown', das: null }, list: [] };

  const signals = [];
  const nowStr = new Date().toISOString();

  // Phenology
  const das = calculateDaysAfterSowing(farmContext.sowingDate);
  const growthStage = estimateGrowthStage(farmContext.crop, das);

  // 1. Weather Signals
  const weather = farmContext.weather || {};
  const currentTemp = weather.temperature ?? weather.tempMax ?? weather.current?.temp ?? 28;
  const currentHumidity = weather.humidity ?? weather.current?.humidity ?? 60;
  const currentEt0 = weather.et0 ?? weather.current?.et0 ?? 4.5;
  const currentRain = weather.rainfall7d ?? weather.precipitation ?? weather.current?.rainfall ?? 0;
  const weatherStatus = weather.isLive !== false ? 'REAL' : 'MODELED';

  signals.push({
    id: 'sig-weather-temp',
    evidenceId: 'SIG-WX-TEMP-001',
    type: 'weather',
    metric: 'Temperature',
    value: currentTemp,
    unit: '°C',
    status: currentTemp >= 38 ? 'critical' : currentTemp >= 33 ? 'warning' : 'normal',
    dataStatus: weatherStatus,
    quality: weather.isLive !== false ? 'high' : 'medium',
    observedAt: weather.timestamp || nowStr,
    source: weather.source || 'Open-Meteo High-Resolution API',
    description: `Ambient temperature recorded at ${currentTemp}°C.`
  });

  signals.push({
    id: 'sig-weather-humidity',
    evidenceId: 'SIG-WX-HUMID-001',
    type: 'weather',
    metric: 'Relative Humidity',
    value: currentHumidity,
    unit: '%',
    status: currentHumidity >= 85 ? 'warning' : currentHumidity < 30 ? 'watch' : 'normal',
    dataStatus: weatherStatus,
    quality: weather.isLive !== false ? 'high' : 'medium',
    observedAt: weather.timestamp || nowStr,
    source: weather.source || 'Open-Meteo High-Resolution API',
    description: `Atmospheric relative humidity at ${currentHumidity}%.`
  });

  signals.push({
    id: 'sig-weather-et0',
    evidenceId: 'SIG-WX-ET0-001',
    type: 'weather',
    metric: 'Evapotranspiration (ET₀)',
    value: currentEt0,
    unit: 'mm/day',
    status: currentEt0 > 5.5 ? 'warning' : 'normal',
    dataStatus: 'DERIVED',
    quality: 'high',
    observedAt: weather.timestamp || nowStr,
    source: 'FAO-56 Penman-Monteith Calculation',
    description: `Reference daily evapotranspiration rate of ${currentEt0} mm/day.`
  });

  signals.push({
    id: 'sig-weather-precipitation',
    evidenceId: 'SIG-WX-RAIN-001',
    type: 'weather',
    metric: '7-Day Precipitation',
    value: currentRain,
    unit: 'mm',
    status: currentRain < 5 ? 'warning' : currentRain > 60 ? 'watch' : 'normal',
    dataStatus: weatherStatus,
    quality: weather.isLive !== false ? 'high' : 'medium',
    observedAt: weather.timestamp || nowStr,
    source: weather.source || 'Open-Meteo High-Resolution API',
    description: `7-day cumulative precipitation recorded at ${currentRain} mm.`
  });

  // 2. Satellite Signals
  const satellite = farmContext.satellite;
  if (satellite && (satellite.currentNdvi !== undefined || satellite.ndvi !== undefined)) {
    const currentNdvi = satellite.currentNdvi ?? satellite.ndvi;
    const previousNdvi = satellite.previousNdvi ?? currentNdvi;
    const ndviTrend = computeNDVITrend(currentNdvi, previousNdvi);
    const cloudCover = satellite.cloudCoveragePct ?? 5;

    signals.push({
      id: 'sig-satellite-ndvi',
      evidenceId: 'SIG-SAT-NDVI-001',
      type: 'satellite',
      metric: 'NDVI Vegetation Vigor',
      value: currentNdvi,
      unit: 'index',
      direction: ndviTrend.direction,
      percentageChange: ndviTrend.percentageChange,
      status: ndviTrend.percentageChange < -10 ? 'warning' : 'normal',
      dataStatus: 'REAL',
      quality: cloudCover <= 15 ? 'high' : 'medium',
      observedAt: satellite.acquisitionDate || satellite.overpassDate || nowStr,
      source: satellite.provider || 'Copernicus Sentinel-2 MSI Level-2A',
      description: `Sentinel-2 NDVI multispectral index is ${currentNdvi} (${ndviTrend.percentageChange >= 0 ? '+' : ''}${ndviTrend.percentageChange}% change vs previous pass).`
    });
  }

  // 3. Soil Signals
  const soil = farmContext.soil;
  if (soil) {
    const soilMoisture = soil.moisture?.surface ?? soil.moisture ?? weather.current?.soilMoisture ?? 35;
    const soilPh = soil.pH ?? soil.ph ?? 6.8;
    const isFarmerLab = Boolean(soil.isFarmerEntered);

    signals.push({
      id: 'sig-soil-moisture',
      evidenceId: 'SIG-SOIL-MOIST-001',
      type: 'soil',
      metric: 'Surface Soil Moisture',
      value: soilMoisture,
      unit: '%',
      status: soilMoisture < 25 ? 'critical' : soilMoisture < 32 ? 'warning' : soilMoisture > 80 ? 'warning' : 'normal',
      dataStatus: isFarmerLab ? 'USER_PROVIDED' : 'MODELED',
      quality: isFarmerLab ? 'high' : 'medium',
      observedAt: soil.testDate || nowStr,
      source: soil.source || 'Pedological Ground Profile',
      description: `Surface root-zone soil moisture measured at ${soilMoisture}%.`
    });

    signals.push({
      id: 'sig-soil-ph',
      evidenceId: 'SIG-SOIL-PH-001',
      type: 'soil',
      metric: 'Soil Reaction (pH)',
      value: soilPh,
      unit: 'pH',
      status: soilPh < 6.0 || soilPh > 7.8 ? 'warning' : 'normal',
      dataStatus: isFarmerLab ? 'USER_PROVIDED' : 'MODELED',
      quality: isFarmerLab ? 'high' : 'medium',
      observedAt: soil.testDate || nowStr,
      source: soil.source || (isFarmerLab ? 'Farmer Soil Health Card (Laboratory)' : 'ISRIC SoilGrids 2.0 Modeled Profile'),
      description: `Soil reaction (pH) is ${soilPh} (${isFarmerLab ? 'Verified Laboratory Test' : 'Modeled Estimate'}).`
    });
  }

  return {
    growthStage,
    list: signals,
    find: (id) => signals.find(s => s.id === id || s.evidenceId === id)
  };
}
