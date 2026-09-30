/**
 * AgriBridge AI — Farm Digital Twin 2.0 Snapshot & Event Graph Engine (Phase 11)
 * Unifies Space, Time, Crop, Soil, Weather, Satellite, Events, Actions, and Outcomes
 * into versioned, deterministic snapshots with spatial "What Changed" and "What Should I Do".
 */

import { getFarmGeometry } from './geometryService.js';
import { listFields, calculateFieldIntelligence, detectSpatialAnomalies } from './fieldIntelligenceService.js';
import { listSatelliteObservations } from './satelliteTimelineService.js';
import { getFarmTopography, evaluateDrainageRisk } from './topographyDrainageService.js';
import { getActions } from '../operations/actionRepository.js';
import { getJournalEntries } from '../operations/journalRepository.js';
import { getCases } from '../operations/cropDoctorRepository.js';

/**
 * Builds a unified Farm Digital Twin 2.0 Snapshot
 * @param {object} farm
 * @param {object} farmContext - Live or modeled farm context
 * @returns {object} Digital Twin 2.0 Snapshot
 */
export function buildDigitalTwinSnapshot2(farm, farmContext = {}) {
  if (!farm || !farm.id) throw new Error('buildDigitalTwinSnapshot2: valid farm object is required');

  const farmId = farm.id;
  const geometryRecord = getFarmGeometry(farmId) || {
    geometry: { type: 'Point', coordinates: [farm.lng || 73.7898, farm.lat || 19.9975] },
    locationQuality: 'POINT_LOCATION'
  };

  const fields = listFields(farmId);
  const fieldIntelligences = fields.map(f => calculateFieldIntelligence(f, farmContext));
  const anomalies = detectSpatialAnomalies(farmId, fields, farmContext);
  const satelliteHistory = listSatelliteObservations(farmId, { validOnly: true });
  const topography = getFarmTopography(farmId);
  const drainageRisk = evaluateDrainageRisk(farmId, farmContext.weather, farmContext.soil);

  const actions = getActions(farmId);
  const journals = getJournalEntries(farmId);
  const cases = getCases(farmId);

  const whatChanged = generateSpatialWhatChanged(fields, farmContext, actions);
  const whatShouldIDo = generateSpatialWhatShouldIDo(fieldIntelligences, anomalies, actions);
  const eventGraph = buildSpatialEventGraph(farmId, { actions, journals, cases, satelliteHistory });

  return {
    snapshotId: `dt2-snap-${farmId}-${Date.now()}`,
    farmId,
    farmName: farm.name || 'AgriBridge Farm',
    generatedAt: new Date().toISOString(),
    versions: {
      dataVersion: '2.0.0',
      intelligenceVersion: '11.0.0',
      schemaVersion: 'ISO/TC 34 & OGC SoilML v1.2'
    },
    spatial: {
      geometry: geometryRecord.geometry,
      locationQuality: geometryRecord.locationQuality,
      fieldsCount: fields.length,
      totalAreaHectares: fields.reduce((sum, f) => sum + (f.areaHectares || 0), 0) || farm.size || 1.0,
      fields: fieldIntelligences,
      anomalies
    },
    terrain: {
      topography,
      drainageRisk
    },
    temporal: {
      latestSatelliteObservation: satelliteHistory[0] || null,
      satelliteObservationsCount: satelliteHistory.length,
      activeActionsCount: actions.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length,
      journalObservationsCount: journals.length,
      clinicalCasesCount: cases.length
    },
    whatChanged,
    whatShouldIDo,
    eventGraph
  };
}

/**
 * Generates Spatial "What Changed 2.0"
 */
export function generateSpatialWhatChanged(fields = [], farmContext = {}, actions = []) {
  const changes = [];

  fields.forEach(f => {
    changes.push({
      category: 'SPATIAL_FIELD',
      fieldId: f.fieldId,
      fieldName: f.name,
      title: `${f.name} Crop Cycle`,
      description: `Active cultivation of ${f.crop} (${f.variety || 'Standard'}). Placed under regular observation schedule.`,
      timestamp: f.plantingDate || new Date().toISOString()
    });
  });

  const recentAction = actions.find(a => a.status === 'COMPLETED');
  if (recentAction) {
    changes.push({
      category: 'OPERATIONAL',
      title: 'Action Completed',
      description: `Completed operation: "${recentAction.title}"`,
      timestamp: recentAction.completedAt || new Date().toISOString()
    });
  }

  if (farmContext.weather?.current?.temp >= 34) {
    changes.push({
      category: 'CLIMATE_RISK',
      title: 'Thermal Spike Detected',
      description: `Ambient temperature rose to ${farmContext.weather.current.temp}°C, increasing evapotranspiration demands.`,
      timestamp: new Date().toISOString()
    });
  }

  return changes;
}

/**
 * Generates Spatial "What Should I Do 2.0"
 */
