/**
 * BRICS Common Agricultural Data Interchange Schema (Standard v1.2)
 * Technical software specification for cross-border agronomic telemetry exchange.
 */

export const BRICS_AGRI_SCHEMA_SPEC = {
  version: '1.2.0',
  standardName: 'BRICS-AgriData Canonical Interchange',
  domains: ['FieldGeometry', 'WeatherObservation', 'MultispectralSatellite', 'SoilPedology', 'CropPhenology'],
  supportedNations: ['India', 'Brazil', 'Russia', 'China', 'South Africa'],
  complianceLevel: 'ISO/TC 34 / OGC SoilML Aligned'
};

/**
 * Transforms a normalized FarmContext into the canonical BRICS interchange format
 */
export function exportToBRICSSchema(farmContext) {
  if (!farmContext) return null;

  return {
    schemaVersion: BRICS_AGRI_SCHEMA_SPEC.version,
    senderSystem: 'AgriBridge AI Core Engine',
    timestampUtc: new Date().toISOString(),
    parcel: {
      parcelId: farmContext.id,
      parcelName: farmContext.name,
      locationDescriptor: farmContext.location,
      geoCoordinates: {
        latitude: farmContext.coordinates.lat,
        longitude: farmContext.coordinates.lng,
        datum: 'WGS84'
      },
      extentHectares: farmContext.size,
      geometryGeoJson: farmContext.geoJSON?.geometry || null
    },
    agronomy: {
      primaryCrops: farmContext.crops,
      varietyStrain: farmContext.cropVariety,
      phenologicalStage: farmContext.growthStage,
      sowingDate: farmContext.sowingDate,
      irrigationMethod: farmContext.irrigationType
    },
    earthObservation: {
      provider: farmContext.satellite?.provider,
      observationTimestamp: farmContext.satellite?.overpassDate,
      ndviValue: farmContext.satellite?.ndvi,
      ndwiValue: farmContext.satellite?.ndwi,
      cloudCoveragePercent: farmContext.satellite?.cloudCover
    },
    soilPedology: {
      dataSource: farmContext.soil?.source,
      dataConfidence: farmContext.soil?.confidence,
      classification: farmContext.soil?.soilType,
      phValue: farmContext.soil?.ph,
      organicMatterPct: farmContext.soil?.organicMatterPercent,
      nitrogenMgKg: farmContext.soil?.macronutrients?.nitrogen?.value,
      phosphorusMgKg: farmContext.soil?.macronutrients?.phosphorus?.value,
      potassiumMgKg: farmContext.soil?.macronutrients?.potassium?.value,
    },
    meteorology: {
      temperatureCelsius: farmContext.weather?.current?.temp,
      relativeHumidityPct: farmContext.weather?.current?.humidity,
      precipitationMm: farmContext.weather?.current?.rainfall,
      et0MmDay: farmContext.weather?.current?.et0,
      windSpeedKmH: farmContext.weather?.current?.windSpeed
    }
  };
}
