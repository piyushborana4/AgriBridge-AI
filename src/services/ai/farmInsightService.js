import { getHealthLabel } from '../../utils/helpers';

/**
 * Generates unified, reusable agronomic insights for any farm parcel.
 * Powers Dashboard, Crop Health, AI Advisory, and Alerting.
 */
export function getFarmInsights(farm, weather, alertsList = []) {
  if (!farm) return null;

  const cropHealth = farm.cropHealth || 85;
  const soilHealth = farm.soilHealth || 75;
  const temp = weather?.current?.temp || 30;
  const rainNext3Days = (weather?.forecast?.slice(0, 3) || []).reduce((acc, d) => acc + (d.rain || 0), 0);

  // Irrigation intelligence
  let irrigationRecommendation = 'Maintain calibrated morning drip cycle (45 mins).';
  if (rainNext3Days > 15) {
    irrigationRecommendation = `Significant precipitation (${rainNext3Days}mm) forecast. Reduce irrigation by 50% to prevent root saturation.`;
  } else if (temp > 35) {
    irrigationRecommendation = 'High heat index anticipated. Supplement with light afternoon canopy misting.';
  }

  // Crop stress evaluation
  const bioticRisk = cropHealth < 75 ? 'Elevated' : cropHealth < 85 ? 'Moderate' : 'Low';
  const soilStatus = soilHealth >= 80 ? 'Optimal' : soilHealth >= 70 ? 'Satisfactory' : 'Needs Organic Amendment';

  // Key factors available for explainability
  const explainabilityFactors = [
    { name: 'Weather Forecast', active: true, value: `${temp}°C, ${weather?.current?.condition || 'Sunny'}` },
    { name: 'Soil Chemistry', active: true, value: `pH ${farm.soilPH || 6.8}, OM ${farm.organicMatter || 3.0}%` },
    { name: 'Crop Phenology', active: true, value: (farm.crops || []).join(', ') },
    { name: 'Canopy Index', active: true, value: `${cropHealth}% (${getHealthLabel(cropHealth)})` },
    { name: 'Active Alerts', active: alertsList.length > 0, value: `${alertsList.length} notices` },
  ];

  return {
    farmId: farm.id,
    farmName: farm.name,
    cropHealthLabel: getHealthLabel(cropHealth),
    soilHealthLabel: soilStatus,
    irrigationRecommendation,
    bioticRisk,
    explainabilityFactors,
    generatedAt: new Date().toISOString(),
  };
}
