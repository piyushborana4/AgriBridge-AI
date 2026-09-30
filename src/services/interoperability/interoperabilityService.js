/**
 * AgriBridge AI — Master Interoperability Service (Phase 7)
 * Central coordinator managing cross-border data contracts, sovereign farmer consent,
 * knowledge exchange pipelines, model registries, provider abstractions, and offline sync.
 */

export * from './dataContracts.js';
export * from './countryRegistry.js';
export * from './consentService.js';
export * from './privacyService.js';
export * from './knowledgeExchangeService.js';
export * from './modelRegistryService.js';
export * from './datasetCatalogService.js';
export * from './providerRegistry.js';
export * from './dataExchangeService.js';
export * from './syncService.js';
export * from './regionalIntelligenceService.js';

import { listSupportedCountries, getCountryProfile, evaluateCountryContext } from './countryRegistry.js';
import { getFarmConsent, updateFarmConsent, revokeFarmConsent, getConsentAuditLogs } from './consentService.js';
import { getApprovedKnowledge, matchApplicableKnowledge, detectKnowledgeConflicts } from './knowledgeExchangeService.js';
import { getRegisteredModels, getProductionModels } from './modelRegistryService.js';
import { getCatalogDatasets } from './datasetCatalogService.js';
import { getRegisteredProviders } from './providerRegistry.js';
import { executeDataExchange, getExchangeLogs } from './dataExchangeService.js';
import { getSyncStatus } from './syncService.js';

/**
 * Compiles a comprehensive Network Health & Interoperability Summary
 * @returns {object} System health and readiness dashboard data
 */
export function getInteroperabilityOverview() {
  const countries = listSupportedCountries();
  const providers = getRegisteredProviders();
  const approvedKnowledge = getApprovedKnowledge();
  const productionModels = getProductionModels();
  const datasets = getCatalogDatasets();
  const recentExchanges = getExchangeLogs().slice(0, 5);
  const syncStatus = getSyncStatus();

  return {
    networkName: 'AgriBridge Interoperable Agricultural Network',
    interoperabilityReadiness: 'INTEROPERABILITY_READY',
    schemaVersion: '1.2.0',
    complianceStandards: ['ISO/TC 34 (Food Products)', 'OGC SoilML', 'WMO Climatological Exchange', 'BRICS Common Agronomic Schema'],
    countriesSummary: {
      total: countries.length,
      connected: countries.filter(c => c.interoperabilityStatus === 'connected').length,
      configured: countries.filter(c => c.interoperabilityStatus === 'configured').length,
      list: countries
    },
    providersSummary: {
      total: providers.length,
      operational: providers.filter(p => p.status === 'Operational').length,
      configured: providers.filter(p => p.status === 'Configured').length
    },
    knowledgeSummary: {
      totalApprovedEntries: approvedKnowledge.length,
      activeSources: [...new Set(approvedKnowledge.map(k => k.source))].length
    },
    modelsSummary: {
      productionModelsCount: productionModels.length,
      totalRegistered: getRegisteredModels().length
    },
    datasetsSummary: {
      totalCatalogued: datasets.length,
      liveFeeds: datasets.filter(d => d.status === 'Live').length
    },
    syncStatus,
    recentExchanges,
    disclaimer: 'AgriBridge AI is designed for interoperability across BRICS agricultural ecosystems. Live exchange is enabled only with explicitly configured data providers.'
  };
}
