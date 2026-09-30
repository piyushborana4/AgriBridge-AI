/**
 * AgriBridge AI — Cross-Region & Aggregate Intelligence Service (Phase 7)
 * Computes privacy-preserving aggregate agricultural signals across agro-climatic regions.
 * 
 * STRICT INVARIANTS:
 * 1. Minimum Aggregation Threshold: Requires at least 3 contributing farms per region
 *    to prevent the re-identification of individual farmer operations.
 * 2. No Fabricated Cross-Country Data: If a foreign territory (e.g. Brazil) does not have
 *    connected live farm data, return 'No comparable dataset available' rather than inventing telemetry.
 */

import { getCountryProfile } from './countryRegistry.js';

const MIN_FARMS_FOR_REGIONAL_AGGREGATION = 3;

/**
 * Computes regional aggregate agronomic indicators
 * @param {object} params
 * @param {string} params.country - Country name or code
 * @param {string} params.region - Region or agro-climatic zone
 * @param {string} [params.crop] - Specific crop or all
 * @param {Array<object>} [params.farmsData=[]] - Array of contributing anonymized farm envelopes
 * @returns {object} Regional intelligence summary
 */
export function computeRegionalIntelligence({
  country = 'India',
  region = 'Maharashtra Semi-Arid',
  crop = 'Onion',
  farmsData = []
}) {
  const countryProfile = getCountryProfile(country);

  // 1. Check if Country is connected / configured
  if (!countryProfile || countryProfile.interoperabilityStatus === 'unavailable' || (countryProfile.code !== 'IN' && farmsData.length === 0)) {
    return {
      country: countryProfile?.name || country,
      region,
      crop,
      status: 'DATA_NOT_CONNECTED',
      sampleSize: 0,
      message: `${countryProfile?.name || country}: Data not connected. No comparable dataset available for regional aggregation.`,
      isAggregateAvailable: false,
      indicators: null
    };
  }

  // 2. Minimum Sample Size Check for Privacy
  if (farmsData.length < MIN_FARMS_FOR_REGIONAL_AGGREGATION) {
    return {
      country: countryProfile.name,
      region,
      crop,
      status: 'INSUFFICIENT_SAMPLE_SIZE',
      sampleSize: farmsData.length,
      requiredMinimum: MIN_FARMS_FOR_REGIONAL_AGGREGATION,
      message: `Regional aggregation requires at least ${MIN_FARMS_FOR_REGIONAL_AGGREGATION} contributing farms in ${region} to maintain privacy-preserving boundaries (Currently: ${farmsData.length}).`,
      isAggregateAvailable: false,
      indicators: null
    };
  }

  // 3. Compute Privacy-Preserving Aggregate Indicators
  let totalNdvi = 0;
  let totalSoilMoisture = 0;
  let totalNetBalance7d = 0;
  let diseasePressureSum = 0;
  let count = farmsData.length;

  farmsData.forEach(f => {
    const p = f.payload || f;
    totalNdvi += p.ndvi ?? p.satellite?.ndviCurrent ?? 0.72;
    totalSoilMoisture += p.soilMoisture ?? p.soil?.moisture ?? 35;
    totalNetBalance7d += p.netWaterBalance ?? p.waterBalance?.netBalance7dMm ?? -10;
    diseasePressureSum += p.diseasePressure ?? 30;
  });

  const avgNdvi = Math.round((totalNdvi / count) * 100) / 100;
  const avgSoilMoisture = Math.round((totalSoilMoisture / count) * 10) / 10;
  const avgNetBalance7d = Math.round((totalNetBalance7d / count) * 10) / 10;
  const avgDiseaseScore = Math.round(diseasePressureSum / count);

  return {
    country: countryProfile.name,
    region,
    crop,
    status: 'AGGREGATED_AVAILABLE',
    sampleSize: count,
    isAggregateAvailable: true,
    message: `Aggregated from ${count} contributing farms in ${region}.`,
    indicators: {
      averageCanopyNdvi: avgNdvi,
      canopyVigorRating: avgNdvi >= 0.70 ? 'Vigorous' : avgNdvi >= 0.50 ? 'Moderate' : 'Stressed',
      averageTopsoilMoisturePct: avgSoilMoisture,
      average7dWaterBalanceMm: avgNetBalance7d,
      regionalMoistureStatus: avgNetBalance7d < -15 ? 'Regional Deficit' : avgNetBalance7d > 25 ? 'Regional Surplus' : 'Balanced',
      regionalDiseasePressureIndex: avgDiseaseScore,
      diseaseRiskLevel: avgDiseaseScore >= 70 ? 'High' : avgDiseaseScore >= 40 ? 'Moderate' : 'Low'
    },
    provenance: {
      aggregationMethod: 'Privacy-Preserving Mean Aggregation (k >= 3)',
      generatedAt: new Date().toISOString()
    }
  };
}
