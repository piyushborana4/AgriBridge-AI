/**
 * AgriBridge AI — Water Balance Engine
 * Computes Reference ET₀, Stage-specific Crop ETc (Kc × ET₀), Net Precipitation Balance, and Root-zone Deficit/Surplus.
 * References: FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998).
 */

import { getCropProfile } from './cropProfiles/index.js';

/**
 * Estimates Reference Evapotranspiration (ET₀ in mm/day) using FAO Hargreaves temperature approximation
 * @param {number} tempMean - Mean temperature (°C)
 * @param {number} tempMax - Max temperature (°C)
 * @param {number} tempMin - Min temperature (°C)
 * @param {number} [lat=20.0] - Latitude for extraterrestrial radiation approximation
 * @returns {number} ET₀ in mm/day
 */
export function estimateReferenceET0(tempMean, tempMax, tempMin, lat = 20.0) {
  const tDiff = Math.max(1.0, tempMax - tempMin);
  // Extraterrestrial radiation approximation factor based on latitude
  const radFactor = 14.5 + Math.cos((lat * Math.PI) / 180) * 1.5;
  const et0 = 0.0023 * (tempMean + 17.8) * Math.sqrt(tDiff) * (radFactor * 0.408);
  return Math.round(Math.max(1.5, Math.min(9.5, et0)) * 10) / 10;
}

/**
 * Computes comprehensive agricultural water balance
 * @param {object} params
 * @param {string} params.crop - Crop name
 * @param {object} params.stage - Growth stage object
 * @param {object} params.weather - Weather telemetry and forecast
 * @param {object} [params.soil] - Soil telemetry / profile
 * @returns {object} Water balance analysis
 */
export function computeWaterBalance({ crop, stage, weather, soil }) {
  const profile = getCropProfile(crop);
  const kc = stage?.cropCoefficientKc || 0.85;

  const currentTemp = weather?.temperature ?? weather?.temp ?? 25;
  const tempMax = weather?.tempMax ?? weather?.temperatureMax ?? (currentTemp + 5);
  const tempMin = weather?.tempMin ?? weather?.temperatureMin ?? (currentTemp - 5);
  const tempMean = (tempMax + tempMin) / 2;

  // Daily ET₀ (mm/day)
  const dailyEt0 = weather?.et0 || estimateReferenceET0(tempMean, tempMax, tempMin, weather?.lat || 20.0);
  
  // Crop Actual Evapotranspiration ETc = Kc × ET₀
  const dailyEtc = Math.round(dailyEt0 * kc * 10) / 10;

  // Rainfall Telemetry
  const rainfallTodayMm = weather?.rainfallMm ?? weather?.precipitation ?? weather?.rain ?? 0;
  const forecastDaily = weather?.forecastDaily || [];
  
  let forecastRainfall7d = 0;
  let forecastEtc7d = 0;

  if (forecastDaily.length > 0) {
    forecastDaily.slice(0, 7).forEach(day => {
      const dayRain = day.rainfallMm ?? day.rain ?? day.precipitation ?? 0;
      const dayMax = day.tempMax ?? day.temperatureMax ?? tempMax;
      const dayMin = day.tempMin ?? day.temperatureMin ?? tempMin;
      const dayEt0 = estimateReferenceET0((dayMax + dayMin) / 2, dayMax, dayMin);
      forecastRainfall7d += dayRain;
      forecastEtc7d += dayEt0 * kc;
    });
  } else {
    forecastRainfall7d = rainfallTodayMm * 3;
    forecastEtc7d = dailyEtc * 7;
  }

  forecastRainfall7d = Math.round(forecastRainfall7d * 10) / 10;
  forecastEtc7d = Math.round(forecastEtc7d * 10) / 10;

  // Net 7-day balance (Precipitation - Crop ETc)
  const net7dBalanceMm = Math.round((forecastRainfall7d - forecastEtc7d) * 10) / 10;

  // Soil moisture calibration if available
  const soilMoisturePct = soil?.moisture ?? soil?.soilMoisture ?? null;

  // Determine Water Balance Status
  let status = 'balanced';
  if (net7dBalanceMm < -25 || (soilMoisturePct !== null && soilMoisturePct < 22)) {
    status = 'deficit';
  } else if (net7dBalanceMm > 35 || (soilMoisturePct !== null && soilMoisturePct > 75)) {
    status = 'surplus';
  } else if (net7dBalanceMm > 60 || (soilMoisturePct !== null && soilMoisturePct > 85)) {
    status = 'saturated';
  }

  return {
    referenceEt0MmDay: dailyEt0,
    cropCoefficientKc: kc,
    cropEtcMmDay: dailyEtc,
    rainfallTodayMm,
    forecastRainfall7dMm: forecastRainfall7d,
    forecastCropDemand7dMm: forecastEtc7d,
    netBalance7dMm: net7dBalanceMm,
    status,
    soilMoisturePct,
    waterSensitivity: stage?.waterSensitivity || 'medium',
    methodology: 'FAO-56 Dual Kc-ET₀ Water Balance Model'
  };
}
