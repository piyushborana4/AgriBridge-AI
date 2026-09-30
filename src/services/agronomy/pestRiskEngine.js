/**
 * AgriBridge AI — Pest Risk & Environmental Pressure Engine
 * Models pest proliferation pressure based on thermal thresholds, dry spells, and humidity patterns.
 * 
 * STRICT SAFETY RULE:
 * Conducive environmental conditions != pest infestation sighting.
 * Always explicitly set isSighting: false and provide targeted field scouting advice.
 */

import { getCropProfile } from './cropProfiles/index.js';

/**
 * Evaluates pest proliferation risk
 * @param {object} params
 * @param {string} params.crop - Crop name
 * @param {object} params.stage - Current growth stage
 * @param {object} params.weather - Weather telemetry
 * @returns {object} Pest pressure assessment
 */
export function evaluatePestRisk({ crop, stage, weather }) {
  const profile = getCropProfile(crop);
  const currentTemp = weather?.temperature ?? weather?.temp ?? 25;
  const humidity = weather?.humidity ?? weather?.relativeHumidity ?? 60;
  const candidatePests = profile.pestPressure || [];

  const conducivePests = [];
  let maxPestPressure = 0;

  candidatePests.forEach(p => {
    let matchScore = 0;

    // Check temp
    if (currentTemp >= p.favorableTempMinC && currentTemp <= p.favorableTempMaxC) {
      matchScore += 45;
    }

    // Check humidity preference (dry vs humid)
    if (p.favorableHumidityMaxPct && humidity <= p.favorableHumidityMaxPct) {
      matchScore += 35; // Thrips/Mites thrive in dry heat
    } else if (p.favorableHumidityMinPct && humidity >= p.favorableHumidityMinPct) {
      matchScore += 35; // Armyworm / Aphids in moderate-high humidity
    } else {
      matchScore += 15;
    }

    // Stage factor
    if (stage?.stageId && (stage.stageId.includes('vegetative') || stage.stageId.includes('flowering') || stage.stageId.includes('tillering'))) {
      matchScore += 15;
    }

    if (matchScore >= 50) {
      let pressureLevel = 'moderate';
      if (matchScore >= 75) pressureLevel = 'high';

      if (matchScore > maxPestPressure) maxPestPressure = matchScore;

      conducivePests.push({
        id: p.id,
        pestName: p.name,
        scientificName: p.scientificName,
        pressureLevel,
        score: matchScore,
        isSighting: false, // Invariant safety flag
        favorableFactors: [
          `Temperature (${currentTemp}°C) within optimal activity range (${p.favorableTempMinC}°C–${p.favorableTempMaxC}°C)`,
          `Relative humidity (${humidity}%) favors population increase`
        ],
        scoutingAdvice: p.scoutingAdvice
      });
    }
  });

  let overallStatus = 'low';
  if (maxPestPressure >= 75) overallStatus = 'high';
  else if (maxPestPressure >= 50) overallStatus = 'moderate';

  return {
    pestPressureIndex: maxPestPressure,
    overallPressure: overallStatus,
    isSighting: false, // Master safety invariant
    conducivePests,
    safetyDisclaimer: 'Environmental pest pressure reflects weather-driven risk of population surge. No actual pest infestation is confirmed. Conduct physical field scouting and install sticky/pheromone traps.',
    recommendedScoutingFrequency: overallStatus === 'high' ? 'Every 2–3 days' : 'Weekly'
  };
}
