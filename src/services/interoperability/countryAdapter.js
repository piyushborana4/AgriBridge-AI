/**
 * BRICS Technical Country Adapters
 * Software integration interfaces converting canonical schema into national research/telemetry standards.
 */

export const COUNTRY_ADAPTERS = {
  India: {
    country: 'India',
    adapterName: 'AgriStack & ICAR Digital Standard Adapter',
    protocol: 'REST / GeoJSON-v2',
    status: 'Operational',
    badgeVariant: 'success',
    transform: (canonical) => ({
      nationalId: `IND-AGR-${canonical?.parcel?.parcelId || '001'}`,
      shcParameters: {
        soilHealthCardReference: canonical?.soilPedology?.dataSource,
        soilReactionPH: canonical?.soilPedology?.phValue,
        nitrogenKgHa: (canonical?.soilPedology?.nitrogenMgKg * 2.24).toFixed(1),
        phosphorusKgHa: (canonical?.soilPedology?.phosphorusMgKg * 2.29).toFixed(1),
        potashKgHa: (canonical?.soilPedology?.potassiumMgKg * 1.20).toFixed(1),
      },
      imdWeatherGrid: {
        temp: canonical?.meteorology?.temperatureCelsius,
        rainfall: canonical?.meteorology?.precipitationMm
      }
    })
  },
  Brazil: {
    country: 'Brazil',
    adapterName: 'Embrapa / SICAR Georeferencing Adapter',
    protocol: 'CAR GeoJSON / ISO 19115',
    status: 'Operational',
    badgeVariant: 'success',
    transform: (canonical) => ({
      carRegistryCode: `BR-SP-PARCEL-${canonical?.parcel?.parcelId || '001'}`,
      tropicalCanopyNDVI: canonical?.earthObservation?.ndviValue,
      soloLatossoloPH: canonical?.soilPedology?.phValue,
      precipitacaoMm: canonical?.meteorology?.precipitationMm
    })
  },
  Russia: {
    country: 'Russia',
    adapterName: 'Rosstat & AgroClimatic Cereal Grid Adapter',
    protocol: 'OpenGIS / WFS-2.0',
    status: 'Ready for Telemetry',
    badgeVariant: 'info',
    transform: (canonical) => ({
      cadastralZone: `RU-KRD-${canonical?.parcel?.parcelId || '001'}`,
      soilChernozemIndex: canonical?.soilPedology?.organicMatterPct,
      frostDegreeDays: 0,
      cerealVigor: canonical?.earthObservation?.ndviValue
    })
  },
  China: {
    country: 'China',
    adapterName: 'CAS Intelligent Agriculture Platform Adapter',
    protocol: 'GB/T 20091-2006 / JSON-RPC',
    status: 'Operational',
    badgeVariant: 'success',
    transform: (canonical) => ({
      fieldPlotIdentifier: `CN-AGRI-${canonical?.parcel?.parcelId || '001'}`,
      spectralCanopyIndex: canonical?.earthObservation?.ndviValue,
      soilNutrientBalance: canonical?.soilPedology?.nitrogenMgKg,
      evapotranspirationET0: canonical?.meteorology?.et0MmDay
    })
  },
  SouthAfrica: {
    country: 'South Africa',
    adapterName: 'ARC Dryland Agro-Ecological Adapter',
    protocol: 'OGC SensorThings / REST',
    status: 'Pilot Interfacing',
    badgeVariant: 'warning',
    transform: (canonical) => ({
      arcPlotId: `ZA-FS-${canonical?.parcel?.parcelId || '001'}`,
      semiAridMoistureIndex: canonical?.earthObservation?.ndwiValue,
      soilDegradationRisk: canonical?.soilPedology?.organicMatterPct < 2.5 ? 'Moderate' : 'Low'
    })
  }
};
