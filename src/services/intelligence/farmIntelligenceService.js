/**
 * Farm Intelligence Service - AgriBridge AI (Phase 4)
 * Central deterministic orchestrator. Combines all data layers into a unified,
 * mathematically grounded FarmIntelligence data structure before AI reasoning.
 */

import { extractFarmSignals } from './signalEngine.js';
import { computeNDVITrend, computeRainfallTrend, computeTemperatureTrend, computeSoilMoistureTrend } from './trendEngine.js';
import { detectVegetationAnomalies, detectWeatherAnomalies, detectSoilAnomalies } from './anomalyEngine.js';
import { buildEvidenceItems } from './evidenceEngine.js';
import { evaluateFarmRisks } from './riskEngine.js';
import { evaluateSystemConfidence } from './confidenceEngine.js';
import { generateCandidateRecommendations, extractOpportunities } from './recommendationEngine.js';
import { computeWhatChanged, buildFarmTimeline, calculateRiskTrajectory } from './historicalEngine.js';
import { INTELLIGENCE_PROMPT_VERSION } from './intelligenceConstants.js';
import { buildAgronomicContext } from '../agronomy/agronomicContextEngine.js';

/**
 * Compiles a comprehensive, deterministic FarmIntelligence package for a given farm context.
 * @param {Object} farmContext - Unified Farm Context (from farmContextEngine or server)
 * @param {Object} previousContext - Previous farm context snapshot (optional)
 * @param {Array} alertHistory - Historical alerts (optional)
 * @param {Array} userActions - Historical user actions / completions (optional)
 * @returns {Object} Complete FarmIntelligence object
 */
export function compileFarmIntelligence(farmContext, previousContext = null, alertHistory = [], userActions = []) {
  if (!farmContext) {
    throw new Error('Cannot compile farm intelligence: missing farm context');
  }

  // 1. Extract Signals
  const signals = extractFarmSignals(farmContext);

  // 2. Compute Mathematical Trends
  const ndviTrend = farmContext.satellite ? computeNDVITrend(
    farmContext.satellite.currentNdvi,
    previousContext?.satellite?.currentNdvi ?? farmContext.satellite.previousNdvi
  ) : null;

  const rainfallTrend = farmContext.weather ? computeRainfallTrend(
    farmContext.weather.rainfall7d || farmContext.weather.precipitation || 0,
    previousContext?.weather?.rainfall7d ?? 0
  ) : null;

  const tempTrend = farmContext.weather ? computeTemperatureTrend(
    farmContext.weather.temperature || farmContext.weather.tempMax || 28,
    previousContext?.weather?.temperature ?? 28
  ) : null;

  const soilMoistureTrend = farmContext.soil?.moisture ? computeSoilMoistureTrend(
    farmContext.soil.moisture.surface,
    previousContext?.soil?.moisture?.surface ?? farmContext.soil.moisture.surface
  ) : null;

  const trends = {
    ndvi: ndviTrend,
    rainfall: rainfallTrend,
    temperature: tempTrend,
    soilMoisture: soilMoistureTrend
  };

  // 3. Detect Anomalies
  const vegetationAnomalies = detectVegetationAnomalies(farmContext, ndviTrend);
  const weatherAnomalies = detectWeatherAnomalies(farmContext);
  const soilAnomalies = detectSoilAnomalies(farmContext);
  const allAnomalies = [...vegetationAnomalies, ...weatherAnomalies, ...soilAnomalies];

  // 4. Build Evidence Items
  const evidenceItems = buildEvidenceItems(signals, trends, allAnomalies);

  // 5. Evaluate Multi-Signal Risks
  const riskIndex = evaluateFarmRisks(signals, allAnomalies, farmContext);

  // 6. Evaluate System Confidence & Freshness
  const confidence = evaluateSystemConfidence(farmContext);

  // 7. Generate Candidate Recommendations & Opportunities
  const candidateRecommendations = generateCandidateRecommendations(riskIndex, farmContext, evidenceItems);
  const opportunities = extractOpportunities(farmContext, riskIndex);

  // 8. Historical & Trajectory Analysis
  const whatChanged = computeWhatChanged(farmContext, previousContext, trends);
  const timeline = buildFarmTimeline(farmContext, alertHistory, userActions);
  const riskTrajectory = calculateRiskTrajectory(
    riskIndex.overallScore,
    previousContext?.riskScore ?? null
  );

  // 9. Central Agronomic & Phenological Evaluation (Phase 6)
  const agronomicContext = buildAgronomicContext({
    farm: farmContext,
    weather: farmContext.weather,
    soil: farmContext.soil,
    satellite: farmContext.satellite,
    farmerObservations: userActions.filter(a => a.type === 'observation' || a.category === 'crop_health'),
    cropDoctorCases: []
  });

  // 10. Synthesize Complete Farm Intelligence Object
  const farmIntelligence = {
    version: INTELLIGENCE_PROMPT_VERSION,
    farmId: farmContext.id,
    farmName: farmContext.name,
    crop: farmContext.crop,
    variety: farmContext.variety,
    sowingDate: farmContext.sowingDate,
    calculatedStage: signals.growthStage?.stage || agronomicContext.growthStage?.stageName || 'Unknown',
    das: signals.growthStage?.das ?? agronomicContext.growthStage?.das ?? null,
    location: farmContext.location,
    generatedAt: new Date().toISOString(),
    
    // Phase 6 Agronomic Intelligence Engine
    agronomicContext,

    // Deterministic Intelligence Components
    signals,
    trends,
    anomalies: allAnomalies,
    evidenceItems,
    riskIndex,
    confidence,
    candidateRecommendations,
    opportunities,
    whatChanged,
    timeline,
    riskTrajectory,
    
    // Data Lineage
    lineage: {
      weatherSource: farmContext.weather?.source || 'Open-Meteo API',
      weatherTimestamp: farmContext.weather?.timestamp || null,
      satelliteSource: farmContext.satellite?.source || 'Copernicus Sentinel-2',
      satelliteAcquisitionDate: farmContext.satellite?.acquisitionDate || null,
      cloudCoveragePct: farmContext.satellite?.cloudCoveragePct ?? 0,
      soilSource: farmContext.soil?.source || 'AgriBridge Ground Engine'
    }
  };

  return farmIntelligence;
}
