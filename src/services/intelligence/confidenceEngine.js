import { FRESHNESS_HOURS } from './intelligenceConstants.js';

/**
 * Deterministic Confidence & Data Quality Engine
 */
export function computeDataFreshness(farmContext) {
  const streams = [];
  const now = Date.now();

  if (!farmContext) return streams;

  // 1. Weather Freshness
  const weatherSyncTime = farmContext.weather?.timestamp ? new Date(farmContext.weather.timestamp).getTime() : now;
  const weatherAgeHours = Math.round((now - weatherSyncTime) / (1000 * 60 * 60));
  const isStale = weatherAgeHours > 48 || farmContext.weather?.isLive === false;
  const weatherStatus = isStale ? 'Stale / Offline Cache' : 'Live High-Resolution Feed';

  streams.push({
    stream: 'Meteorology (Open-Meteo)',
    status: weatherStatus,
    quality: isStale ? 'medium' : 'high',
    ageHours: weatherAgeHours,
    points: isStale ? 15 : 30,
    source: farmContext.weather?.source || 'Open-Meteo'
  });

  // 2. Satellite Freshness
  const satDateStr = farmContext.satellite?.acquisitionDate || farmContext.satellite?.overpassDate;
  const satTime = satDateStr ? new Date(satDateStr).getTime() : now - 48 * 3600 * 1000;
  const satAgeHours = Math.round((now - satTime) / (1000 * 60 * 60));
  const cloudCover = farmContext.satellite?.cloudCoveragePct ?? 5;
  const isCloudMasked = cloudCover > 50;

  let satPoints = 30;
  let satStatus = 'Sentinel-2 Cloud-Free Pass';
  if (isCloudMasked) {
    satPoints = 15;
    satStatus = `Cloud Obstruction (${cloudCover}% cloud mask)`;
  } else if (!farmContext.satellite) {
    satPoints = 10;
    satStatus = 'Modeled Baseline';
  }

  streams.push({
    stream: 'Earth Observation (Sentinel-2)',
    status: satStatus,
    quality: satPoints >= 25 ? 'high' : 'medium',
    ageHours: satAgeHours,
    points: satPoints,
    source: farmContext.satellite?.provider || 'Sentinel-2 MSI'
  });

  // 3. Soil Freshness & Quality
  const soilIsFarmer = farmContext.soil?.isFarmerEntered;
  const hasSoil = !!farmContext.soil;

  streams.push({
    stream: 'Pedology (Soil Profile)',
    status: soilIsFarmer ? 'Verified Soil Health Card' : hasSoil ? 'Modeled Spatial Profile' : 'Missing Ground Test',
    quality: soilIsFarmer ? 'high' : 'medium',
    points: soilIsFarmer ? 25 : hasSoil ? 15 : 5,
    source: farmContext.soil?.source || 'Ground Sensor / SoilGrids'
  });

  return streams;
}

export function evaluateSystemConfidence(farmContext, signals = [], risks = []) {
  if (!farmContext || (!farmContext.weather && !farmContext.satellite && !farmContext.soil)) {
    return {
      confidence: 'insufficient',
      score: 25,
      rating: 'insufficient',
      reasons: ['Minimal farm parameters available.'],
      breakdown: {
        weather: { status: 'Missing', points: 0 },
        satellite: { status: 'Missing', points: 0 },
        soil: { status: 'Missing', points: 0 }
      },
      streams: []
    };
  }

  const streams = computeDataFreshness(farmContext);
  const breakdown = {};
  let totalScore = 0;

  streams.forEach(s => {
    totalScore += s.points;
    if (s.stream.includes('Meteorology')) breakdown.weather = { status: s.status, points: s.points };
    if (s.stream.includes('Earth Observation')) breakdown.satellite = { status: s.status, points: s.points };
    if (s.stream.includes('Pedology')) breakdown.soil = { status: s.status, points: s.points };
  });

  // Bonus for signal convergence
  if (farmContext.weather?.isLive && (farmContext.satellite?.currentNdvi || farmContext.satellite?.ndvi) && farmContext.soil) {
    totalScore += 15;
  }

  const score = Math.min(100, Math.max(15, totalScore));
  const rating = score >= 80 ? 'high' : score >= 55 ? 'moderate' : score >= 35 ? 'low' : 'insufficient';

  return {
    score,
    rating,
    confidence: rating,
    breakdown,
    streams
  };
}
