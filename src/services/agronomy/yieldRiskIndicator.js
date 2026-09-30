/**
 * AgriBridge AI — Yield Risk Indicator
 * Qualitative phenological yield concern evaluation.
 * 
 * STRICT ANTI-FABRICATION INVARIANT:
 * Never emit fabricated quantitative yield numbers (e.g. "Yield will be 4.2 tons/ha").
 * Provide honest categorical concern levels: 'low_concern' | 'moderate_concern' | 'high_concern' | 'insufficient_data'.
 */

/**
 * Evaluates yield risk concern
 * @param {object} params
 * @param {object} params.stage - Current growth stage
 * @param {object} params.cropStress - Output from evaluateCropStress
 * @param {object} params.waterBalance - Output from computeWaterBalance
 * @param {object} params.heatStress - Output from evaluateHeatStress
 * @returns {object} Yield concern assessment
 */
export function evaluateYieldRisk({ stage, cropStress, waterBalance, heatStress }) {
  // If stage is completely unknown
  if (!stage || stage.stageId === 'stage_unspecified' || stage.confidence < 0.2) {
    return {
      yieldRiskLevel: 'insufficient_data',
      concernScore: null,
      isQuantitativeYieldEstimated: false,
      primaryConcernDrivers: ['Growth stage or planting date unconfirmed.'],
      agronomicImpactAnalysis: 'Yield sensitivity cannot be reliably determined without confirmed crop phenology.',
      protectiveInterventions: ['Record planting/sowing date in Farm Settings or Journal to activate yield protection models.']
    };
  }

  const isSensitiveStage = stage.waterSensitivity === 'critical' || stage.heatSensitivity === 'critical';
  const stressScore = cropStress?.compoundStressScore || 0;

  let yieldRiskLevel = 'low_concern';
  const concernDrivers = [];

  if (stressScore >= 65 && isSensitiveStage) {
    yieldRiskLevel = 'high_concern';
    concernDrivers.push(`High compound stress (${stressScore}/100) coinciding with critical yield-determining stage: ${stage.stageName}.`);
  } else if (stressScore >= 40 || (stressScore >= 30 && isSensitiveStage)) {
    yieldRiskLevel = 'moderate_concern';
    concernDrivers.push(`Moderate stress detected during ${stage.stageName}.`);
  }

  if (waterBalance?.status === 'deficit' && stage.waterSensitivity === 'critical') {
    concernDrivers.push(`Soil moisture deficit during ${stage.stageName} directly threatens reproductive sinks or sizing.`);
  }

  if (heatStress?.heatStressIndex >= 50 && stage.heatSensitivity === 'critical') {
    concernDrivers.push(`Elevated temperatures (${heatStress.maxObservedForecastTempC}°C) may impair flower pollination or grain filling.`);
  }

  let agronomicImpactAnalysis = 'Crop phenology and environmental conditions indicate minimal yield penalty under current management.';
  if (yieldRiskLevel === 'high_concern') {
    agronomicImpactAnalysis = `Compound stresses during ${stage.stageName} represent a substantial risk to final harvest volume and quality if left unmitigated.`;
  } else if (yieldRiskLevel === 'moderate_concern') {
    agronomicImpactAnalysis = `Sub-optimal moisture or thermal conditions may cause minor yield drag without timely intervention.`;
  }

  return {
    yieldRiskLevel,
    isQuantitativeYieldEstimated: false, // Strict safety invariant
    primaryConcernDrivers: concernDrivers.length > 0 ? concernDrivers : ['Environmental parameters are supportive of standard crop potential.'],
    agronomicImpactAnalysis,
    protectiveInterventions: yieldRiskLevel !== 'low_concern' ? [
      'Prioritize root-zone irrigation during current critical phenological stage.',
      'Deploy foliar anti-transpirants or stress-mitigating organic biostimulants if thermal stress persists.',
      'Scout for foliar symptoms and monitor soil moisture at 15 cm depth.'
    ] : [
      'Maintain standard agronomic schedule and weed-free canopy.'
    ]
  };
}
