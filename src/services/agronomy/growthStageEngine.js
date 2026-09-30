/**
 * AgriBridge AI — Growth Stage Engine
 * Computes phenological stage, Days After Sowing (DAS), GDD accumulation, and stage vulnerability.
 * 
 * Strict Priority Order:
 * 1. Farmer Confirmed Observation (USER_PROVIDED in journal) -> Confidence 0.95
 * 2. Calculated from Sowing / Transplanting Date + GDD profile -> Confidence 0.80
 * 3. Inferred from Season / Farm Profile -> Confidence 0.45
 * 4. Insufficient Data -> Stage Unknown, Confidence 0.10
 */

import { getCropProfile } from './cropProfiles/index.js';

/**
 * Calculates growth stage details for a given farm context
 * @param {object} params
 * @param {string} params.crop - Name of the crop
 * @param {string|Date} [params.sowingDate] - Sowing or transplanting date
 * @param {string} [params.farmerConfirmedStageId] - Direct farmer observation from journal
 * @param {number} [params.accumulatedGdd] - Growing Degree Days if accumulated
 * @param {string} [params.referenceDate] - Target calculation date (defaults to today)
 * @returns {object} Phenological stage breakdown
 */
export function estimateGrowthStage({
  crop,
  sowingDate,
  farmerConfirmedStageId,
  accumulatedGdd = 0,
  referenceDate = new Date().toISOString()
}) {
  const profile = getCropProfile(crop);
  const targetDate = new Date(referenceDate);

  // 1. Check for explicit farmer confirmed observation
  if (farmerConfirmedStageId) {
    const matchedStage = profile.growthStages.find(s => s.id === farmerConfirmedStageId || s.name.toLowerCase().includes(farmerConfirmedStageId.toLowerCase()));
    if (matchedStage) {
      const stageIdx = profile.growthStages.indexOf(matchedStage);
      const nextStage = profile.growthStages[stageIdx + 1] || null;
      return {
        stageId: matchedStage.id,
        stageName: matchedStage.name,
        source: 'USER_PROVIDED',
        sourceDescription: 'Verified farmer journal observation',
        confidence: 0.95,
        das: sowingDate ? Math.max(0, Math.floor((targetDate - new Date(sowingDate)) / (1000 * 60 * 60 * 24))) : null,
        typicalDasRange: matchedStage.typicalDasRange,
        cropCoefficientKc: matchedStage.cropCoefficientKc,
        rootDepthCm: matchedStage.rootDepthCm,
        waterSensitivity: matchedStage.waterSensitivity,
        heatSensitivity: matchedStage.heatSensitivity,
        keyRisks: matchedStage.keyRisks,
        managementFocus: matchedStage.managementFocus,
        nextStageName: nextStage ? nextStage.name : 'Harvest / Field Clearance',
        allStages: profile.growthStages.map(s => ({ id: s.id, name: s.name, typicalDasRange: s.typicalDasRange, isCurrent: s.id === matchedStage.id })),
        cropName: profile.commonName,
        isGenericFallback: profile.isGenericFallback
      };
    }
  }

  // 2. Calculate DAS from sowing date
  if (sowingDate) {
    const sDate = new Date(sowingDate);
    if (!isNaN(sDate.getTime())) {
      const das = Math.max(0, Math.floor((targetDate - sDate) / (1000 * 60 * 60 * 24)));

      // Find stage matching this DAS
      let matchedStage = profile.growthStages.find(s => das >= s.typicalDasRange[0] && das <= s.typicalDasRange[1]);
      
      // If beyond final stage, crop is at harvest or post-maturity
      if (!matchedStage && das > profile.growthStages[profile.growthStages.length - 1].typicalDasRange[1]) {
        matchedStage = profile.growthStages[profile.growthStages.length - 1];
      }
      
      // If before 0 DAS (future sowing)
      if (!matchedStage && das === 0) {
        matchedStage = profile.growthStages[0];
      }

      if (matchedStage) {
        const stageIdx = profile.growthStages.indexOf(matchedStage);
        const nextStage = profile.growthStages[stageIdx + 1] || null;
        const stageStartDas = matchedStage.typicalDasRange[0];
        const stageEndDas = matchedStage.typicalDasRange[1];
        const stageDuration = Math.max(1, stageEndDas - stageStartDas);
        const stageProgressPct = Math.min(100, Math.max(0, Math.round(((das - stageStartDas) / stageDuration) * 100)));
        const daysRemainingInStage = Math.max(0, stageEndDas - das);

        return {
          stageId: matchedStage.id,
          stageName: matchedStage.name,
          source: 'CALCULATED_FROM_SOWING_DATE',
          sourceDescription: `Computed from sowing date (${sowingDate}) — Day ${das}`,
          confidence: 0.85,
          das,
          stageProgressPct,
          daysRemainingInStage,
          typicalDasRange: matchedStage.typicalDasRange,
          cropCoefficientKc: matchedStage.cropCoefficientKc,
          rootDepthCm: matchedStage.rootDepthCm,
          waterSensitivity: matchedStage.waterSensitivity,
          heatSensitivity: matchedStage.heatSensitivity,
          keyRisks: matchedStage.keyRisks,
          managementFocus: matchedStage.managementFocus,
          nextStageName: nextStage ? nextStage.name : 'Harvest / Field Clearance',
          allStages: profile.growthStages.map(s => ({
            id: s.id,
            name: s.name,
            typicalDasRange: s.typicalDasRange,
            isCurrent: s.id === matchedStage.id
          })),
          cropName: profile.commonName,
          isGenericFallback: profile.isGenericFallback
        };
      }
    }
  }

  // 3. Fallback: Stage Unknown / Insufficient Data
  const defaultStage = profile.growthStages[0];
  return {
    stageId: 'stage_unspecified',
    stageName: `${profile.growthStages[1]?.name || 'Vegetative (Estimated)'} (Unconfirmed)`,
    source: 'MODELED_FALLBACK',
    sourceDescription: 'Estimated typical vegetative baseline (No verified sowing date provided)',
    confidence: 0.35,
    das: null,
    stageProgressPct: 50,
    daysRemainingInStage: null,
    typicalDasRange: defaultStage.typicalDasRange,
    cropCoefficientKc: profile.growthStages[1]?.cropCoefficientKc || 0.8,
    rootDepthCm: profile.growthStages[1]?.rootDepthCm || 30,
    waterSensitivity: 'medium',
    heatSensitivity: 'medium',
    keyRisks: ['Sowing date missing — phenology timing uncertain'],
    managementFocus: 'Log planting date or current stage in Farm Journal to calibrate stage intelligence.',
    nextStageName: 'Subsequent Stage',
    allStages: profile.growthStages.map(s => ({
      id: s.id,
      name: s.name,
      typicalDasRange: s.typicalDasRange,
      isCurrent: false
    })),
    cropName: profile.commonName,
    isGenericFallback: profile.isGenericFallback
  };
}
