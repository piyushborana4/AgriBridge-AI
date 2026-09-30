/**
 * AgriBridge AI — Heat Stress Engine
 * Evaluates day-time heat extremes, nocturnal heat stress, consecutive duration, and stage-specific vulnerability.
 */

import { getCropProfile } from './cropProfiles/index.js';

/**
 * Evaluates heat stress on crop
 * @param {object} params
 * @param {string} params.crop - Crop name
 * @param {object} params.stage - Current growth stage object from growthStageEngine
 * @param {object} params.weather - Current weather & forecast telemetry
 * @returns {object} Heat stress evaluation
 */
export function evaluateHeatStress({ crop, stage, weather }) {
  const profile = getCropProfile(crop);
  const currentTemp = weather?.temperature ?? weather?.temp ?? 25;
  const maxTemp = weather?.tempMax ?? weather?.temperatureMax ?? currentTemp;
  const minTemp = weather?.tempMin ?? weather?.temperatureMin ?? (currentTemp - 8);
  const forecastDaily = weather?.forecastDaily || [];

  const heatThreshold = profile.heatStressThresholdC || 35.0;
  const nocturnalThreshold = profile.nocturnalHeatThresholdC || 22.0;
  const isVulnerableStage = stage?.heatSensitivity === 'critical' || stage?.heatSensitivity === 'high';

  // Check forecast days above threshold
  let daysAboveThreshold = 0;
  let maxForecastTemp = maxTemp;
  let consecutiveHotDays = 0;
  let currentStreak = 0;

  if (forecastDaily.length > 0) {
    for (const day of forecastDaily) {
      const dayMax = day.tempMax ?? day.temperatureMax ?? day.temp ?? 25;
      if (dayMax > maxForecastTemp) maxForecastTemp = dayMax;
      if (dayMax >= heatThreshold) {
        daysAboveThreshold++;
        currentStreak++;
        if (currentStreak > consecutiveHotDays) consecutiveHotDays = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
  } else if (maxTemp >= heatThreshold) {
    daysAboveThreshold = 1;
    consecutiveHotDays = 1;
  }

  // Nocturnal heat evaluation
  const nocturnalHeatStress = minTemp >= nocturnalThreshold;

  // Compute Heat Stress Index (0 - 100)
  let heatScore = 0;
  if (maxForecastTemp >= heatThreshold) {
    const excess = maxForecastTemp - heatThreshold;
    heatScore += Math.min(60, excess * 12);
  }
  if (consecutiveHotDays >= 2) {
    heatScore += Math.min(25, consecutiveHotDays * 8);
  }
  if (nocturnalHeatStress) {
    heatScore += 15;
  }
  if (isVulnerableStage && heatScore > 10) {
    heatScore = Math.min(100, Math.round(heatScore * 1.3));
  }
  heatScore = Math.min(100, Math.max(0, Math.round(heatScore)));

  // Risk Classification
  let riskLevel = 'low';
  if (heatScore >= 75) riskLevel = 'critical';
  else if (heatScore >= 50) riskLevel = 'high';
  else if (heatScore >= 25) riskLevel = 'moderate';

  // Agronomic Physiological Guidance
  const alerts = [];
  let physiologicalImpact = 'Temperatures are within physiological tolerance range for this crop.';

  if (riskLevel === 'critical' || riskLevel === 'high') {
    if (isVulnerableStage) {
      physiologicalImpact = `High thermal stress during sensitive ${stage.stageName} stage may induce flower/blossom abortion, pollen desiccation, or impaired fruit/grain sizing.`;
    } else {
      physiologicalImpact = `Elevated temperatures exceeding ${heatThreshold}°C increase transpiration demands and leaf stomatal closure.`;
    }
    alerts.push({
      type: 'HEAT_STRESS_WARNING',
      severity: riskLevel,
      message: `Forecast temperatures reach ${maxForecastTemp}°C (Threshold: ${heatThreshold}°C). ${isVulnerableStage ? 'Sensitive stage: ' + stage.stageName : ''}`
    });
  }

  if (nocturnalHeatStress && (riskLevel === 'moderate' || riskLevel === 'high' || riskLevel === 'critical')) {
    alerts.push({
      type: 'NOCTURNAL_HEAT_ALERT',
      severity: 'moderate',
      message: `Night temperatures remaining above ${nocturnalThreshold}°C accelerate dark respiration and assimilate loss.`
    });
  }

  return {
    heatStressIndex: heatScore,
    riskLevel,
    maxObservedForecastTempC: maxForecastTemp,
    heatThresholdC: heatThreshold,
    nocturnalThresholdC: nocturnalThreshold,
    nocturnalHeatStress,
    consecutiveHotDays,
    isStageSensitive: isVulnerableStage,
    physiologicalImpact,
    alerts,
    mitigationActions: heatScore >= 35 ? [
      'Maintain adequate root-zone soil moisture to support evaporative cooling.',
      'If using drip irrigation, consider short morning or late afternoon wetting cycles.',
      'Avoid high-dose nitrogen top-dressing during acute thermal stress.'
    ] : []
  };
}
