/**
 * AgriBridge AI - Intelligence Constants & Thresholds
 * Configurable engineering heuristics and risk weights (NOT universal agronomic absolutes).
 */

export const INTELLIGENCE_PROMPT_VERSION = '4.0.0';

// NDVI Vegetation Anomaly Thresholds (Percentage decline from baseline/previous)
export const NDVI_ANOMALY_THRESHOLDS = {
  STABLE_OR_IMPROVING: 0,
  SLIGHT_DECLINE: 0.05,       // 0% - 5% decline: normal/watch
  MODERATE_DECLINE: 0.10,     // 5% - 10% decline: watch
  SIGNIFICANT_DECLINE: 0.20,  // 10% - 20% decline: attention
  CRITICAL_DECLINE: 0.20,     // > 20% decline: rapid decline / anomaly
};

// Weather Extremes & Agronomic Risk Thresholds
export const WEATHER_RISK_THRESHOLDS = {
  HEAT_STRESS_CELSIUS: 35,
  EXTREME_HEAT_CELSIUS: 40,
  COLD_STRESS_CELSIUS: 10,
  FROST_RISK_CELSIUS: 4,
  HEAVY_RAIN_MM_DAY: 35,
  EXCESSIVE_RAIN_MM_DAY: 65,
  HIGH_ET0_MM_DAY: 5.5,
  LOW_ET0_MM_DAY: 2.5,
  HIGH_HUMIDITY_PERCENT: 75,
  OPTIMAL_HUMIDITY_MIN: 40,
  OPTIMAL_HUMIDITY_MAX: 70,
  HIGH_WIND_KMH: 20,
};

// Soil Moisture & Chemistry Thresholds
export const SOIL_THRESHOLDS = {
  DEFICIT_MOISTURE_PCT: 25,
  LOW_MOISTURE_PCT: 35,
  EXCESS_MOISTURE_PCT: 85,
  OPTIMAL_PH_MIN: 6.2,
  OPTIMAL_PH_MAX: 7.5,
  LOW_ORGANIC_MATTER_PCT: 2.0,
  OPTIMAL_ORGANIC_MATTER_PCT: 3.0,
  LOW_NITROGEN_MGKG: 180,
  OPTIMAL_NITROGEN_MGKG: 240,
  LOW_PHOSPHORUS_MGKG: 20,
  OPTIMAL_PHOSPHORUS_MGKG: 35,
  LOW_POTASSIUM_MGKG: 140,
  OPTIMAL_POTASSIUM_MGKG: 180,
};

// Farm-Level Risk Aggregation Category Weights (Sum = 1.0)
export const RISK_CATEGORY_WEIGHTS = {
  water: 0.30,        // 30% - Water deficit / irrigation
  vegetation: 0.25,   // 25% - Canopy vigor & NDVI
  weather: 0.20,      // 20% - Precipitation / temperature anomalies
  disease: 0.15,      // 15% - Foliar pathology observations & microclimate risk
  soil: 0.10,         // 10% - Soil chemistry / organic carbon baseline
};

// Data Freshness Maximum Age Thresholds (Hours)
export const FRESHNESS_HOURS = {
  WEATHER_FRESH: 3,
  WEATHER_STALE: 24,
  SATELLITE_FRESH: 120, // 5 days (Sentinel-2 cycle)
  SATELLITE_STALE: 360, // 15 days
  SOIL_LAB_FRESH: 2160, // 90 days
  SOIL_LAB_STALE: 8760, // 1 year
};

// Growth Stage Sensitivity Multipliers
export const GROWTH_STAGE_SENSITIVITY = {
  'Germination / Seedling': { water: 1.3, heat: 1.2, disease: 1.1 },
  'Early Vegetative': { water: 1.0, heat: 1.0, disease: 1.0 },
  'Vegetative / Canopy Development': { water: 1.1, heat: 1.0, disease: 1.2 },
  'Flowering / Tasseling': { water: 1.5, heat: 1.4, disease: 1.3 }, // Critical sensitive stage
  'Grain Filling / Pod Development': { water: 1.4, heat: 1.3, disease: 1.1 },
  'Maturity / Pre-Harvest': { water: 0.7, heat: 0.9, disease: 1.0, rain: 1.5 },
  'Default': { water: 1.0, heat: 1.0, disease: 1.0 }
};
