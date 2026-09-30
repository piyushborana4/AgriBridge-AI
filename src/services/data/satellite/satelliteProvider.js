/**
 * Satellite & Earth Observation Data Provider - AgriBridge AI (Phase 4.5)
 * Communicates with Copernicus Sentinel-2 STAC backend proxy.
 * Strictly adheres to real satellite overpasses, genuine acquisition dates, and cloud cover filtering.
 * Never synthesizes fake NDVI from health scores.
 */

import { createProvenance, createDataEnvelope, DataStatus, SourceType, QualityLevel, FreshnessStatus } from '../provenanceTypes.js';
import { evaluateFreshness } from '../dataFreshnessEngine.js';

/**
 * Retrieves genuine Sentinel-2 satellite observation for a farm parcel.
 * @param {Object} farm - Farm object with lat, lng, and optional boundary
 * @param {Object} options - lookbackDays, maxCloudCover
 * @returns {Promise<Object>} DataEnvelope<SatelliteObservation>
 */
export async function getSatelliteObservation(farm, options = {}) {
  if (!farm || !farm.lat || !farm.lng) {
    return createDataEnvelope({
      data: null,
      provenance: createProvenance({
        sourceType: SourceType.SATELLITE,
        provider: 'Copernicus Data Space Ecosystem (CDSE)',
        status: DataStatus.UNAVAILABLE,
        isSynthetic: false,
        isFallback: false,
        notes: 'Missing farm geospatial coordinates.'
      }),
      quality: { completeness: 0, reliability: 0, freshness: 0, overall: 0 },
      warnings: ['Farm coordinates required for Copernicus Sentinel-2 overpass indexing.']
    });
  }

  const lat = farm.lat;
  const lng = farm.lng;
  const maxCloud = options.maxCloudCover ?? 30;

  try {
    const response = await fetch(`/api/satellite?lat=${lat}&lng=${lng}&maxCloud=${maxCloud}`);
    if (response.ok) {
      const envelope = await response.json();
      if (envelope.status === 'real' && envelope.data) {
        const satData = envelope.data;
        const freshness = evaluateFreshness(satData.acquisitionDate, 'satellite');

        return createDataEnvelope({
          data: {
            currentNdvi: satData.currentNdvi,
            previousNdvi: satData.previousNdvi,
            spectralIndices: satData.spectralIndices || {
              ndvi: { value: satData.currentNdvi, label: 'NDVI (Normalized Difference Vegetation Index)' }
            },
            acquisitionDate: satData.acquisitionDate,
            cloudCoveragePct: satData.cloudCoveragePct,
            resolutionMeters: satData.resolutionMeters || 10,
            productId: satData.productId,
            platform: satData.platform || 'Sentinel-2A/2B',
            history: satData.history || []
          },
          provenance: createProvenance({
            sourceType: SourceType.SATELLITE,
            provider: 'Copernicus Data Space Ecosystem (CDSE)',
            dataset: 'Sentinel-2 Level-2A (Bottom-of-Atmosphere)',
            observedAt: envelope.provenance?.observedAt || satData.acquisitionDate,
            retrievedAt: envelope.provenance?.retrievedAt || new Date().toISOString(),
            location: { latitude: lat, longitude: lng },
            spatialResolution: 10,
            temporalResolution: '5-Day Revisit',
            quality: satData.cloudCoveragePct <= 10 ? QualityLevel.HIGH : QualityLevel.MEDIUM,
            confidence: satData.cloudCoveragePct <= 10 ? 95 : 80,
            status: DataStatus.REAL,
            isSynthetic: false,
            isFallback: false,
            freshnessStatus: freshness.status,
            sourceUrl: 'https://dataspace.copernicus.eu/',
            methodology: 'Normalized Sentinel-2 MSI BOA Surface Reflectance [(B08-B04)/(B08+B04)]'
          }),
          quality: {
            completeness: 100,
            reliability: satData.cloudCoveragePct <= 10 ? 95 : 80,
            freshness: freshness.freshnessScore,
            overall: satData.cloudCoveragePct <= 10 ? 95 : 82
          },
          warnings: envelope.warnings || []
        });
      }
    }
  } catch (err) {
    console.warn('[SatelliteProvider] Remote satellite fetch notice:', err.message);
  }

  // Graceful degradation when satellite observation is unavailable
  return createDataEnvelope({
    data: null,
    provenance: createProvenance({
      sourceType: SourceType.SATELLITE,
      provider: 'Copernicus Data Space Ecosystem (CDSE)',
      status: DataStatus.UNAVAILABLE,
      isSynthetic: false,
      isFallback: false,
      notes: 'No valid cloud-free Sentinel-2 overpass found in recent window. Continuing with ground & meteorological telemetry.'
    }),
    quality: { completeness: 0, reliability: 0, freshness: 0, overall: 0 },
    warnings: ['Satellite pass temporarily unavailable for this coordinate grid.']
  });
}
