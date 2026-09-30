import { getSatelliteObservation, calculateNDVI } from '../data/satellite/satelliteProvider.js';

/**
 * Satellite Service Facade
 */
export function getFieldHealth(farm) {
  if (!farm) return null;
  const observation = getSatelliteObservation(farm);
  return {
    isPrototype: false,
    provider: observation.provider,
    sourceBadge: observation.sourceBadge,
    overallIndex: farm.cropHealth || 85,
    resolutionMeters: 10,
    lastOverpass: observation.overpassDate,
    cloudCover: observation.cloudCover,
    spectralIndices: observation.spectralIndices,
  };
}

export function getVegetationIndex(farm) {
  if (!farm) return null;
  const observation = getSatelliteObservation(farm);
  const ndviInfo = observation.spectralIndices.ndvi;
  return {
    isPrototype: false,
    provider: observation.provider,
    sourceBadge: observation.sourceBadge,
    indexType: ndviInfo.label,
    value: ndviInfo.value,
    status: ndviInfo.status,
    lastOverpass: observation.overpassDate,
  };
}

export function getMoistureEstimate(farm) {
  if (!farm) return null;
  const observation = getSatelliteObservation(farm);
  const ndwiInfo = observation.spectralIndices.ndwi;
  return {
    isPrototype: false,
    indexType: ndwiInfo.label,
    value: ndwiInfo.value,
    moistureCategory: ndwiInfo.status,
  };
}

export function getStressZones(farm) {
  if (!farm) return [];
  const observation = getSatelliteObservation(farm);
  return observation.zones.map(z => ({
    zone: z.name,
    status: z.status,
    stressLevel: z.stressLevel,
    ndvi: z.ndvi,
    areaHectares: z.areaHectares
  }));
}

export function getFullSatelliteData(farm) {
  return getSatelliteObservation(farm);
}

export { calculateNDVI };
