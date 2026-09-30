/**
 * AgriBridge AI — Central Agronomic Context Engine
 * Orchestrates all domain-specific agronomic intelligence engines into a unified, deterministic agronomic context envelope.
 */

import { getCropProfile } from './cropProfiles/index.js';
import { estimateGrowthStage } from './growthStageEngine.js';
import { evaluateHeatStress } from './heatStressEngine.js';
import { evaluateColdStress } from './coldStressEngine.js';
import { computeWaterBalance } from './waterBalanceEngine.js';
import { evaluateIrrigationDecision } from './irrigationIntelligenceEngine.js';
import { evaluateRainfallRisks } from './rainfallRiskEngine.js';
import { evaluateSoilWaterDynamics } from './soilWaterEngine.js';
import { evaluateDiseaseConduciveness } from './diseaseConducivenessEngine.js';
import { evaluatePestRisk } from './pestRiskEngine.js';
import { evaluateCropStress } from './cropStressEngine.js';
import { evaluateSignalCrossValidation } from './crossSignalEngine.js';
import { evaluateClimateRisks } from './climateRiskEngine.js';
import { evaluateAgronomicOpportunities } from './agronomicOpportunityEngine.js';
import { evaluateYieldRisk } from './yieldRiskIndicator.js';
import { getAgronomicCitations } from './agronomicKnowledgeModel.js';

/**
 * Builds the complete Agronomic Context Envelope
 * @param {object} params
 * @param {object} params.farm - Farm details (name, crop, sowingDate, area, etc.)
 * @param {object} params.weather - Meteorological telemetry envelope
 * @param {object} params.soil - Soil data envelope
 * @param {object} params.satellite - Satellite NDVI data envelope
 * @param {Array} [params.farmerObservations] - Journal ground truth observations
 * @param {Array} [params.cropDoctorCases] - Clinical plant pathology cases
 * @returns {object} Full AgronomicContextEnvelope
 */
export function buildAgronomicContext({
  farm = {},
  weather = {},
  soil = {},
  satellite = {},
  farmerObservations = [],
  cropDoctorCases = []
}) {
  const cropName = farm.crop || farm.cropType || 'Onion';
  const sowingDate = farm.sowingDate || farm.plantingDate || null;
  const farmerConfirmedStageId = farm.growthStage || farm.currentStage || null;

  // 1. Crop Profile
  const cropProfile = getCropProfile(cropName);

  // 2. Growth Stage
  const growthStage = estimateGrowthStage({
    crop: cropName,
    sowingDate,
    farmerConfirmedStageId
  });

  // 3. Thermal Stresses
  const heatStress = evaluateHeatStress({
    crop: cropName,
    stage: growthStage,
    weather
  });

  const coldStress = evaluateColdStress({
    crop: cropName,
    stage: growthStage,
    weather
  });

  // 4. Hydrological & Soil Dynamics
  const waterBalance = computeWaterBalance({
    crop: cropName,
    stage: growthStage,
    weather,
    soil
  });

  const soilWaterDynamics = evaluateSoilWaterDynamics({
    soil,
    stage: growthStage
  });

  const rainfallRisks = evaluateRainfallRisks({
    weather,
    stage: growthStage
  });

  const irrigationDecision = evaluateIrrigationDecision({
    waterBalance,
    stage: growthStage,
    soil,
    weather
  });

  // 5. Biotic Risks (Pathology & Entomology)
  const diseaseConduciveness = evaluateDiseaseConduciveness({
    crop: cropName,
    stage: growthStage,
    weather
  });

  const pestRisk = evaluatePestRisk({
    crop: cropName,
    stage: growthStage,
    weather
  });

  // 6. Unified Stress Classification
  const cropStress = evaluateCropStress({
    heatStress,
    coldStress,
    waterBalance,
    soilWater: soilWaterDynamics,
    diseaseConduciveness,
    pestRisk,
    satellite
  });

  // 7. Multi-Stream Signal Convergence & Conflict Detection
  const crossSignal = evaluateSignalCrossValidation({
    satellite,
    weather,
    waterBalance,
    farmerObservations
  });

  // 8. Climate Risks & Early Warning Horizons
  const climateRisks = evaluateClimateRisks({
    weather,
    heatStress,
    coldStress,
    rainfallRisks,
    stage: growthStage
  });

  // 9. Field Opportunities & Operations
  const opportunities = evaluateAgronomicOpportunities({
    weather,
    stage: growthStage,
    waterBalance
  });

  // 10. Qualitative Yield Risk
  const yieldRisk = evaluateYieldRisk({
    stage: growthStage,
    cropStress,
    waterBalance,
    heatStress
  });

  // 11. Citations
  const citations = getAgronomicCitations(cropName);

  return {
    farmId: farm.id || 'farm_default',
    crop: cropName,
    cropProfile: {
      cropId: cropProfile.cropId,
      commonName: cropProfile.commonName,
      botanicalName: cropProfile.botanicalName,
      category: cropProfile.category,
      referenceSources: cropProfile.referenceSources,
      isGenericFallback: cropProfile.isGenericFallback
    },
    growthStage,
    heatStress,
    coldStress,
    waterBalance,
    soilWaterDynamics,
    rainfallRisks,
    irrigationDecision,
    diseaseConduciveness,
    pestRisk,
    cropStress,
    crossSignal,
    climateRisks,
    opportunities,
    yieldRisk,
    citations,
    generatedAt: new Date().toISOString()
  };
}
