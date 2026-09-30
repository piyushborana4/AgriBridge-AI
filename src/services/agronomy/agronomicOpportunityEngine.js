/**
 * AgriBridge AI — Agronomic Opportunity & Field Window Engine
 * Identifies optimal, evidence-backed windows for spraying, fertilization, sowing, and harvesting.
 */

/**
 * Evaluates field operational opportunities
 * @param {object} params
 * @param {object} params.weather - Weather telemetry & forecast
 * @param {object} params.stage - Current growth stage
 * @param {object} params.waterBalance - Water balance
 * @returns {object} Field operational windows
 */
export function evaluateAgronomicOpportunities({ weather, stage, waterBalance }) {
  const currentTemp = weather?.temperature ?? 25;
  const windKmh = weather?.windSpeedKmh ?? weather?.wind ?? 10;
  const humidity = weather?.humidity ?? 60;
  const rainToday = weather?.rainfallMm ?? weather?.rain ?? 0;
  const forecastRain7d = waterBalance?.forecastRainfall7dMm ?? 0;

  const opportunities = [];

  // 1. Foliar Spraying Window (Biopesticides / Micronutrients)
  const isSprayWindOk = windKmh < 15;
  const isSprayRainOk = rainToday < 0.5;
  const isSprayTempOk = currentTemp >= 15 && currentTemp <= 30;

  if (isSprayWindOk && isSprayRainOk && isSprayTempOk) {
    opportunities.push({
      operation: 'foliar_spraying',
      title: 'Optimal Foliar Spraying Window',
      suitability: 'highly_favorable',
      timeframe: 'Early morning (06:00–09:00) or late afternoon',
      rationale: `Low wind speed (${windKmh} km/h prevents spray drift) and dry canopy maximize foliar retention.`
    });
  } else {
    opportunities.push({
      operation: 'foliar_spraying',
      title: 'Foliar Spraying Window',
      suitability: 'marginal_unfavorable',
      timeframe: 'Postpone until calmer conditions',
      rationale: `${!isSprayWindOk ? `High wind (${windKmh} km/h) causes drift. ` : ''}${!isSprayRainOk ? 'Rainfall will wash off active ingredients.' : ''}`.trim()
    });
  }

  // 2. Fertilizer / Soil Amendment Top-Dressing
  if (waterBalance?.status !== 'saturated' && forecastRain7d >= 5 && forecastRain7d <= 35) {
    opportunities.push({
      operation: 'fertilizer_top_dressing',
      title: 'Favorable Fertilizer Incorporation Window',
      suitability: 'highly_favorable',
      timeframe: 'Next 24–48 hours',
      rationale: `Moderate incoming precipitation (${forecastRain7d} mm) will dissolve and incorporate granular amendments without surface runoff.`
    });
  } else if (forecastRain7d > 40) {
    opportunities.push({
      operation: 'fertilizer_top_dressing',
      title: 'Withhold Granular Fertilizer',
      suitability: 'unfavorable',
      timeframe: 'Wait for heavy rain to pass',
      rationale: `Heavy deluge forecast (${forecastRain7d} mm) risks substantial nitrate/nutrient leaching and runoff loss.`
    });
  }

  // 3. Harvesting Window (if near maturity)
  const isLateStage = stage?.stageId?.includes('harvest') || stage?.stageId?.includes('matur') || stage?.stageId?.includes('ripen');
  if (isLateStage) {
    if (forecastRain7d < 2 && humidity < 70) {
      opportunities.push({
        operation: 'harvesting',
        title: 'Prime Harvesting & Curing Window',
        suitability: 'highly_favorable',
        timeframe: 'Next 3–5 days',
        rationale: 'Dry ambient conditions and low rainfall allow field curing and clean mechanical harvesting.'
      });
    }
  }

  return {
    activeOpportunitiesCount: opportunities.filter(o => o.suitability === 'highly_favorable').length,
    opportunities
  };
}
