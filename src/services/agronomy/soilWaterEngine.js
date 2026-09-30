/**
 * AgriBridge AI — Soil Water Interaction Engine
 * Evaluates available water capacity (AWC), drainage characteristics, waterlogging vs drought vulnerability based on texture and organic matter.
 */

const TEXTURE_PROFILES = {
  sand: { awcMmPerM: 65, drainage: 'excessive', infiltrationRate: 'rapid', waterloggingRisk: 'very_low', droughtRisk: 'high' },
  loamy_sand: { awcMmPerM: 90, drainage: 'somewhat_excessive', infiltrationRate: 'rapid', waterloggingRisk: 'low', droughtRisk: 'high' },
  sandy_loam: { awcMmPerM: 120, drainage: 'well_drained', infiltrationRate: 'moderate_rapid', waterloggingRisk: 'low', droughtRisk: 'moderate' },
  loam: { awcMmPerM: 160, drainage: 'well_drained', infiltrationRate: 'moderate', waterloggingRisk: 'moderate', droughtRisk: 'low' },
  silt_loam: { awcMmPerM: 190, drainage: 'well_drained', infiltrationRate: 'moderate', waterloggingRisk: 'moderate', droughtRisk: 'low' },
  clay_loam: { awcMmPerM: 175, drainage: 'moderately_well_drained', infiltrationRate: 'slow_moderate', waterloggingRisk: 'moderate_high', droughtRisk: 'low' },
  clay: { awcMmPerM: 150, drainage: 'poor', infiltrationRate: 'slow', waterloggingRisk: 'high', droughtRisk: 'moderate' },
  heavy_clay: { awcMmPerM: 130, drainage: 'very_poor', infiltrationRate: 'very_slow', waterloggingRisk: 'very_high', droughtRisk: 'low' }
};

/**
 * Normalizes soil texture string to known profile key
 */
function normalizeTexture(textureStr) {
  if (!textureStr || typeof textureStr !== 'string') return 'loam';
  const t = textureStr.toLowerCase().replace(/[\s-]/g, '_');
  if (t.includes('sandy_loam')) return 'sandy_loam';
  if (t.includes('clay_loam')) return 'clay_loam';
  if (t.includes('silt_loam')) return 'silt_loam';
  if (t.includes('heavy_clay') || t.includes('black_cotton')) return 'heavy_clay';
  if (t.includes('clay')) return 'clay';
  if (t.includes('sand')) return 'sand';
  if (t.includes('silt')) return 'silt_loam';
  return 'loam';
}

/**
 * Evaluates Soil-Water dynamics
 * @param {object} params
 * @param {object} params.soil - Soil data envelope
 * @param {object} params.stage - Current growth stage
 * @returns {object} Soil-water interaction profile
 */
export function evaluateSoilWaterDynamics({ soil, stage }) {
  const rawTexture = soil?.texture || soil?.soilType || 'Loam';
  const textureKey = normalizeTexture(rawTexture);
  const profile = TEXTURE_PROFILES[textureKey] || TEXTURE_PROFILES.loam;

  const rootDepthM = (stage?.rootDepthCm || 40) / 100;
  const organicCarbonPct = soil?.organicCarbon ?? soil?.organicMatter ?? 0.6;

  // Organic matter increases AWC by approx 3.7% per 1% OC
  const omBonusFactor = 1 + (Math.max(0, organicCarbonPct - 0.5) * 0.05);
  const rootZoneAwcMm = Math.round(profile.awcMmPerM * rootDepthM * omBonusFactor * 10) / 10;

  return {
    soilTexture: rawTexture,
    drainageClass: profile.drainage,
    infiltrationRate: profile.infiltrationRate,
    rootZoneAvailableWaterCapacityMm: rootZoneAwcMm,
    waterloggingVulnerability: profile.waterloggingRisk,
    droughtVulnerability: profile.droughtRisk,
    organicMatterBuffering: organicCarbonPct >= 0.75 ? 'adequate' : 'low_depleted',
    agronomicNote: `Soil texture (${rawTexture}) has ${profile.drainage} drainage with approximately ${rootZoneAwcMm} mm available water capacity in the active ${stage?.rootDepthCm || 40} cm root zone.`
  };
}
