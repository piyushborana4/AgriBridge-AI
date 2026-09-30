/**
 * AgriBridge AI — Rainfall Risk Engine
 * Analyzes dry spells, deluge/heavy downpour events, unseasonal rainfall, and moisture extremes.
 */

/**
 * Evaluates rainfall risks
 * @param {object} params
 * @param {object} params.weather - Weather telemetry and forecast
 * @param {object} params.stage - Current growth stage
 * @returns {object} Rainfall risk analysis
 */
export function evaluateRainfallRisks({ weather, stage }) {
  const forecastDaily = weather?.forecastDaily || [];
  const rainfallToday = weather?.rainfallMm ?? weather?.precipitation ?? weather?.rain ?? 0;

  let consecutiveDryDays = 0;
  let max24hRainMm = rainfallToday;
  let heavyRainfallDays = 0;
  let totalForecastRainMm = 0;

  if (forecastDaily.length > 0) {
    for (const day of forecastDaily) {
      const dayRain = day.rainfallMm ?? day.rain ?? day.precipitation ?? 0;
      totalForecastRainMm += dayRain;
      if (dayRain > max24hRainMm) max24hRainMm = dayRain;
      if (dayRain >= 30) heavyRainfallDays++;
      if (dayRain < 1.0) consecutiveDryDays++;
      else consecutiveDryDays = 0; // Reset streak if rain occurs
    }
  }

  const isCriticalStage = stage?.waterSensitivity === 'critical';
  const drySpellRisk = consecutiveDryDays >= 5 && isCriticalStage;
  const delugeRisk = max24hRainMm >= 40 || heavyRainfallDays >= 1;

  const risks = [];

  if (delugeRisk) {
    risks.push({
      type: 'DELUGE_HEAVY_RAIN_WARNING',
      severity: max24hRainMm >= 60 ? 'critical' : 'high',
      metric: `${max24hRainMm.toFixed(1)} mm max 24h rain`,
      description: `Intense downpour forecast (${max24hRainMm.toFixed(1)} mm) carries elevated risk of field inundation, root asphyxiation, and topsoil nutrient leaching.`,
      recommendedAction: 'Clear peripheral field drainage ditches and protect vulnerable seedling beds.'
    });
  }

  if (drySpellRisk) {
    risks.push({
      type: 'PROLONGED_DRY_SPELL_ALERT',
      severity: 'moderate',
      metric: `${consecutiveDryDays} consecutive rainless days`,
      description: `Extended dry spell coincides with water-sensitive ${stage?.stageName || 'active growth'} stage.`,
      recommendedAction: 'Plan supplemental irrigation to prevent blossom abortion or vegetative stall.'
    });
  }

  return {
    drySpellRisk,
    delugeRisk,
    consecutiveDryDays,
    max24hRainMm: Math.round(max24hRainMm * 10) / 10,
    heavyRainfallDays,
    totalForecastRainMm: Math.round(totalForecastRainMm * 10) / 10,
    risks
  };
}
