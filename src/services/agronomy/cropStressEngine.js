/**
 * AgriBridge AI — Unified Crop Stress Engine
 * Synthesizes multi-dimensional agronomic stresses into primary/secondary classifications and compound score.
 */

/**
 * Evaluates unified crop stress
 * @param {object} params
 * @param {object} params.heatStress - From evaluateHeatStress
 * @param {object} params.coldStress - From evaluateColdStress
 * @param {object} params.waterBalance - From computeWaterBalance
 * @param {object} params.soilWater - From evaluateSoilWaterDynamics
 * @param {object} params.diseaseConduciveness - From evaluateDiseaseConduciveness
 * @param {object} params.pestRisk - From evaluatePestRisk
 * @param {object} [params.satellite] - Satellite telemetry (NDVI, anomaly)
 * @returns {object} Synthesized crop stress status
 */
export function evaluateCropStress({
  heatStress,
  coldStress,
  waterBalance,
  soilWater,
  diseaseConduciveness,
  pestRisk,
  satellite
}) {
  const stressFactors = [];

  // 1. Water Stress
  if (waterBalance?.status === 'deficit') {
    stressFactors.push({
      type: 'water_deficit',
      label: 'Root-Zone Moisture Deficit',
      severity: waterBalance.netBalance7dMm < -25 ? 'high' : 'moderate',
      weight: waterBalance.netBalance7dMm < -25 ? 80 : 50,
      description: `Net 7-day deficit of ${Math.abs(waterBalance.netBalance7dMm)} mm with high daily evapotranspiration.`
    });
  } else if (waterBalance?.status === 'saturated' || (waterBalance?.status === 'surplus' && soilWater?.waterloggingVulnerability === 'high')) {
    stressFactors.push({
      type: 'waterlogging',
      label: 'Soil Saturation & Waterlogging Risk',
      severity: 'high',
      weight: 75,
      description: `Excess moisture coupled with ${soilWater?.drainageClass || 'poor'} drainage risks root zone anoxia.`
    });
  }

  // 2. Heat Stress
  if (heatStress?.riskLevel === 'high' || heatStress?.riskLevel === 'critical') {
    stressFactors.push({
      type: 'thermal_heat',
      label: 'Thermal Heat Stress',
      severity: heatStress.riskLevel,
      weight: heatStress.heatStressIndex,
      description: heatStress.physiologicalImpact
    });
  }

  // 3. Cold Stress
  if (coldStress?.riskLevel === 'high' || coldStress?.riskLevel === 'critical') {
    stressFactors.push({
      type: 'cold_frost',
      label: 'Cold / Frost Stress',
      severity: coldStress.riskLevel,
      weight: coldStress.coldStressIndex,
      description: coldStress.physiologicalImpact
    });
  }

  // 4. Disease Pressure
  if (diseaseConduciveness?.overallFavorability === 'high') {
    stressFactors.push({
      type: 'disease_pressure',
      label: 'Microclimatic Disease Conduciveness',
      severity: 'high',
      weight: diseaseConduciveness.diseasePressureIndex * 0.7,
      description: 'Atmospheric conditions favor fungal/bacterial spore proliferation.'
    });
  }

  // 5. Pest Pressure
  if (pestRisk?.overallPressure === 'high') {
    stressFactors.push({
      type: 'pest_pressure',
      label: 'Environmental Pest Escalation Pressure',
      severity: 'moderate',
      weight: pestRisk.pestPressureIndex * 0.6,
      description: 'Temperature and moisture regime favor rapid pest reproductive cycles.'
    });
  }

  // Sort stresses by weight
  stressFactors.sort((a, b) => b.weight - a.weight);

  const primaryStress = stressFactors[0] || {
    type: 'optimal_low_stress',
    label: 'Optimal Conditions (Low Stress)',
    severity: 'low',
    weight: 10,
    description: 'Crop is operating within favorable agro-climatic boundaries.'
  };

  const secondaryStress = stressFactors[1] || null;

  // Compute compound stress score (0 - 100)
  let compoundScore = 0;
  if (stressFactors.length > 0) {
    const maxWeight = stressFactors[0].weight;
    const additionalFactor = stressFactors.slice(1).reduce((acc, s) => acc + (s.weight * 0.2), 0);
    compoundScore = Math.min(100, Math.round(maxWeight + additionalFactor));
  } else {
    compoundScore = 15;
  }

  let overallStressLevel = 'low';
  if (compoundScore >= 70) overallStressLevel = 'critical';
  else if (compoundScore >= 45) overallStressLevel = 'high';
  else if (compoundScore >= 25) overallStressLevel = 'moderate';

  return {
    compoundStressScore: compoundScore,
    overallStressLevel,
    primaryStress,
    secondaryStress,
    activeStressCount: stressFactors.length,
    allStressFactors: stressFactors
  };
}
