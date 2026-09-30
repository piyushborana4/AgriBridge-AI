/**
 * AgriBridge AI — Climate Risk & Multi-Horizon Early Warning Engine
 * Computes forward-looking climate risk horizons (3-Day Immediate, 7-Day Medium, 14-Day Seasonal Trend).
 */

/**
 * Evaluates multi-horizon climate risks
 * @param {object} params
 * @param {object} params.weather - Weather telemetry and forecast
 * @param {object} params.heatStress - Heat stress output
 * @param {object} params.coldStress - Cold stress output
 * @param {object} params.rainfallRisks - Rainfall risks output
 * @param {object} params.stage - Current growth stage
 * @returns {object} Climate risks breakdown
 */
export function evaluateClimateRisks({
  weather,
  heatStress,
  coldStress,
  rainfallRisks,
  stage
}) {
  const risks = [];
  const windSpeedKmh = weather?.windSpeedKmh ?? weather?.wind ?? 12;

  // 1. Heatwave Risk
  if (heatStress?.riskLevel === 'high' || heatStress?.riskLevel === 'critical') {
    risks.push({
      horizon: '3_to_7_days',
      riskType: 'EXTREME_HEATWAVE',
      severity: heatStress.riskLevel,
      leadTimeHours: 48,
      probability: 0.85,
      impact: `Anticipated maximum temperatures reaching ${heatStress.maxObservedForecastTempC}°C during ${stage?.stageName || 'active development'}.`,
      proactiveMitigation: 'Schedule pre-emptive soil hydration; avoid foliage wetting during mid-day.'
    });
  }

  // 2. Frost / Chilling Risk
  if (coldStress?.frostRisk || coldStress?.riskLevel === 'critical') {
    risks.push({
      horizon: 'immediate_48h',
      riskType: 'RADIATION_FROST',
      severity: 'critical',
      leadTimeHours: 24,
      probability: 0.90,
      impact: `Near-freezing or sub-zero overnight temperatures (${coldStress.minObservedForecastTempC}°C).`,
      proactiveMitigation: 'Deploy ground mulches, evening thermal irrigation, or protective covers.'
    });
  }

  // 3. Deluge / Flash Flooding Risk
  if (rainfallRisks?.delugeRisk) {
    risks.push({
      horizon: '3_to_5_days',
      riskType: 'TORRENTIAL_DELUGE',
      severity: 'high',
      leadTimeHours: 48,
      probability: 0.75,
      impact: `Predicted 24h precipitation exceeding ${rainfallRisks.max24hRainMm} mm.`,
      proactiveMitigation: 'Excavate and unblock perimeter runoff trenches; elevate stored inputs.'
    });
  }

  // 4. Squall / High Wind Lodging Risk
  if (windSpeedKmh >= 35) {
    risks.push({
      horizon: 'immediate_24h',
      riskType: 'GALE_FORCE_WIND',
      severity: windSpeedKmh >= 50 ? 'critical' : 'moderate',
      leadTimeHours: 12,
      probability: 0.80,
      impact: `Gusts reaching ${windSpeedKmh} km/h pose mechanical lodging risk for tall crops.`,
      proactiveMitigation: 'Do not irrigate immediately before high wind events to maintain soil anchoring.'
    });
  }

  // 5. Extended Dry Spell
  if (rainfallRisks?.drySpellRisk) {
    risks.push({
      horizon: '7_to_14_days',
      riskType: 'DROUGHT_DRY_SPELL',
      severity: 'moderate',
      leadTimeHours: 96,
      probability: 0.70,
      impact: `${rainfallRisks.consecutiveDryDays} consecutive dry days in sensitive phenological phase.`,
      proactiveMitigation: 'Preserve soil moisture through mulching; prioritize deficit irrigation scheduling.'
    });
  }

  const highestSeverity = risks.some(r => r.severity === 'critical')
    ? 'critical'
    : risks.some(r => r.severity === 'high')
    ? 'high'
    : risks.some(r => r.severity === 'moderate')
    ? 'moderate'
    : 'low';

  return {
    overallClimateThreatLevel: highestSeverity,
    activeRisksCount: risks.length,
    risks,
    advisorySummary: risks.length > 0
      ? `${risks.length} climate risk horizon(s) detected. Primary concern: ${risks[0].riskType.replace(/_/g, ' ')} (${risks[0].horizon}).`
      : 'No severe meteorological hazards forecast over the 7-day planning horizon.'
  };
}
