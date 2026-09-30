import { NDVI_ANOMALY_THRESHOLDS, WEATHER_RISK_THRESHOLDS, SOIL_THRESHOLDS } from './intelligenceConstants.js';

/**
 * Deterministic Anomaly Detection Engine
 * Evaluates telemetry deviations against agricultural baseline thresholds.
 * 
 * CRITICAL AGRONOMIC SAFETY RULE:
 * NDVI decline != disease confirmed.
 * Satellite vegetation decline is always classified as "Vegetation Stress"
 * or "Canopy Vigor Anomaly", never as an unvalidated disease conclusion.
 */

export function detectVegetationAnomalies(farmContextOrTrend, ndviTrendOpt) {
  const anomalies = [];
  const ndviTrend = ndviTrendOpt || (farmContextOrTrend?.percentageChange !== undefined ? farmContextOrTrend : null);

  if (!ndviTrend || ndviTrend.current === null) {
    return anomalies;
  }

  const changePct = ndviTrend.percentageChange;
  const currentNdvi = ndviTrend.current;

  if (changePct <= -20) {
    anomalies.push({
      id: 'anomaly-ndvi-rapid',
      category: 'vegetation',
      type: 'vegetation_stress',
      severity: 'critical',
      metric: 'NDVI Vegetation Index',
      status: 'rapid_decline',
      changePct,
      currentNdvi,
      description: `Rapid vegetation stress detected: canopy vigor dropped by ${Math.abs(changePct).toFixed(1)}% vs previous observation.`,
      requiresInspection: true,
      safetyNote: 'Vegetation stress detected. Could indicate water deficit, nutrient leaching, or environmental stress. On-field ground scouting advised before any chemical intervention.'
    });
  } else if (changePct <= -10) {
    anomalies.push({
      id: 'anomaly-ndvi-moderate',
      category: 'vegetation',
      type: 'vegetation_stress',
      severity: 'high',
      metric: 'NDVI Vegetation Index',
      status: 'declining',
      changePct,
      currentNdvi,
      description: `Moderate canopy biomass reduction (${Math.abs(changePct).toFixed(1)}%) detected across field parcel.`,
      requiresInspection: true,
      safetyNote: 'Vegetation stress detected. Ground inspection recommended.'
    });
  } else if (changePct <= -5) {
    anomalies.push({
      id: 'anomaly-ndvi-slight',
      category: 'vegetation',
      type: 'vegetation_stress',
      severity: 'moderate',
      metric: 'NDVI Vegetation Index',
      status: 'watch',
      changePct,
      currentNdvi,
      description: `Minor vegetation variation (-${Math.abs(changePct).toFixed(1)}%) within standard seasonal canopy margin.`,
      requiresInspection: false,
      safetyNote: 'Standard physiological variation.'
    });
  }

  return anomalies;
}

