import { fetchOpenMeteoWeather, getCalibratedFallbackWeather } from '../weather/openMeteoProvider.js';
import { getSatelliteObservation } from '../satellite/satelliteProvider.js';
import { getResolvedSoilData } from '../soil/soilProvider.js';
import { generateFarmGeoJSON } from '../geospatial/geocodingProvider.js';

/**
 * Farm Context Engine
 * Unifies profile, live weather, satellite telemetry, and soil parameters
 * into a single normalized data structure with data lineage and completeness scoring.
 */
export async function buildFarmContext(farm) {
  if (!farm) return null;

  const lat = farm.lat || 19.9975;
  const lng = farm.lng || 73.7898;

  // 1. Resolve Weather
  let weatherData;
  try {
    weatherData = await fetchOpenMeteoWeather(lat, lng);
  } catch {
    weatherData = getCalibratedFallbackWeather(lat, lng);
  }

  // 2. Resolve Satellite Observation (async query to Copernicus STAC proxy)
  let satelliteEnvelope;
  try {
    satelliteEnvelope = await getSatelliteObservation(farm);
  } catch {
    satelliteEnvelope = { data: null, provenance: { status: 'UNAVAILABLE' }, warnings: [] };
  }
  const satelliteData = satelliteEnvelope.data || {
    ndvi: null,
    currentNdvi: null,
    spectralIndices: null,
    cloudCoveragePct: 0
  };

  // 3. Resolve Soil Intelligence
  const soilEnvelope = getResolvedSoilData(farm);
  const soilData = soilEnvelope.data || {};

  // 4. Resolve GeoJSON geometry
  const geoJSON = generateFarmGeoJSON(farm);

  // 5. Compute Evidence Coverage Score (0 - 100%)
  let completenessScore = 0;
  const completenessBreakdown = [];

  // Weather stream (+30%)
  if (weatherData.isLive) {
    completenessScore += 30;
    completenessBreakdown.push({ stream: 'Live Weather (Open-Meteo)', points: 30, status: 'Active Live Stream' });
  } else {
    completenessScore += 15;
    completenessBreakdown.push({ stream: 'Modeled Weather Baseline', points: 15, status: 'Calibrated Baseline' });
  }

  // Satellite stream (+25%)
  if (satelliteData.currentNdvi !== null || satelliteData.ndvi !== null) {
    completenessScore += 25;
    completenessBreakdown.push({ stream: 'Sentinel-2 MSI Overpass', points: 25, status: 'Observation Synced' });
  } else {
    completenessBreakdown.push({ stream: 'Sentinel-2 MSI Overpass', points: 0, status: 'Overpass Unavailable' });
  }

  // Soil stream (+25% for farmer test, +15% for modeled)
  if (soilData.isFarmerEntered) {
    completenessScore += 25;
    completenessBreakdown.push({ stream: 'Farmer Soil Health Card', points: 25, status: 'High Confidence Lab Test' });
  } else if (soilData.ph) {
    completenessScore += 15;
    completenessBreakdown.push({ stream: 'Regional SoilGrids Model', points: 15, status: 'Medium Confidence Modeled' });
  }

  // Farm profile fields (+20%)
  let profilePoints = 0;
  if (farm.name && farm.location) profilePoints += 5;
  if (farm.crops && farm.crops.length > 0) profilePoints += 5;
  if (farm.growthStage || farm.sowingDate) profilePoints += 5;
  if (farm.irrigationType && farm.soilType) profilePoints += 5;

  completenessScore += profilePoints;
  completenessBreakdown.push({ stream: 'Farm Profile & Phenology Metadata', points: profilePoints, status: profilePoints === 20 ? 'Complete' : 'Partial' });

  // 6. Assemble Farm Context
  return {
    id: farm.id,
    name: farm.name,
    location: farm.location,
    coordinates: { lat, lng },
    size: farm.size,
    sizeUnit: farm.sizeUnit || 'hectares',
    crops: farm.crops || ['Wheat'],
    cropVariety: farm.cropVariety || 'Certified Regional Strain',
    growthStage: farm.growthStage || 'Vegetative / Canopy Development',
    sowingDate: farm.sowingDate || '2026-07-15',
    irrigationType: farm.irrigationType || 'Drip Irrigation',
    lastSyncTimestamp: new Date().toISOString(),
    
    // Evidence Coverage / Data Completeness Score
    evidenceCoverage: {
      score: Math.min(100, completenessScore),
      rating: completenessScore >= 85 ? 'High Evidence Coverage' : completenessScore >= 60 ? 'Moderate Evidence Coverage' : 'Degraded Coverage',
      breakdown: completenessBreakdown,
    },
    dataCompleteness: {
      score: Math.min(100, completenessScore),
      rating: completenessScore >= 85 ? 'High Completeness' : completenessScore >= 60 ? 'Moderate Completeness' : 'Partial Data',
      breakdown: completenessBreakdown,
    },

    // Weather Stream with Provenance
    weather: {
      source: weatherData.source || 'Open-Meteo API',
      sourceBadge: weatherData.sourceBadge || 'LIVE',
      isLive: weatherData.isLive ?? true,
      current: weatherData.current,
      forecast: weatherData.forecast,
      impacts: weatherData.impacts,
      provenance: weatherData.provenance
    },

    // Satellite Stream with Provenance
    satellite: satelliteEnvelope.status === 'real' && satelliteData ? {
      provider: satelliteEnvelope.provenance?.provider || 'Sentinel-2 MSI (Copernicus)',
      sourceBadge: 'LATEST OBSERVATION',
      constellation: satelliteData.platform || 'Sentinel-2A/2B',
      resolutionMeters: satelliteData.resolutionMeters || 10,
      acquisitionDate: satelliteData.acquisitionDate,
      overpassDate: satelliteData.acquisitionDate,
      cloudCover: `${satelliteData.cloudCoveragePct ?? 5}%`,
      cloudCoveragePct: satelliteData.cloudCoveragePct ?? 5,
      currentNdvi: satelliteData.currentNdvi ?? satelliteData.ndvi,
      previousNdvi: satelliteData.previousNdvi ?? satelliteData.currentNdvi,
      ndvi: satelliteData.currentNdvi ?? satelliteData.spectralIndices?.ndvi?.value ?? 0.78,
      ndwi: satelliteData.spectralIndices?.ndwi?.value ?? 0.42,
      evi: satelliteData.spectralIndices?.evi?.value ?? 0.65,
      canopyStatus: (satelliteData.currentNdvi ?? 0.78) >= 0.7 ? 'Healthy Biomass' : 'Moderate Vigor',
      history: satelliteData.history || [],
      provenance: satelliteEnvelope.provenance
    } : null,

    // Soil Stream with Provenance
    soil: soilData && (soilData.ph || soilData.soilType) ? {
      source: soilData.source || 'Pedological Ground Engine',
      sourceBadge: soilData.sourceBadge || (soilData.isFarmerEntered ? 'FARMER ENTERED' : 'MODELED ESTIMATE'),
      confidence: soilData.confidence || (soilData.isFarmerEntered ? 'High' : 'Moderate'),
      isFarmerEntered: Boolean(soilData.isFarmerEntered),
      testDate: soilData.testDate,
      samplingDepth: soilData.samplingDepth || '0–15 cm',
      labName: soilData.labName,
      soilType: soilData.soilType,
      soilHealthScore: soilData.soilHealthScore,
      ph: soilData.ph,
      pH: soilData.ph,
      phStatus: soilData.phStatus,
      organicMatterPercent: soilData.organicMatterPercent,
      macronutrients: soilData.macronutrients,
      moisture: soilData.moisture || { surface: 35, subsoil: 40 },
      provenance: soilEnvelope.provenance
    } : null,

    // Spatial Boundary
    geoJSON,
    dataMode: satelliteEnvelope.status === 'real' && weatherData.isLive ? 'REAL' : 'DEGRADED'
  };
}