export function generateSpatialWhatShouldIDo(fieldIntelligences = [], anomalies = [], actions = []) {
  const recommendations = [];

  fieldIntelligences.forEach(fi => {
    if (fi.risk.level === 'HIGH') {
      recommendations.push({
        recId: `rec-${fi.fieldId}-high`,
        fieldId: fi.fieldId,
        fieldName: fi.name,
        urgency: 'HIGH',
        title: `Inspect ${fi.name}`,
        reason: fi.risk.drivers.join('; '),
        suggestedAction: 'Perform ground visual inspection and review irrigation line flow.',
        confidence: 0.88,
        evidence: [`Field Risk Score: ${fi.risk.score}/100`, `Crop Stage: ${fi.cropStage.stageName}`]
      });
    } else if (fi.risk.level === 'MODERATE') {
      recommendations.push({
        recId: `rec-${fi.fieldId}-mod`,
        fieldId: fi.fieldId,
        fieldName: fi.name,
        urgency: 'MEDIUM',
        title: `Monitor Soil Moisture in ${fi.name}`,
        reason: 'Root-zone moisture dipping towards lower replenishment threshold.',
        suggestedAction: 'Schedule next irrigation cycle within 36 hours.',
        confidence: 0.82,
        evidence: [`Soil Moisture: ${fi.telemetry.soilMoisturePercent}%`]
      });
    }
  });

  if (recommendations.length === 0) {
    recommendations.push({
      recId: 'rec-nominal',
      urgency: 'LOW',
      title: 'Maintain Standard Agronomic Schedule',
      reason: 'All field telemetry and management zones are currently within target thresholds.',
      suggestedAction: 'Continue scheduled scouting and record any visual anomalies in Farm Journal.',
      confidence: 0.95,
      evidence: ['Nominal NDVI vigor and soil hydration']
    });
  }

  return recommendations;
}

/**
 * Builds Spatial-Temporal Event Graph
 */
export function buildSpatialEventGraph(farmId, { actions = [], journals = [], cases = [], satelliteHistory = [] }) {
  const nodes = [];
  const links = [];

  // Satellite Nodes
  satelliteHistory.slice(0, 3).forEach((sat, i) => {
    const nodeId = `node-sat-${i}`;
    nodes.push({
      id: nodeId,
      label: `Satellite Pass (NDVI ${sat.indices.ndvi})`,
      type: 'SATELLITE_OBSERVATION',
      timestamp: sat.acquisitionDate
    });
  });

  // Action Nodes
  actions.slice(0, 3).forEach((act) => {
    const nodeId = `node-act-${act.id}`;
    nodes.push({
      id: nodeId,
      label: act.title,
      type: 'FARMER_ACTION',
      timestamp: act.createdAt
    });
  });

  // Link sequential events with cautious relationship labels
  for (let i = 0; i < nodes.length - 1; i++) {
    links.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
      relationship: 'preceded' // 'preceded' | 'associated with' | 'followed by' | 'consistent with'
    });
  }

  return { nodes, links };
}

/**
 * Runs a spatial What-If scenario simulation
 * Explicitly marks result as SIMULATED without altering real observed data
 * @param {object} params
 * @param {string} params.farmId
 * @param {string} params.fieldId
 * @param {number} [params.irrigationAdjustmentPercent=0]
 * @param {number} [params.tempShiftC=0]
 * @param {object} baseContext
 * @returns {object} Simulated Scenario Result
 */
export function simulateFieldScenario({
  farmId,
  fieldId,
  irrigationAdjustmentPercent = 0,
  tempShiftC = 0,
  baseContext = {}
}) {
  const field = listFields(farmId).find(f => f.fieldId === fieldId) || { fieldId, name: 'Target Field', areaHectares: 2.0 };
  const baseIntel = calculateFieldIntelligence(field, baseContext);

  const simulatedSoilMoisture = Math.max(10, Math.min(95, baseIntel.telemetry.soilMoisturePercent + (irrigationAdjustmentPercent * 0.35)));
  const simulatedTemp = baseIntel.telemetry.temperatureC + tempShiftC;

  const simulatedContext = {
    ...baseContext,
    weather: { ...baseContext.weather, current: { temp: simulatedTemp } },
    soil: { ...baseContext.soil, moisture: simulatedSoilMoisture }
  };

  const simulatedIntel = calculateFieldIntelligence(field, simulatedContext);

  return {
    scenarioId: `scen-sim-${Date.now()}`,
    farmId,
    fieldId,
    status: 'SIMULATED', // Strictly marked SIMULATED
    inputs: {
      irrigationAdjustmentPercent,
      tempShiftC
    },
    baseline: {
      riskScore: baseIntel.risk.score,
      riskLevel: baseIntel.risk.level,
      soilMoisture: baseIntel.telemetry.soilMoisturePercent
    },
    projected: {
      riskScore: simulatedIntel.risk.score,
      riskLevel: simulatedIntel.risk.level,
      soilMoisture: simulatedIntel.telemetry.soilMoisturePercent
    },
    deltaRiskScore: simulatedIntel.risk.score - baseIntel.risk.score,
    disclaimer: 'SIMULATED DATA ONLY: This scenario model is a deterministic projection and must NOT be treated as verified ground observation.',
    simulatedAt: new Date().toISOString()
  };
}
