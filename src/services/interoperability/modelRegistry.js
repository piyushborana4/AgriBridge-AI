import { aiModels } from '../../data/mockData';

/**
 * AI Model Registry Service
 * Tracks model versions, purpose, inputs/outputs, deployment status, and data provenance.
 */
export function getRegisteredModels() {
  return aiModels.map(model => ({
    ...model,
    isOperational: model.status === 'Active',
    provenanceBadge: model.dataProvenance.includes('PlantVillage') ? 'Curated Agronomic Dataset' : 'Regional Sensor Data'
  }));
}

export function getModelById(modelId) {
  return getRegisteredModels().find(m => m.id === modelId) || null;
}
