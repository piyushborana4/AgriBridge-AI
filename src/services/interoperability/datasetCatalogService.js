/**
 * AgriBridge AI — Agricultural Data Catalog Service (Phase 7)
 * Catalogues standardized datasets across satellite remote sensing, agrometeorology,
 * pedology, and agricultural research benchmarks.
 * 
 * STRICT INVARIANT:
 * Datasets must have honest status labels ('Live' | 'Historical' | 'Imported' | 'Sample' | 'Prototype' | 'Unavailable').
 * Never fabricate live connections for static or sample files.
 * If license terms are unverified, explicitly state 'License information unavailable'.
 */

export const DATASET_STATUS = {
  LIVE: 'Live',
  HISTORICAL: 'Historical',
  IMPORTED: 'Imported',
  SAMPLE: 'Sample',
  PROTOTYPE: 'Prototype',
  UNAVAILABLE: 'Unavailable'
};

const INITIAL_DATASETS = [
  {
    id: 'DS-SENTINEL2-MSI',
    name: 'Copernicus Sentinel-2 Multispectral MSI L2A',
    provider: 'European Space Agency (ESA) / Copernicus Open Access',
    country: 'International / Global Coverage',
    category: 'Earth Observation / Multispectral Satellite',
    coverage: 'Global terrestrial surface (5-day revisit at equator)',
    dateRange: '2015-06 to Present',
    resolution: '10m (VNIR) / 20m (SWIR)',
    variables: ['B02 Blue', 'B03 Green', 'B04 Red', 'B08 NIR', 'B11 SWIR', 'NDVI', 'NDWI', 'EVI', 'SCL Scene Classification'],
    accessLevel: 'Open Public Access',
    freshness: '5-Day Nominal Frequency (Cloud Permitting)',
    license: 'CC-BY-SA 3.0 IGO / Copernicus Open Data Policy',
    status: DATASET_STATUS.LIVE,
    provenance: {
      ingestMethod: 'Copernicus OpenSearch / SentinelHub API',
      calibratedAt: 'On-orbit Level-2A Bottom-of-Atmosphere (BOA)'
    }
  },
  {
    id: 'DS-OPEN-METEO-AGRO',
    name: 'Open-Meteo High-Resolution Agrometeorology Telemetry',
    provider: 'Open-Meteo / ECMWF IFS & DWD ICON',
    country: 'International / Global Gridded',
    category: 'Meteorology & Agrometeorology',
    coverage: 'Global 0.1° (~11km) / Regional HR Models (1-2km)',
    dateRange: '1940 to 16-day forecast',
    resolution: 'Hourly / Daily agrometeorological aggregates',
    variables: ['2m Temperature', 'Relative Humidity', 'Precipitation', 'FAO-56 ET0', 'Soil Moisture 0-7cm', 'Wind Speed 10m'],
    accessLevel: 'Open Non-Commercial / Commercial API',
    freshness: 'Hourly Telemetry / Live Stream',
    license: 'CC-BY 4.0 / ODbL',
    status: DATASET_STATUS.LIVE,
    provenance: {
      ingestMethod: 'Direct REST HTTPS Proxy',
      calibratedAt: 'Continuous hourly assimilation'
    }
  },
  {
    id: 'DS-ISRIC-SOILGRIDS-250M',
    name: 'ISRIC SoilGrids 2.0 Global Pedometric Grids',
    provider: 'ISRIC - World Soil Information',
    country: 'International / Global',
    category: 'Soil Pedology & Digital Soil Mapping',
    coverage: 'Global land surface excluding Antarctica',
    dateRange: 'Baseline 2020 Release',
    resolution: '250m Spatial Grid',
    variables: ['Soil pH (H2O)', 'Organic Carbon Density', 'Sand/Silt/Clay Percentages', 'Bulk Density', 'Cation Exchange Capacity (CEC)'],
    accessLevel: 'Open Data',
    freshness: 'Static Decadal Machine Learning Baseline',
    license: 'CC-BY 4.0',
    status: DATASET_STATUS.IMPORTED,
    provenance: {
      ingestMethod: 'WCS GeoTIFF & SoilGrids REST API',
      calibratedAt: 'ISRIC 2020 Multi-Depth Calibration'
    }
  },
  {
    id: 'DS-ICAR-DOGR-CROP-PHENOLOGY',
    name: 'ICAR-DOGR Onion Phenological Calibration Benchmarks',
    provider: 'ICAR - Directorate of Onion and Garlic Research',
    country: 'India',
    category: 'Agronomic Phenology & GDD Baselines',
    coverage: 'Maharashtra, Madhya Pradesh, Gujarat, Karnataka',
    dateRange: '2018–2024 Research Trials',
    resolution: 'Plot & District Agro-climatic Calibration',
    variables: ['Base Temperature (6°C)', 'Stage Kc Curves (0.50–1.05)', 'Purple Blotch Microclimate Thresholds'],
    accessLevel: 'Published Research Reference',
    freshness: 'Verified Agronomic Standard',
    license: 'ICAR Open Research Publication',
    status: DATASET_STATUS.HISTORICAL,
    provenance: {
      ingestMethod: 'Peer-Reviewed Technical Manuals',
      calibratedAt: 'ICAR-DOGR Rajgurunagar Research Station'
    }
  },
  {
    id: 'DS-EMBRAPA-CERRADO-SOY-SAMPLES',
    name: 'Embrapa Cerrado Soybean Interoperability Sample Telemetry',
    provider: 'Embrapa Soja / Brazil CAR Registry',
    country: 'Brazil',
    category: 'Research Sample Interoperability Telemetry',
    coverage: 'Mato Grosso Pilot Agronomic Parquet',
    dateRange: '2025/2026 Safra Trial Season',
    resolution: 'Field Plot Sample',
    variables: ['Rust Severity Index', 'Soil Clay Loam Retentivity', 'Safrinha Moisture Balance'],
    accessLevel: 'BRICS Research Exchange Sandbox',
    freshness: 'Sample Benchmark File',
    license: 'BRICS Agricultural Research Collaboration MoU',
    status: DATASET_STATUS.SAMPLE,
    provenance: {
      ingestMethod: 'Standardized AgriculturalDataEnvelope Schema v1.2',
      calibratedAt: 'Embrapa Digital Agriculture Lab'
    }
  }
];

