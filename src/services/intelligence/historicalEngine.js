/**
 * Historical Engine - AgriBridge AI (Phase 4)
 * Analyzes sequential contexts and telemetry to track changes, timeline events, and risk trajectories.
 */

import { computeNDVITrend, computeRainfallTrend, computeTemperatureTrend, computeSoilMoistureTrend } from './trendEngine.js';

/**
 * Compares current farm context with previous context or historical trends to generate "What Changed?" summary.
 * @param {Object} currentContext - Current unified farm context
 * @param {Object} previousContext - Previous snapshot (if available)
 * @param {Object} calculatedTrends - Precomputed trends from trendEngine
 * @returns {Object} Structured What Changed report
 */
export function computeWhatChanged(currentContext, previousContext = null, calculatedTrends = null) {
  const changes = [];
  let overallState = 'stable';

  // 1. NDVI Change
  const ndviTrend = calculatedTrends?.ndvi || (currentContext?.satellite ? computeNDVITrend(
    currentContext.satellite.currentNdvi,
    previousContext?.satellite?.currentNdvi ?? currentContext.satellite.previousNdvi
  ) : null);

  if (ndviTrend && ndviTrend.absoluteChange !== null) {
    const isSignificant = Math.abs(ndviTrend.percentageChange) >= 5;
    changes.push({
      id: 'change-ndvi',
      metric: 'Vegetation Index (NDVI)',
      category: 'vegetation',
      current: ndviTrend.current,
      previous: ndviTrend.previous,
      delta: ndviTrend.absoluteChange,
      percentageChange: ndviTrend.percentageChange,
      direction: ndviTrend.direction,
      severity: Math.abs(ndviTrend.percentageChange) > 10 ? 'high' : isSignificant ? 'moderate' : 'low',
      description: ndviTrend.direction === 'decreasing'
        ? `NDVI dropped by ${Math.abs(ndviTrend.percentageChange)}% (${ndviTrend.previous} → ${ndviTrend.current}). Indicates vegetation stress or canopy reduction.`
        : ndviTrend.direction === 'increasing'
          ? `NDVI improved by ${ndviTrend.percentageChange}% (${ndviTrend.previous} → ${ndviTrend.current}). Vigorous vegetative expansion.`
          : `NDVI stable at ${ndviTrend.current}. Canopy density steady.`
    });
  }

  // 2. Rainfall & Moisture Change
  const rainTrend = calculatedTrends?.rainfall || (currentContext?.weather ? computeRainfallTrend(
    currentContext.weather.rainfall7d || currentContext.weather.precipitation || 0,
    previousContext?.weather?.rainfall7d ?? 0
  ) : null);

  if (rainTrend) {
    const rainDelta = rainTrend.absoluteChange;
    changes.push({
      id: 'change-rainfall',
      metric: '7-Day Precipitation',
      category: 'weather',
      current: `${rainTrend.current} mm`,
      previous: `${rainTrend.previous} mm`,
      delta: rainTrend.absoluteChange,
      percentageChange: rainTrend.percentageChange,
      direction: rainTrend.direction,
      severity: rainTrend.current < 5 ? 'moderate' : rainTrend.current > 60 ? 'high' : 'low',
      description: rainTrend.current === 0
        ? `No rain recorded in the last 7 days. Evapotranspiration is drawing on subsoil reserves.`
        : `${rainTrend.current} mm received over the last 7 days (${rainDelta >= 0 ? '+' : ''}${rainDelta} mm vs prior window).`
    });
  }

  // 3. Soil Moisture Change
  const soilMoistureTrend = calculatedTrends?.soilMoisture || (currentContext?.soil?.moisture ? computeSoilMoistureTrend(
    currentContext.soil.moisture.surface,
    previousContext?.soil?.moisture?.surface ?? currentContext.soil.moisture.surface
  ) : null);

  if (soilMoistureTrend && soilMoistureTrend.current !== null) {
    changes.push({
      id: 'change-soil-moisture',
      metric: 'Surface Soil Moisture (0-10cm)',
      category: 'soil',
      current: `${soilMoistureTrend.current}%`,
      previous: soilMoistureTrend.previous !== null ? `${soilMoistureTrend.previous}%` : 'N/A',
      delta: soilMoistureTrend.absoluteChange,
      percentageChange: soilMoistureTrend.percentageChange,
      direction: soilMoistureTrend.direction,
      severity: soilMoistureTrend.current < 25 ? 'high' : soilMoistureTrend.current < 35 ? 'moderate' : 'low',
      description: soilMoistureTrend.current < 25
        ? `Soil moisture critically low at ${soilMoistureTrend.current}%. Immediate irrigation review advised.`
        : soilMoistureTrend.current > 75
          ? `Soil moisture saturated at ${soilMoistureTrend.current}%. Watch for waterlogging and root hypoxia.`
          : `Soil moisture in healthy range (${soilMoistureTrend.current}%).`
    });
  }

  // 4. Temperature Trend
  const tempTrend = calculatedTrends?.temperature || (currentContext?.weather ? computeTemperatureTrend(
    currentContext.weather.temperature || currentContext.weather.tempMax || 28,
    previousContext?.weather?.temperature ?? 28
  ) : null);

  if (tempTrend) {
    changes.push({
      id: 'change-temperature',
      metric: 'Ambient Temperature',
      category: 'weather',
      current: `${tempTrend.current}°C`,
      previous: `${tempTrend.previous}°C`,
      delta: tempTrend.absoluteChange,
      percentageChange: tempTrend.percentageChange,
      direction: tempTrend.direction,
      severity: tempTrend.current > 38 ? 'high' : 'low',
      description: tempTrend.current > 38
        ? `High ambient heat (${tempTrend.current}°C). Elevated thermal stress potential.`
        : `Ambient temperature moderate (${tempTrend.current}°C).`
    });
  }

  // Determine overall status
  const highSeverityCount = changes.filter(c => c.severity === 'high').length;
  const modSeverityCount = changes.filter(c => c.severity === 'moderate').length;

  if (highSeverityCount > 0) {
    overallState = 'attention_needed';
  } else if (modSeverityCount > 0) {
    overallState = 'moderate_shift';
  } else {
    overallState = 'stable';
  }

  return {
    timestamp: new Date().toISOString(),
    overallState,
    changesCount: changes.length,
    highSeverityCount,
    items: changes
  };
}

