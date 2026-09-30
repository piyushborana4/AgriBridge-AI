/**
 * AgriBridge AI — Cross-Signal Convergence & Conflict Engine
 * Cross-validates remote sensing, in-situ weather telemetry, soil models, and farmer ground truth observations.
 * 
 * Invariants:
 * 1. Ground truth farmer observations (USER_PROVIDED) have highest provenance priority.
 * 2. NDVI anomalies must be cross-checked against weather and cultural practices before drawing stress conclusions.
 */

/**
 * Cross-validates multi-stream signals
 * @param {object} params
 * @param {object} params.satellite - Satellite NDVI data envelope
 * @param {object} params.weather - Weather telemetry
 * @param {object} params.waterBalance - Water balance output
 * @param {Array} [params.farmerObservations] - Recent observations from Farm Journal
 * @returns {object} Cross-signal convergence analysis
 */
export function evaluateSignalCrossValidation({
  satellite,
  weather,
  waterBalance,
  farmerObservations = []
}) {
  const conflicts = [];
  const convergences = [];
  let groundTruthOverrides = 0;

  const ndvi = satellite?.ndviCurrent ?? satellite?.ndvi ?? null;
  const ndviStatus = satellite?.ndviAnomaly ?? satellite?.status ?? 'NORMAL';
  const isCloudContaminated = satellite?.cloudCoverPct > 35 || satellite?.dataQuality === 'DEGRADED';
  const isWaterDeficit = waterBalance?.status === 'deficit';
  const isWaterSurplus = waterBalance?.status === 'surplus' || waterBalance?.status === 'saturated';

  // Check recent farmer observations
  const recentObservation = farmerObservations.length > 0 ? farmerObservations[0] : null;

  // Case 1: Low NDVI + Severe Water Deficit (Convergence)
  if (ndvi !== null && ndvi < 0.45 && isWaterDeficit) {
    convergences.push({
      type: 'CONVERGENT_DROUGHT_STRESS',
      confidence: 0.90,
      description: 'Satellite vegetation index drop strongly aligns with multi-day moisture deficit and high evapotranspiration demand.'
    });
  }

  // Case 2: Low NDVI + Severe Water Surplus (Convergence on Waterlogging)
  if (ndvi !== null && ndvi < 0.45 && isWaterSurplus) {
    convergences.push({
      type: 'CONVERGENT_WATERLOGGING_STRESS',
      confidence: 0.85,
      description: 'Satellite vegetation reduction aligns with prolonged soil saturation and poor root aeration.'
    });
  }

  // Case 3: Satellite NDVI drop vs Farmer reports "Healthy Vigorous Growth" (Conflict)
  if (recentObservation && (recentObservation.observationType === 'crop_health' || recentObservation.category === 'crop_health')) {
    const isFarmerPositive = /healthy|vigorous|good|green|thriving/i.test(recentObservation.notes || recentObservation.title || '');
    if (isFarmerPositive && ndvi !== null && ndvi < 0.40) {
      conflicts.push({
        type: 'SATELLITE_VS_GROUND_TRUTH_CONFLICT',
        severity: 'high',
        resolution: 'PRIORITIZE_GROUND_TRUTH',
        description: `Satellite shows depressed NDVI (${ndvi}), but verified farmer ground truth reports healthy growth. Possible cause: Cloud shadow contamination (${satellite?.cloudCoverPct || 0}% cloud) or recent inter-row weeding.`,
        authoritativeSource: 'USER_PROVIDED'
      });
      groundTruthOverrides++;
    }
  }

  // Case 4: High Cloud Cover degrading optical satellite reliability
  if (isCloudContaminated && satellite?.isAvailable) {
    conflicts.push({
      type: 'OPTICAL_SATELLITE_DEGRADATION',
      severity: 'moderate',
      resolution: 'DEGRADE_SATELLITE_WEIGHT',
      description: `Satellite pass had ${satellite.cloudCoverPct}% cloud obstruction. Optical NDVI may be falsely depressed. Rely on ground moisture sensors and weather models.`,
      authoritativeSource: 'WEATHER_AND_SOIL_MODELS'
    });
  }

  // Determine convergence status
  let convergenceStatus = 'aligned';
  if (conflicts.length > 0) {
    convergenceStatus = 'conflicted';
  } else if (convergences.length > 0) {
    convergenceStatus = 'strongly_convergent';
  }

  return {
    convergenceStatus,
    conflictsCount: conflicts.length,
    convergencesCount: convergences.length,
    groundTruthOverrides,
    detectedConflicts: conflicts,
    detectedConvergences: convergences,
    synthesizedVerdict: conflicts.length > 0
      ? `Signal discrepancy detected: Ground truth and environmental models prioritized over optical satellite artifacts.`
      : convergences.length > 0
      ? `High-confidence multi-stream convergence confirmed across satellite, weather, and agronomic indicators.`
      : `Telemetry streams are mutually consistent within baseline parameters.`
  };
}