export function detectWeatherAnomalies(farmContext) {
  const anomalies = [];
  if (!farmContext || !farmContext.weather) return anomalies;

  const weather = farmContext.weather;
  const temp = weather.temperature ?? weather.tempMax ?? weather.current?.temp;
  const rain = weather.rainfall7d ?? weather.precipitation ?? weather.current?.rainfall ?? 0;
  const humidity = weather.humidity ?? weather.current?.humidity;

  // 1. Extreme Heat Anomaly
  if (temp !== undefined && temp >= WEATHER_RISK_THRESHOLDS.EXTREME_HEAT_CELSIUS) {
    anomalies.push({
      id: 'anomaly-weather-extreme-heat',
      category: 'weather',
      type: 'thermal_stress',
      severity: 'critical',
      metric: 'Ambient Temperature',
      status: 'critical',
      value: `${temp}°C`,
      description: `Extreme temperature spike (${temp}°C) exceeds critical physiological threshold (40°C).`,
      impact: 'Severe midday stomatal shutdown and flower drop risk.'
    });
  } else if (temp !== undefined && temp >= WEATHER_RISK_THRESHOLDS.HEAT_STRESS_CELSIUS) {
    anomalies.push({
      id: 'anomaly-weather-heat',
      category: 'weather',
      type: 'thermal_stress',
      severity: 'high',
      metric: 'Ambient Temperature',
      status: 'watch',
      value: `${temp}°C`,
      description: `Elevated ambient heat (${temp}°C) increases crop water demand.`,
      impact: 'Elevated evapotranspiration rate.'
    });
  }

  // 2. Heavy Rainfall Anomaly
  if (rain >= WEATHER_RISK_THRESHOLDS.HEAVY_RAIN_MM_DAY || rain >= 60) {
    anomalies.push({
      id: 'anomaly-weather-heavy-rain',
      category: 'weather',
      type: 'heavy_rainfall',
      severity: 'high',
      metric: 'Cumulative Precipitation',
      status: 'watch',
      value: `${rain} mm`,
      description: `High accumulated precipitation (${rain} mm) recorded.`,
      impact: 'Elevated waterlogging and root zone hypoxia risk.'
    });
  }

  // 3. High Humidity & Disease Conduciveness
  if (humidity !== undefined && humidity >= WEATHER_RISK_THRESHOLDS.HIGH_HUMIDITY_PERCENT) {
    anomalies.push({
      id: 'anomaly-weather-conducive-humidity',
      category: 'weather',
      type: 'disease_conducive_environment',
      severity: 'moderate',
      metric: 'Relative Humidity',
      status: 'watch',
      value: `${humidity}%`,
      description: `Atmospheric humidity (${humidity}%) creates extended foliar wetness periods.`,
      impact: 'Microclimate conducive to fungal spore germination.'
    });
  }

  return anomalies;
}

export function detectSoilAnomalies(farmContext) {
  const anomalies = [];
  if (!farmContext || !farmContext.soil) return anomalies;

  const soil = farmContext.soil;
  const moisture = soil.moisture?.surface ?? soil.moisture ?? farmContext.weather?.current?.soilMoisture;

  // Moisture depletion
  if (moisture !== undefined && moisture < SOIL_THRESHOLDS.DEFICIT_MOISTURE_PCT) {
    anomalies.push({
      id: 'anomaly-soil-moisture-deficit',
      category: 'soil',
      type: 'soil_moisture_deficit',
      severity: 'high',
      metric: 'Root-Zone Soil Moisture',
      status: 'declining',
      value: `${moisture}%`,
      description: `Root-zone soil moisture (${moisture}%) dropped below wilting threshold (25%).`,
      impact: 'Immediate crop water stress.'
    });
  } else if (moisture !== undefined && moisture > 80) {
    anomalies.push({
      id: 'anomaly-soil-saturation',
      category: 'soil',
      type: 'soil_saturation',
      severity: 'high',
      metric: 'Soil Moisture Saturation',
      status: 'critical',
      value: `${moisture}%`,
      description: `Soil moisture saturation (${moisture}%) observed.`,
      impact: 'Risk of standing water and root asphyxiation.'
    });
  }

  // Soil pH
  const ph = soil.pH ?? soil.ph;
  if (ph !== undefined && ph < SOIL_THRESHOLDS.OPTIMAL_PH_MIN) {
    anomalies.push({
      id: 'anomaly-soil-ph-acidic',
      category: 'soil',
      type: 'soil_reaction',
      severity: 'moderate',
      metric: 'Soil Reaction (pH)',
      status: 'watch',
      value: `${ph}`,
      description: `Acidic soil reaction (pH ${ph}) restricts phosphorus bioavailability.`,
      impact: 'Nutrient lockout.'
    });
  } else if (ph !== undefined && ph > SOIL_THRESHOLDS.OPTIMAL_PH_MAX) {
    anomalies.push({
      id: 'anomaly-soil-ph-alkaline',
      category: 'soil',
      type: 'soil_reaction',
      severity: 'moderate',
      metric: 'Soil Reaction (pH)',
      status: 'watch',
      value: `${ph}`,
      description: `Alkaline soil reaction (pH ${ph}) restricts micronutrient uptake.`,
      impact: 'Interveinal chlorosis risk.'
    });
  }

  return anomalies;
}
