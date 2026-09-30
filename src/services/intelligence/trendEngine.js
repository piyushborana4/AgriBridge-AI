/**
 * Deterministic Trend Engine - AgriBridge AI (Phase 4)
 * Computes exact mathematical delta, percentage change, direction, and rate of change
 * across weather, satellite NDVI, and soil moisture series.
 * (Gemini must NOT be the source of truth for numerical calculations).
 */

/**
 * Calculates trend metrics between two sequential scalar measurements
 */
export function calculateScalarTrend(current, previous, metricName = 'Metric', unit = '') {
  const curr = current !== null && current !== undefined ? Number(current) : NaN;
  const prev = previous !== null && previous !== undefined ? Number(previous) : NaN;

  if (isNaN(curr)) {
    return {
      metric: metricName,
      current: null,
      previous: isNaN(prev) ? null : prev,
      absoluteChange: null,
      percentageChange: null,
      direction: 'unknown',
      rateOfChange: 0,
      unit
    };
  }

  if (isNaN(prev)) {
    return {
      metric: metricName,
      current: curr,
      previous: null,
      absoluteChange: 0,
      percentageChange: 0,
      direction: 'stable',
      rateOfChange: 0,
      unit
    };
  }

  const absoluteChange = parseFloat((curr - prev).toFixed(3));
  const percentageChange = prev !== 0 
    ? parseFloat((((curr - prev) / Math.abs(prev)) * 100).toFixed(2))
    : 0;

  let direction = 'stable';
  if (percentageChange > 1.5) direction = 'increasing';
  else if (percentageChange < -1.5) direction = 'decreasing';

  return {
    metric: metricName,
    current: curr,
    previous: prev,
    absoluteChange,
    percentageChange,
    direction,
    rateOfChange: absoluteChange,
    unit
  };
}

/**
 * Computes comprehensive NDVI vegetation trends across time-series observations
 * Supports both computeNDVITrend(curr, prev) and computeNDVITrend(satelliteData)
 */
export function computeNDVITrend(arg1, arg2) {
  if (typeof arg1 === 'number' || (arg1 !== null && typeof arg1 === 'string' && !isNaN(Number(arg1)))) {
    const curr = Number(arg1);
    const prev = arg2 !== undefined && arg2 !== null ? Number(arg2) : curr;
    return calculateScalarTrend(curr, prev, 'NDVI');
  }

  const satelliteData = arg1 || {};
  const currentNDVI = satelliteData.currentNdvi ?? satelliteData.ndvi ?? 0.78;
  const previousNDVI = arg2 ?? satelliteData.previousNdvi ?? (
    satelliteData.history && satelliteData.history.length > 1
      ? satelliteData.history[satelliteData.history.length - 2].ndvi
      : currentNDVI
  );

  const baseTrend = calculateScalarTrend(currentNDVI, previousNDVI, 'NDVI');

  return {
    ...baseTrend,
    observationCount: satelliteData.history?.length || 1,
    timeWindow: 'Sentinel-2 Multispectral Overpass',
    series: satelliteData.history || [{ month: 'Current', ndvi: currentNDVI }]
  };
}

/**
 * Computes rainfall trends (current 7-day cumulative vs prior/baseline)
 * Supports computeRainfallTrend(curr, prev) and computeRainfallTrend(weatherData)
 */
export function computeRainfallTrend(arg1, arg2) {
  if (typeof arg1 === 'number' || (arg1 !== null && typeof arg1 === 'string' && !isNaN(Number(arg1)))) {
    const curr = Number(arg1);
    const prev = arg2 !== undefined && arg2 !== null ? Number(arg2) : 15.0;
    const trend = calculateScalarTrend(curr, prev, '7-Day Rainfall', 'mm');
    return {
      ...trend,
      current7DaySum: curr,
      baselineSum: prev
    };
  }

  const weatherData = arg1 || {};
  let current7DaySum = weatherData.rainfall7d ?? weatherData.precipitation ?? weatherData.current?.rainfall ?? 0;
  
  if (weatherData.forecast && weatherData.forecast.length > 0) {
    current7DaySum = parseFloat(
      weatherData.forecast.reduce((sum, d) => sum + (Number(d.rain) || 0), 0).toFixed(1)
    );
  }

  const baselineSum = arg2 ?? 15.0;
  const trend = calculateScalarTrend(current7DaySum, baselineSum, '7-Day Rainfall', 'mm');

  return {
    ...trend,
    current7DaySum,
    baselineSum
  };
}

/**
 * Computes temperature trend relative to seasonal average
 */
export function computeTemperatureTrend(arg1, arg2) {
  if (typeof arg1 === 'number' || (arg1 !== null && typeof arg1 === 'string' && !isNaN(Number(arg1)))) {
    const curr = Number(arg1);
    const prev = arg2 !== undefined && arg2 !== null ? Number(arg2) : 28.0;
    return calculateScalarTrend(curr, prev, 'Ambient Temperature', '°C');
  }

  const weatherData = arg1 || {};
  const currentTemp = weatherData.temperature ?? weatherData.tempMax ?? weatherData.current?.temp ?? 28;
  const baselineTemp = arg2 ?? 28;

  return calculateScalarTrend(currentTemp, baselineTemp, 'Ambient Temperature', '°C');
}

/**
 * Computes soil moisture trend
 */
export function computeSoilMoistureTrend(arg1, arg2) {
  if (typeof arg1 === 'number' || (arg1 !== null && typeof arg1 === 'string' && !isNaN(Number(arg1)))) {
    const curr = Number(arg1);
    const prev = arg2 !== undefined && arg2 !== null ? Number(arg2) : 35.0;
    return calculateScalarTrend(curr, prev, 'Soil Moisture', '%');
  }

  const soilOrWeather = arg1 || {};
  const currentMoisture = soilOrWeather.moisture?.surface ?? soilOrWeather.surface ?? soilOrWeather.current?.soilMoisture ?? 35;
  const baselineMoisture = arg2 ?? 35.0;

  return calculateScalarTrend(currentMoisture, baselineMoisture, 'Soil Moisture', '%');
}
