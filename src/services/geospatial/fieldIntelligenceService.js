/**
 * AgriBridge AI — Field Management & Spatial Intelligence Engine (Phase 11)
 * Computes field-level agronomic intelligence, individual field risk indices,
 * management zones, and spatial anomaly detection without fake disease diagnoses.
 */

import {
  MANAGEMENT_ZONE_TYPES,
  createField,
  createCropCycle,
  createSpatialAnomaly
} from './geospatialTypes.js';

// In-memory stores
const fieldsStore = new Map();
const cropCyclesStore = new Map();
const spatialAnomaliesStore = new Map();

// Seed initial default fields for mock farms
function seedDefaultFields() {
  if (fieldsStore.size > 0) return;

  const f1Fields = [
    createField({
      fieldId: 'field-1a',
      farmId: 'farm-1',
      name: 'North Plot (Onion Seedlings)',
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.788, 19.996], [73.791, 19.996], [73.791, 19.999], [73.788, 19.999], [73.788, 19.996]]]
      },
      areaHectares: 4.5,
      crop: 'Onion (Allium cepa)',
      variety: 'Bhima Super',
      plantingDate: '2026-08-15',
      status: 'ACTIVE'
    }),
    createField({
      fieldId: 'field-1b',
      farmId: 'farm-1',
      name: 'South Plot (Wheat)',
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.791, 19.994], [73.794, 19.994], [73.794, 19.997], [73.791, 19.997], [73.791, 19.994]]]
      },
      areaHectares: 7.5,
      crop: 'Wheat (Triticum aestivum)',
      variety: 'Lok-1',
      plantingDate: '2026-09-01',
      status: 'ACTIVE'
    })
  ];

  fieldsStore.set('farm-1', f1Fields);

  // Seed Crop Cycles
  cropCyclesStore.set('field-1a', [
    createCropCycle({
      farmId: 'farm-1',
      fieldId: 'field-1a',
      crop: 'Onion',
      variety: 'Bhima Super',
      season: 'Kharif',
      year: 2026,
      sowingDate: '2026-08-15'
    }),
    createCropCycle({
      farmId: 'farm-1',
      fieldId: 'field-1a',
      crop: 'Soybean',
      variety: 'JS-335',
      season: 'Kharif',
      year: 2025,
      sowingDate: '2025-06-20',
      harvestDate: '2025-10-15',
      yieldQuantityTons: 9.8,
      observedYieldStatus: 'RECORDED'
    })
  ]);
}

seedDefaultFields();

/**
 * Lists fields for a given farm
 * @param {string} farmId
 * @returns {Array<object>}
 */
export function listFields(farmId) {
  return fieldsStore.get(farmId) || [];
}

/**
 * Gets a specific field by ID
 * @param {string} farmId
 * @param {string} fieldId
 * @returns {object|null}
 */
export function getField(farmId, fieldId) {
  const fields = listFields(farmId);
  return fields.find(f => f.fieldId === fieldId) || null;
}

/**
 * Registers a new Field
 * @param {object} params
 * @returns {object}
 */
export function registerField(params) {
  const field = createField(params);
  const existing = fieldsStore.get(field.farmId) || [];
  existing.push(field);
  fieldsStore.set(field.farmId, existing);
  return field;
}

/**
 * Lists historical crop cycles for a field
 * @param {string} fieldId
 * @returns {Array<object>}
 */
export function listCropCycles(fieldId) {
  return cropCyclesStore.get(fieldId) || [];
}

/**
 * Records a new Crop Cycle in history
 * @param {object} params
 * @returns {object}
 */
export function recordCropCycle(params) {
  const cycle = createCropCycle(params);
  const existing = cropCyclesStore.get(cycle.fieldId) || [];
  existing.unshift(cycle);
  cropCyclesStore.set(cycle.fieldId, existing);
  return cycle;
}

/**
 * Computes Field-Level Agricultural Intelligence
 * Evaluates field-specific vegetation index, moisture reserves, thermal stress, and growth stages
 * @param {object} field
 * @param {object} farmContext - Weather, soil, satellite data
 * @returns {object} Field Intelligence Envelope
 */
