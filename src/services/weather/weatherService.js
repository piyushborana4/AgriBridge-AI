import { fetchOpenMeteoWeather, getCalibratedFallbackWeather } from '../data/weather/openMeteoProvider.js';

/**
 * Unified Weather Service
 * Resolves live Open-Meteo weather based on farm coordinates.
 */
export async function getLiveFarmWeather(farm) {
  if (!farm) {
    return getCalibratedFallbackWeather();
  }

  const lat = farm.lat || 19.9975;
  const lng = farm.lng || 73.7898;

  try {
    return await fetchOpenMeteoWeather(lat, lng);
  } catch (error) {
    console.warn('Weather fetch error, falling back to calibrated baseline:', error);
    return getCalibratedFallbackWeather(lat, lng);
  }
}

export function getCurrentWeather(farmId = 'farm-1', farm = null) {
  if (farm && farm.lat && farm.lng) {
    return getCalibratedFallbackWeather(farm.lat, farm.lng);
  }
  return getCalibratedFallbackWeather();
}

export function getWeatherForecast(farmId = 'farm-1', farm = null) {
  if (farm && farm.lat && farm.lng) {
    return getCalibratedFallbackWeather(farm.lat, farm.lng);
  }
  return getCalibratedFallbackWeather();
}
