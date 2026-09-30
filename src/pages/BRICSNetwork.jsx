import React, { useState, useEffect } from 'react';
import { 
  Globe, Users, TrendingUp, BookOpen, Handshake, ChevronDown, 
  ChevronUp, AlertCircle, ExternalLink, Code2, Database, ShieldCheck, 
  Layers, Download, CheckCircle2, RefreshCw, ArrowRightLeft, FileText,
  Lock, Eye, Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import Modal from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { 
  listSupportedCountries, 
  getCatalogDatasets, 
  getExchangeLogs, 
  getInteroperabilityOverview,
  exportToBRICSSchema,
  BRICS_AGRI_SCHEMA_SPEC
} from '../services/interoperability/interoperabilityService';
import { listKnowledgePacks } from '../services/stakeholders/stakeholderGateway';
import { buildFarmContext } from '../services/data/farmContext/farmContextService';

const BRICSNetwork = () => {
  const { selectedFarm } = useApp();
  const [activeTab, setActiveTab] = useState('countries'); // 'countries' | 'catalog' | 'dpg' | 'exchanges' | 'architecture'
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [schemaJson, setSchemaJson] = useState('');
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    setOverview(getInteroperabilityOverview());
  }, []);

  const countries = listSupportedCountries();
  const datasets = getCatalogDatasets();
  const exchangeLogs = getExchangeLogs();

  const handleExportSchema = async () => {
    if (!selectedFarm) return;
    const ctx = await buildFarmContext(selectedFarm);
    const canonical = exportToBRICSSchema(ctx);
    setSchemaJson(JSON.stringify(canonical, null, 2));
    setShowSchemaModal(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'connected': return 'success';
      case 'configured': return 'info';
      case 'prototype': return 'warning';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary-600" />
              BRICS Agricultural Interoperability Network
            </h1>
            <Badge variant="primary" className="text-[10px]">Standard v1.2</Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
            Common agronomic data schemas, country telemetry adapters, and sovereign data exchange pipelines supporting multilateral agricultural cooperation.
          </p>
        </div>

        <Button onClick={handleExportSchema} size="sm" className="flex items-center gap-1.5 text-xs">
          <Code2 className="w-3.5 h-3.5" /> Export Canonical Schema
        </Button>
      </div>

      {/* Standards & Readiness Banner */}
      <div className="flex items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl text-indigo-950 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Readiness Standard:</strong> {BRICS_AGRI_SCHEMA_SPEC.standardName} (ISO/TC 34 &amp; OGC SoilML Aligned)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
            India: Live Connected
          </span>
          <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
            4 Nations: Configured
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('countries')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'countries'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Member Nation Adapters
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Agricultural Data Catalog ({datasets.length})
        </button>
        <button
          onClick={() => setActiveTab('dpg')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'dpg'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> DPG Knowledge Packs
        </button>
        <button
          onClick={() => setActiveTab('exchanges')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'exchanges'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> Data Exchange Pipeline &amp; Logs
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'architecture'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Network Architecture &amp; Data Flow
        </button>
      </div>

      {/* Tab 1: Member Nation Adapters */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => (
              <Card key={country.code} className="hover:border-primary-300 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span>{country.name}</span>
                        <span className="text-xs text-gray-500 font-mono font-normal">({country.iso3})</span>
                      </h4>
                      <p className="text-xs text-primary-700 font-medium">{country.region}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(country.interoperabilityStatus)} className="text-[10px] uppercase">
                      {country.statusBadge}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1 text-xs">
                    <div className="text-[11px] text-gray-600">
                      <strong>Units:</strong> {country.units?.temperature}, {country.units?.area}, {country.units?.rainfall}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      <strong>Languages:</strong> {country.supportedLanguages?.join(', ').toUpperCase()}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      <strong>Data Feeds:</strong> {country.dataProvidersCount} Registered Providers
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
                    {country.interoperabilityStatus === 'connected' ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live agrometeorology &amp; soil test pipeline operational.
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        Canonical JSON schema adapter configured; ready for telemetry exchange.
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Truth-in-Data Invariant:</strong> Status labels reflect verified technical integration readiness. Unconnected partner agencies are never falsely displayed as live.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Agricultural Data Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="hover:border-primary-300 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{dataset.name}</CardTitle>
                    <Badge variant={dataset.status === 'Live' ? 'success' : dataset.status === 'Sample' ? 'warning' : 'outline'} className="text-[10px]">
                      {dataset.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{dataset.provider}</p>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-gray-700">
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">Coverage</span>
                      <span className="font-medium text-gray-800">{dataset.coverage}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Resolution</span>
                      <span className="font-medium text-gray-800">{dataset.resolution}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Freshness</span>
                      <span className="font-medium text-gray-800">{dataset.freshness}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">License</span>
                      <span className="font-medium text-gray-800 truncate block" title={dataset.license}>{dataset.license}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-gray-700 block mb-1">Key Variables</span>
                    <div className="flex flex-wrap gap-1">
                      {dataset.variables?.slice(0, 5).map((v, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-mono">
                          {v}
                        </span>
                      ))}
                      {dataset.variables?.length > 5 && (
                        <span className="text-[10px] text-gray-500 self-center">+{dataset.variables.length - 5} more</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Digital Public Good Knowledge Packs */}
      {activeTab === 'dpg' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Federated Digital Public Good (DPG) Knowledge Packs</h3>
            <span className="text-xs text-gray-500 font-mono">Open Access &bull; Verifiable Provenance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listKnowledgePacks().map((pack) => (
              <Card key={pack.packId} className="hover:border-primary-300 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{pack.title}</h4>
                      <p className="text-xs text-primary-700 font-medium">{pack.crop} &bull; {pack.region}</p>
                    </div>
                    <Badge variant="success" className="text-[10px] uppercase">
                      {pack.trustLevel}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {pack.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                    <div className="font-semibold text-[11px] text-emerald-900">Agronomic Protocol:</div>
                    <div className="text-[11px] text-emerald-800">{pack.recommendation}</div>
                  </div>

                  <div className="text-[10px] text-gray-500 font-mono border-t border-gray-100 pt-2 space-y-0.5">
                    <div><strong>Source:</strong> {pack.source}</div>
                    <div><strong>License:</strong> {pack.license}</div>
                    <div><strong>Validity:</strong> {pack.validFrom} to {pack.validUntil} (v{pack.version})</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Data Exchange Logs */}
      {activeTab === 'exchanges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Interoperability Exchange Logs</h3>
            <span className="text-xs text-gray-500 font-mono">{exchangeLogs.length} Transactions Logged</span>
          </div>

          {exchangeLogs.length > 0 ? (
            <div className="space-y-2.5">
              {exchangeLogs.map((log) => (
                <Card key={log.exchangeId}>
                  <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">{log.exchangeId}</span>
                        <Badge variant={log.status === 'completed' ? 'success' : log.status === 'partial' ? 'warning' : 'danger'} className="text-[10px] uppercase">
                          {log.status}
                        </Badge>
                        <span className="text-gray-500 font-mono text-[11px]">Schema v{log.schemaVersion}</span>
                      </div>
                      <div className="text-gray-600">
                        <strong>From:</strong> {log.source} ➔ <strong>To:</strong> {log.destination}
                      </div>
                    </div>

                    <div className="text-right sm:text-right text-gray-500 space-y-0.5">
                      <div className="font-semibold text-gray-800">
                        {log.recordCount} / {log.totalCount} records processed
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl">
              No data exchange transactions recorded yet. Initiate an exchange via export or sync.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Architecture Diagram */}
      {activeTab === 'architecture' && (
        <Card>
          <CardHeader>
            <CardTitle>AgriBridge Sovereign Interoperability Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-relaxed text-gray-700">
            <div className="p-4 bg-slate-950 text-emerald-400 font-mono rounded-xl overflow-x-auto text-[11px]">
              <pre>{`
  LOCAL FARM (Private Data)
          │
          ▼ (Sovereign Consent Filter)
  PRIVACY TRANSFORMATION (Anonymization & Coordinate Coarsening)
          │
          ▼
  CANONICAL DATA ENVELOPE (ISO/TC 34 & OGC SoilML v1.2)
          │
          ├─────────────────────────┬─────────────────────────┐
          ▼                         ▼                         ▼
   KNOWLEDGE EXCHANGE        MODEL REGISTRY           DATA EXCHANGE
  (Peer-Reviewed Articles)  (Validated Algorithms)   (Regional Aggregates)
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
                     BRICS COOPERATION NETWORK
                (Brazil · Russia · India · China · South Africa)
              `}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-600" /> Sovereign Farmer Ownership
                </h4>
                <p className="text-gray-600">
                  Farm data defaults to PRIVATE. No telemetry is shared with the network without explicit, freely revocable farmer consent.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary-600" /> Privacy-Preserving Transformation
                </h4>
                <p className="text-gray-600">
                  Shared data strips personal identifiers and coarsens GPS coordinates to ~1km district grids while preserving vital agronomic utility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schema Modal */}
      <Modal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        title="Canonical BRICS-AgriData JSON Interchange"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            Exported data for <strong>{selectedFarm?.name}</strong> matching the standard BRICS-AgriData v1.2 specification.
          </p>
          <pre className="p-3 bg-gray-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[360px] leading-tight">
            {schemaJson}
          </pre>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSchemaModal(false)}>Close</Button>
            <Button onClick={() => {
              navigator.clipboard?.writeText(schemaJson);
              alert('JSON copied to clipboard!');
            }}>
              Copy JSON
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BRICSNetwork;
