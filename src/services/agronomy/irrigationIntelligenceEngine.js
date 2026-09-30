/**
 * AgriBridge AI — Irrigation Intelligence Engine
 * Provides deterministic, agronomy-grounded irrigation advisory.
 * 
 * Safety Invariant:
 * Never emit reckless automated volumetric commands.
 * Frame advice around field moisture checks, forecast rain windows, root-zone depletion, and crop stage criticality.
 */

/**
 * Evaluates irrigation requirement
 * @param {object} params
 * @param {object} params.waterBalance - Output from computeWaterBalance
 * @param {object} params.stage - Current growth stage
 * @param {object} params.soil - Soil data envelope
 * @param {object} params.weather - Weather data
 * @returns {object} Irrigation advisory
 */
export function evaluateIrrigationDecision({ waterBalance, stage, soil, weather }) {
  const net7d = waterBalance?.netBalance7dMm ?? 0;
  const soilMoisture = soil?.moisture ?? soil?.soilMoisture ?? null;
  const isCriticalStage = stage?.waterSensitivity === 'critical';
  const rainNext48h = (weather?.forecastDaily || []).slice(0, 2).reduce((sum, d) => sum + (d.rainfallMm || d.rain || 0), 0);
  const rainNext7d = waterBalance?.forecastRainfall7dMm ?? 0;

  // 1. Heavy rainfall expected soon -> Avoid excess / withhold
  if (rainNext48h >= 15 || net7d > 25 || soilMoisture > 75) {
    return {
      recommendation: 'avoid_excess',
      urgency: 'low',
      actionableWindow: 'Next 48–72 hours',
      rationale: `Significant rainfall (${rainNext48h.toFixed(1)} mm forecast in 48h) or high soil moisture (${soilMoisture ? soilMoisture + '%' : 'saturated'}). Withhold irrigation to prevent root asphyxiation, nutrient leaching, and fungal disease.`,
      fieldAction: 'Ensure field drainage channels are clear and clear standing furrow water if needed.',
      rainForecast48hMm: Math.round(rainNext48h * 10) / 10
    };
  }

  // 2. High deficit + dry forecast + critical stage -> Recommended
  if (net7d < -15 || (soilMoisture !== null && soilMoisture < 30)) {
    const urgency = isCriticalStage || (soilMoisture !== null && soilMoisture < 20) ? 'high' : 'medium';
    return {
      recommendation: 'recommended',
      urgency,
      actionableWindow: 'Next 24–48 hours',
      rationale: `Crop evapotranspiration demand (${waterBalance.cropEtcMmDay} mm/day) significantly exceeds rainfall with net 7-day deficit of ${Math.abs(net7d)} mm.${isCriticalStage ? ' Crop is in critical ' + stage.stageName + ' stage.' : ''}`,
      fieldAction: 'Check topsoil (0-15 cm) moisture. If dry below 3 cm depth, apply scheduled root-zone irrigation preferably in early morning or late evening.',
      rainForecast48hMm: Math.round(rainNext48h * 10) / 10
    };
  }

  // 3. Moderate balance / borderline moisture -> Monitor
  if (net7d < 0 || (soilMoisture !== null && soilMoisture < 45)) {
    return {
      recommendation: 'monitor',
      urgency: 'low',
      actionableWindow: 'Next 3–4 days',
      rationale: `Soil moisture reserves are currently adequate but declining steadily with cumulative crop demand of ${waterBalance.cropEtcMmDay} mm/day.`,
      fieldAction: 'Monitor soil moisture at root level over the next 48-72 hours before triggering irrigation.',
      rainForecast48hMm: Math.round(rainNext48h * 10) / 10
    };
  }

  // 4. Stable / sufficient moisture -> Not needed
  return {
    recommendation: 'not_needed',
    urgency: 'none',
    actionableWindow: 'Next 5–7 days',
    rationale: `Current moisture balance is optimal (${net7d >= 0 ? '+' : ''}${net7d} mm net) with sufficient soil reserves.`,
    fieldAction: 'No immediate irrigation required. Continue routine phenological monitoring.',
    rainForecast48hMm: Math.round(rainNext48h * 10) / 10
  };
}
