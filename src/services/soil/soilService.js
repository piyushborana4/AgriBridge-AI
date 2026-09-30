import { getResolvedSoilData, getSoilHistory, getSoilRecommendations } from '../data/soil/soilProvider.js';

export function getSoilProfile(farm) {
  if (!farm) return null;
  return getResolvedSoilData(farm);
}

export { getSoilHistory, getSoilRecommendations };