const STORAGE_KEY = 'agribridge_dataset_catalog_v1';
let memoryDatasetStore = null;

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

function getStore() {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read dataset catalog from localStorage:', e);
    }
  }

  if (!memoryDatasetStore) {
    memoryDatasetStore = JSON.parse(JSON.stringify(INITIAL_DATASETS));
  }
  return memoryDatasetStore;
}

/**
 * Retrieves datasets from the catalog with optional filters
 * @param {object} [filters]
 * @returns {Array} Matching dataset records
 */
export function getCatalogDatasets(filters = {}) {
  let datasets = getStore();

  if (filters.country) {
    const c = filters.country.toLowerCase();
    datasets = datasets.filter(d => d.country.toLowerCase().includes(c) || d.country.toLowerCase().includes('international'));
  }
  if (filters.category) {
    const cat = filters.category.toLowerCase();
    datasets = datasets.filter(d => d.category.toLowerCase().includes(cat));
  }
  if (filters.status) {
    datasets = datasets.filter(d => d.status === filters.status);
  }

  return datasets;
}

/**
 * Retrieves a single dataset by ID
 * @param {string} id
 * @returns {object|null}
 */
export function getDatasetById(id) {
  const datasets = getStore();
  return datasets.find(d => d.id === id) || null;
}

/**
 * Resets memory store for test runner
 */
export function resetDatasetMemoryStore() {
  memoryDatasetStore = JSON.parse(JSON.stringify(INITIAL_DATASETS));
}
