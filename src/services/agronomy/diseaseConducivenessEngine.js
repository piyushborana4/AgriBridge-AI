/**
 * AgriBridge AI — Disease Conduciveness Engine
 * Evaluates microclimatic disease favorability based on temperature, relative humidity, and rainfall/leaf wetness.
 * 
 * STRICT SAFETY RULE:
 * Conducive environmental conditions != disease diagnosis.
 * Always explicitly set isDiagnosis: false and provide scouting guidance rather than diagnostic certainty.
 */

import { getCropProfile } from './cropProfiles/index.js';

/**
 * Evaluates disease conducive conditions for current crop and microclimate
 * @param {object} params
 * @param {string} params.crop - Crop name
 * @param {object} params.stage - Current growth stage
 * @param {object} params.weather - Weather telemetry and forecast
 * @returns {object} Disease favorability assessment
 */
export function evaluateDiseaseConduciveness({ crop, stage, weather }) {
  const profile = getCropProfile(crop);
  const currentTemp = weather?.temperature ?? weather?.temp ?? 25;
  const humidity = weather?.humidity ?? weather?.relativeHumidity ?? 60;
  const rainfall = weather?.rainfallMm ?? weather?.precipitation ?? 0;
  const forecastDaily = weather?.forecastDaily || [];

  // Estimate mean forecast humidity & temp
  let avgForecastHumidity = humidity;
  let avgForecastTemp = currentTemp;
  let rainyDaysCount = rainfall > 1 ? 1 : 0;

  if (forecastDaily.length > 0) {
    let sumHum = 0;
    let sumTemp = 0;
    forecastDaily.forEach(day => {
      sumHum += day.humidity ?? humidity;
      sumTemp += day.temp ?? currentTemp;
      if ((day.rainfallMm ?? day.rain ?? 0) > 1) rainyDaysCount++;
    });
    avgForecastHumidity = Math.round(sumHum / forecastDaily.length);
    avgForecastTemp = Math.round(sumTemp / forecastDaily.length);
  }

  const conduciveDiseases = [];
  let maxDiseasePressure = 0;

  const candidateDiseases = profile.diseaseConduciveness || [];

  candidateDiseases.forEach(d => {
    let matchScore = 0;

    // Check temperature match
    const tempInRange = (currentTemp >= d.favorableTempMinC && currentTemp <= d.favorableTempMaxC) ||
                        (avgForecastTemp >= d.favorableTempMinC && avgForecastTemp <= d.favorableTempMaxC);
    if (tempInRange) matchScore += 35;

    // Check humidity match
    const highHumidity = humidity >= d.favorableHumidityMinPct || avgForecastHumidity >= (d.favorableHumidityMinPct - 5);
    if (highHumidity) matchScore += 35;

    // Check rainfall / wetness
    if (rainyDaysCount >= 2 || rainfall >= 10) {
      matchScore += 20;
    }

    // Check stage vulnerability
    const stageVulnerable = d.vulnerableStages && stage?.stageId ? d.vulnerableStages.includes(stage.stageId) : true;
    if (stageVulnerable) matchScore += 10;

    if (matchScore >= 50) {
      let conducivenessLevel = 'moderate';
      if (matchScore >= 80) conducivenessLevel = 'high';

      if (matchScore > maxDiseasePressure) maxDiseasePressure = matchScore;

      conduciveDiseases.push({
        id: d.id,
        diseaseName: d.name,
        pathogen: d.pathogen,
        conducivenessLevel,
        score: matchScore,
        isDiagnosis: false, // Invariant safety flag
        environmentalDrivers: [
          tempInRange ? `Favorable temperature range (${d.favorableTempMinC}°C–${d.favorableTempMaxC}°C)` : null,
          highHumidity ? `Elevated atmospheric humidity (>${d.favorableHumidityMinPct}%)` : null,
          rainyDaysCount >= 1 ? `Extended canopy wetness from recent/forecast precipitation` : null
        ].filter(Boolean),
        stageSusceptibility: stageVulnerable ? `Current stage (${stage?.stageName}) is physiologically susceptible.` : 'Moderate stage tolerance.',
        scoutingAdvice: d.scoutingAdvice
      });
    }
  });

  let overallStatus = 'low';
  if (maxDiseasePressure >= 80) overallStatus = 'high';
  else if (maxDiseasePressure >= 50) overallStatus = 'moderate';

  return {
    diseasePressureIndex: maxDiseasePressure,
    overallFavorability: overallStatus,
    isDiagnosis: false, // Master safety invariant
    conduciveDiseases,
    safetyDisclaimer: 'Environmental favorability indicates weather conditions conducive to pathogen sporulation and spread. This is NOT a confirmed diagnosis. Conduct field scouting with Crop Doctor foliar photography to confirm symptoms.',
    activeMonitoringWindow: overallStatus !== 'low' ? 'Next 3–5 days' : 'Routine scouting'
  };
}
