/**
 * AgriBridge AI — Cold Stress & Frost Engine
 * Evaluates chilling injury, sub-zero radiation frost, duration of minimum temperatures, and stage sensitivity.
 */

import { getCropProfile } from './cropProfiles/index.js';

/**
 * Evaluates cold stress and frost risk on crop
 * @param {object} params
 * @param {string} params.crop - Crop name
 * @param {object} params.stage - Growth stage object
 * @param {object} params.weather - Weather telemetry
 * @returns {object} Cold stress evaluation
 */
export function evaluateColdStress({ crop, stage, weather }) {
  const profile = getCropProfile(crop);
  const currentTemp = weather?.temperature ?? weather?.temp ?? 20;
  const minTemp = weather?.tempMin ?? weather?.temperatureMin ?? (currentTemp - 8);
  const forecastDaily = weather?.forecastDaily || [];

  const coldThreshold = profile.coldStressThresholdC ?? 8.0;
  const frostThreshold = profile.frostDamageThresholdC ?? 0.0;

  let minForecastTemp = minTemp;
  let frostDaysCount = 0;
  let coldDaysCount = 0;

  if (forecastDaily.length > 0) {
    for (const day of forecastDaily) {
      const dayMin = day.tempMin ?? day.temperatureMin ?? minTemp;
      if (dayMin < minForecastTemp) minForecastTemp = dayMin;
      if (dayMin <= frostThreshold) frostDaysCount++;
      else if (dayMin <= coldThreshold) coldDaysCount++;
    }
  } else {
    if (minTemp <= frostThreshold) frostDaysCount = 1;
    else if (minTemp <= coldThreshold) coldDaysCount = 1;
  }

  const frostRisk = minForecastTemp <= frostThreshold;
  const chillingRisk = minForecastTemp <= coldThreshold && !frostRisk;

  // Compute Cold Stress Index (0 - 100)
  let coldScore = 0;
  if (frostRisk) {
    const frostDeficit = frostThreshold - minForecastTemp;
    coldScore = Math.min(100, 70 + (frostDeficit * 15) + (frostDaysCount * 10));
  } else if (chillingRisk) {
    const chillDeficit = coldThreshold - minForecastTemp;
    coldScore = Math.min(60, Math.round(chillDeficit * 8 + coldDaysCount * 6));
  }

  let riskLevel = 'low';
  if (coldScore >= 70) riskLevel = 'critical';
  else if (coldScore >= 45) riskLevel = 'high';
  else if (coldScore >= 20) riskLevel = 'moderate';

  const alerts = [];
  let physiologicalImpact = 'Minimum temperatures remain safe for crop development.';

  if (frostRisk) {
    physiologicalImpact = `Sub-zero or freezing temperatures (${minForecastTemp}°C) pose acute risk of intracellular ice formation, leaf blackening, and terminal tissue necrosis.`;
    alerts.push({
      type: 'FROST_WARNING',
      severity: 'critical',
      message: `Frost forecast detected with minimum temperatures dropping to ${minForecastTemp}°C (Frost threshold: ${frostThreshold}°C).`
    });
  } else if (chillingRisk && (riskLevel === 'high' || riskLevel === 'moderate')) {
    physiologicalImpact = `Low temperatures (${minForecastTemp}°C) below crop baseline (${coldThreshold}°C) slow enzymatic metabolism, root nutrient uptake, and shoot elongation.`;
    alerts.push({
      type: 'CHILLING_STRESS_ALERT',
      severity: 'moderate',
      message: `Chilling conditions forecast (${minForecastTemp}°C vs optimal min ${profile.optimalTempMinC}°C).`
    });
  }

  return {
    coldStressIndex: coldScore,
    riskLevel,
    minObservedForecastTempC: minForecastTemp,
    coldThresholdC: coldThreshold,
    frostThresholdC: frostThreshold,
    frostRisk,
    chillingRisk,
    frostDaysCount,
    physiologicalImpact,
    alerts,
    mitigationActions: frostRisk ? [
      'Apply light protective evening irrigation to increase soil thermal mass and latent heat release.',
      'Deploy crop covers, mulches, or wind machines if available for high-value horticultural beds.',
      'Postpone any pruning or herbicide applications until cold spell passes.'
    ] : []
  };
}