export function calculateFieldIntelligence(field, farmContext = {}) {
  if (!field) throw new Error('calculateFieldIntelligence: field is required');

  const crop = field.crop || 'Field Crop';
  const plantingDate = field.plantingDate ? new Date(field.plantingDate) : null;
  const now = new Date();
  const das = plantingDate ? Math.max(0, Math.floor((now - plantingDate) / (1000 * 60 * 60 * 24))) : null;

  // Determine stage based on DAS
  let stageName = 'Vegetative Growth';
  if (das !== null) {
    if (das < 20) stageName = 'Seedling / Establishment';
    else if (das < 55) stageName = 'Vegetative Development';
    else if (das < 85) stageName = 'Bulb Enlargement / Flowering';
    else stageName = 'Maturation / Pre-Harvest';
  }

  // Derive Field Telemetry
  const weather = farmContext.weather || {};
  const temp = weather.current?.temp || weather.temperature || 28;
  const soilMoisture = farmContext.soil?.moisture || farmContext.soil?.soilMoisture || 48;
  const ndvi = farmContext.satellite?.ndvi || 0.72;

  // Compute Field-Specific Risk Index (0-100)
  let riskScore = 15; // baseline nominal
  const riskDrivers = [];

  if (temp >= 38) {
    riskScore += 35;
    riskDrivers.push(`Extreme thermal stress (${temp}°C)`);
  } else if (temp >= 34) {
    riskScore += 18;
    riskDrivers.push(`Elevated ambient temperature (${temp}°C)`);
  }

  if (soilMoisture < 25) {
    riskScore += 30;
    riskDrivers.push(`Critical root-zone moisture deficit (${soilMoisture}%)`);
  } else if (soilMoisture < 35) {
    riskScore += 15;
    riskDrivers.push(`Low moisture reserve (${soilMoisture}%)`);
  }

  if (ndvi < 0.45) {
    riskScore += 25;
    riskDrivers.push(`Canopy vigor decline (NDVI ${ndvi.toFixed(2)})`);
  }

  const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MODERATE' : 'LOW';

  return {
    fieldId: field.fieldId,
    farmId: field.farmId,
    name: field.name,
    crop,
    variety: field.variety,
    areaHectares: field.areaHectares,
    cropStage: {
      stageName,
      daysAfterSowing: das,
      status: 'ON_TRACK'
    },
    telemetry: {
      ndvi: Number(ndvi.toFixed(2)),
      soilMoisturePercent: Number(soilMoisture),
      temperatureC: Number(temp)
    },
    risk: {
      score: Math.min(100, riskScore),
      level: riskLevel,
      drivers: riskDrivers.length > 0 ? riskDrivers : ['All telemetry parameters within optimal agronomic thresholds']
    },
    managementZones: generateManagementZones(field, ndvi, soilMoisture),
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Generates spatial management zones for a field
 * @param {object} field
 * @param {number} ndvi
 * @param {number} soilMoisture
 * @returns {Array<object>}
 */
export function generateManagementZones(field, ndvi = 0.70, soilMoisture = 50) {
  const zones = [];

  if (ndvi >= 0.65 && soilMoisture >= 40) {
    zones.push({
      zoneId: `${field.fieldId}-zone-optimal`,
      name: 'High Vigor Zone',
      type: MANAGEMENT_ZONE_TYPES.HIGH_VIGOR,
      coveragePercent: 70,
      description: 'Healthy dense canopy with adequate moisture retention.'
    });
    zones.push({
      zoneId: `${field.fieldId}-zone-moderate`,
      name: 'Standard Zone',
      type: MANAGEMENT_ZONE_TYPES.NORMAL,
      coveragePercent: 30,
      description: 'Uniform vegetative development.'
    });
  } else if (ndvi < 0.50 || soilMoisture < 30) {
    zones.push({
      zoneId: `${field.fieldId}-zone-stress`,
      name: 'Canopy & Moisture Stress Zone',
      type: MANAGEMENT_ZONE_TYPES.WATER_STRESS,
      coveragePercent: 45,
      description: 'Localized canopy depression accompanied by lower root-zone moisture.'
    });
    zones.push({
      zoneId: `${field.fieldId}-zone-normal`,
      name: 'Recovering Zone',
      type: MANAGEMENT_ZONE_TYPES.NORMAL,
      coveragePercent: 55,
      description: 'Adequate vegetative coverage under regular schedule.'
    });
  } else {
    zones.push({
      zoneId: `${field.fieldId}-zone-uniform`,
      name: 'Uniform Field Zone',
      type: MANAGEMENT_ZONE_TYPES.NORMAL,
      coveragePercent: 100,
      description: 'Moderate vegetative index across parcel.'
    });
  }

  return zones;
}

/**
 * Detects spatial anomalies within fields
 * Strictly refrains from declaring definitive disease causes from satellite maps alone
 * @param {string} farmId
 * @param {Array<object>} fields
 * @param {object} farmContext
 * @returns {Array<object>}
 */
export function detectSpatialAnomalies(farmId, fields = [], farmContext = {}) {
  const anomalies = [];
  const targetFields = fields.length > 0 ? fields : listFields(farmId);

  targetFields.forEach(field => {
    const intel = calculateFieldIntelligence(field, farmContext);
    if (intel.risk.level === 'HIGH' || intel.telemetry.ndvi < 0.45) {
      const anomaly = createSpatialAnomaly({
        farmId,
        fieldId: field.fieldId,
        anomalyType: intel.telemetry.ndvi < 0.45 ? 'VEGETATION_DECLINE' : 'WATER_DEFICIT',
        severity: intel.risk.level === 'HIGH' ? 'HIGH' : 'MODERATE',
        affectedAreaHectares: Math.round(field.areaHectares * 0.4 * 10) / 10,
        signalDrivers: intel.risk.drivers,
        confidence: 0.82,
        evidence: [
          `Sentinel-2 NDVI: ${intel.telemetry.ndvi}`,
          `Soil Moisture: ${intel.telemetry.soilMoisturePercent}%`,
          'Ground verification recommended before applying chemical intervention'
        ]
      });
      anomalies.push(anomaly);
    }
  });

  spatialAnomaliesStore.set(farmId, anomalies);
  return anomalies;
}

/**
 * Lists spatial anomalies for a farm
 * @param {string} farmId
 * @returns {Array<object>}
 */
export function listSpatialAnomalies(farmId) {
  return spatialAnomaliesStore.get(farmId) || [];
}