/**
 * Builds chronological timeline events from context, telemetry, and past alerts.
 * @param {Object} context - Unified farm context
 * @param {Array} alertHistory - Historical alerts
 * @param {Array} userActions - Historical user actions
 * @returns {Array} List of chronological timeline items
 */
export function buildFarmTimeline(context, alertHistory = [], userActions = []) {
  const events = [];
  const now = new Date();

  // 1. Satellite Observation Event
  if (context?.satellite?.acquisitionDate) {
    events.push({
      id: `evt-sat-${context.satellite.acquisitionDate}`,
      timestamp: context.satellite.acquisitionDate,
      type: 'satellite_observation',
      category: 'satellite',
      title: 'Sentinel-2 Multispectral Pass',
      summary: `NDVI recorded at ${context.satellite.currentNdvi} (${context.satellite.cloudCoveragePct}% cloud cover).`,
      badge: 'Satellite',
      badgeColor: 'blue',
      source: 'Copernicus Sentinel-2'
    });
  }

  // 2. Weather Event (Rain / Heat)
  if (context?.weather) {
    if (context.weather.rainfall7d > 20) {
      events.push({
        id: `evt-weather-rain`,
        timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        type: 'weather_alert',
        category: 'weather',
        title: 'Significant Precipitation Event',
        summary: `Accumulated ${context.weather.rainfall7d} mm rainfall over recent period.`,
        badge: 'Rainfall',
        badgeColor: 'indigo',
        source: 'Open-Meteo'
      });
    }
    if (context.weather.tempMax > 36) {
      events.push({
        id: `evt-weather-heat`,
        timestamp: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
        type: 'weather_alert',
        category: 'weather',
        title: 'Thermal Spike Recorded',
        summary: `Peak daytime temperature reached ${context.weather.tempMax}°C.`,
        badge: 'Heat',
        badgeColor: 'amber',
        source: 'Open-Meteo'
      });
    }
  }

  // 3. Soil Analysis Event
  if (context?.soil?.lastUpdated) {
    events.push({
      id: `evt-soil-update`,
      timestamp: context.soil.lastUpdated,
      type: 'soil_analysis',
      category: 'soil',
      title: 'Soil Telemetry Refresh',
      summary: `pH ${context.soil.pH}, OM ${context.soil.organicMatterPct}%, Surface Moisture ${context.soil.moisture?.surface || 'N/A'}%.`,
      badge: 'Soil',
      badgeColor: 'emerald',
      source: context.soil.source || 'AgriBridge Ground Engine'
    });
  }

  // 4. Farmer Action Events
  if (Array.isArray(userActions)) {
    userActions.forEach((act, idx) => {
      events.push({
        id: `evt-action-${act.id || idx}`,
        timestamp: act.timestamp || new Date().toISOString(),
        type: 'farmer_action',
        category: 'management',
        title: act.title || 'Management Action Executed',
        summary: act.description || 'Farm operator confirmed advisory action.',
        badge: 'Action Completed',
        badgeColor: 'green',
        source: 'Farm Operator'
      });
    });
  }

  // 5. System Alerts
  if (Array.isArray(alertHistory)) {
    alertHistory.forEach((alt, idx) => {
      events.push({
        id: `evt-alert-${alt.id || idx}`,
        timestamp: alt.createdAt || alt.timestamp || new Date().toISOString(),
        type: 'risk_alert',
        category: alt.category || 'risk',
        title: alt.title || 'System Alert Raised',
        summary: alt.message || alt.description,
        badge: alt.severity?.toUpperCase() || 'ALERT',
        badgeColor: alt.severity === 'high' ? 'rose' : 'amber',
        source: 'AgriBridge Decision Engine'
      });
    });
  }

  // Sort descending by timestamp
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Calculates risk trajectory based on current and prior risk scores.
 * @param {number} currentScore - Current overall risk score (0-100)
 * @param {number|null} previousScore - Prior risk score
 * @returns {Object} Trajectory analysis
 */
export function calculateRiskTrajectory(currentScore, previousScore = null) {
  if (previousScore === null || previousScore === undefined) {
    return {
      trajectory: 'baseline',
      delta: 0,
      label: 'Initial Baseline Established',
      color: 'slate'
    };
  }

  const delta = currentScore - previousScore;
  if (delta > 5) {
    return {
      trajectory: 'deteriorating',
      delta,
      label: `Risk elevated by +${delta} pts vs previous cycle`,
      color: 'rose'
    };
  } else if (delta < -5) {
    return {
      trajectory: 'improving',
      delta,
      label: `Risk lowered by ${Math.abs(delta)} pts (improving conditions)`,
      color: 'emerald'
    };
  }

  return {
    trajectory: 'stable',
    delta,
    label: 'Risk score steady vs previous cycle',
    color: 'slate'
  };
}
