import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { 
  MapPin, Layers, Satellite, ShieldAlert, Sparkles, Activity, 
  Calendar, RefreshCw, AlertTriangle, ArrowRightLeft, Mountain, 
  Droplets, CheckCircle2, ChevronRight, SlidersHorizontal, Info, Eye
} from 'lucide-react';
import { 
  listFields, 
  calculateFieldIntelligence, 
  listSatelliteObservations, 
  compareSatelliteDates,
  getFarmTopography,
  evaluateDrainageRisk,
  buildDigitalTwinSnapshot2,
  simulateFieldScenario,
  LOCATION_QUALITY
} from '../services/geospatial/geospatialGateway';

export default function FarmMap() {
  const { selectedFarm } = useApp();
  const [activeLayer, setActiveLayer] = useState('fields'); // 'fields' | 'satellite' | 'soil' | 'drainage' | 'zones' | 'scenarios'
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [timeWindow, setTimeWindow] = useState('30D');
  const [showSimModal, setShowSimModal] = useState(false);
  const [irrigationAdj, setIrrigationAdj] = useState(20);
  const [tempShift, setTempShift] = useState(0);
  const [simulationResult, setSimulationResult] = useState(null);

  const farmId = selectedFarm?.id || 'farm-1';

  // Fields and snapshot
  const fields = useMemo(() => listFields(farmId), [farmId]);
  const activeField = useMemo(() => fields.find(f => f.fieldId === selectedFieldId) || fields[0], [fields, selectedFieldId]);

  const fieldIntelligence = useMemo(() => {
    if (!activeField) return null;
    return calculateFieldIntelligence(activeField, selectedFarm || {});
  }, [activeField, selectedFarm]);

  const satelliteHistory = useMemo(() => {
    return listSatelliteObservations(farmId, { timeWindow, validOnly: true });
  }, [farmId, timeWindow]);

  const topography = useMemo(() => getFarmTopography(farmId), [farmId]);
  const drainageRisk = useMemo(() => evaluateDrainageRisk(farmId, selectedFarm?.weather, selectedFarm?.soil), [farmId, selectedFarm]);

  const snapshot = useMemo(() => {
    return buildDigitalTwinSnapshot2(selectedFarm || { id: farmId }, selectedFarm || {});
  }, [selectedFarm, farmId]);

  const handleRunSimulation = () => {
    if (!activeField) return;
    const res = simulateFieldScenario({
      farmId,
      fieldId: activeField.fieldId,
      irrigationAdjustmentPercent: Number(irrigationAdj),
      tempShiftC: Number(tempShift),
      baseContext: selectedFarm || {}
    });
    setSimulationResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary-600" />
              Farm Digital Twin 2.0 — Spatial Intelligence
            </h1>
            <Badge variant="primary" className="text-[10px]">
              {snapshot.spatial.locationQuality === LOCATION_QUALITY.EXACT_BOUNDARY ? 'Verified Boundary' : 'Approximate Parcel'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {selectedFarm?.name || 'Green Valley Farm'} &bull; {selectedFarm?.location || 'Nashik, Maharashtra'} &bull; Total Managed Area: {snapshot.spatial.totalAreaHectares} ha across {snapshot.spatial.fieldsCount} active fields
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => {
              setShowSimModal(true);
              handleRunSimulation();
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> What-If Scenario
          </Button>
        </div>
      </div>

      {/* Layer Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveLayer('fields')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeLayer === 'fields' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Field Parcels ({fields.length})
        </button>
        <button
          onClick={() => setActiveLayer('satellite')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeLayer === 'satellite' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" /> Sentinel-2 Timeline ({satelliteHistory.length})
        </button>
        <button
          onClick={() => setActiveLayer('zones')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeLayer === 'zones' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Management Zones
        </button>
        <button
          onClick={() => setActiveLayer('drainage')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeLayer === 'drainage' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" /> Terrain &amp; Drainage Risk
        </button>
      </div>

      {/* Main Grid: Spatial View + Field Dossier Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Spatial Visualization / Map Surface */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-2 border-primary-100">
            <CardHeader className="bg-slate-900 text-white py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold">SPATIAL TWIN &bull; EPSG:4326 WGS84</span>
              </div>
              <span className="text-[11px] font-mono text-slate-300">
                Layer: {activeLayer.toUpperCase()}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {/* SVG-based Interactive Farm Map */}
              <div className="relative w-full h-80 bg-slate-950 flex items-center justify-center overflow-hidden p-6">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Visual Field Polygons */}
                <div className="relative z-10 grid grid-cols-2 gap-4 w-full max-w-lg">
                  {fields.map((field) => {
                    const isSelected = activeField?.fieldId === field.fieldId;
                    return (
                      <div
                        key={field.fieldId}
                        onClick={() => setSelectedFieldId(field.fieldId)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all backdrop-blur-sm ${
                          isSelected 
                            ? 'border-emerald-400 bg-emerald-950/70 shadow-lg shadow-emerald-500/20 scale-105' 
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white truncate">{field.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {field.areaHectares} ha
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">{field.crop}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Status: {field.status}</div>

                        {/* Layer-Specific Indicators */}
                        {activeLayer === 'satellite' && (
                          <div className="mt-2 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                            <span>NDVI: 0.74 (Clear)</span>
                          </div>
                        )}
                        {activeLayer === 'zones' && (
                          <div className="mt-2 flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="High Vigor" />
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Moderate" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Map Legend Footer */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> High Vigor (&gt;0.65)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (0.45-0.65)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Stress (&lt;0.45)</span>
                  </div>
                  <span className="text-[10px] font-mono">Cadastral Precision</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layer Sub-Panels */}
          {activeLayer === 'satellite' && (
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold">Copernicus Sentinel-2 Temporal Timeline</CardTitle>
                <div className="flex gap-1 text-[10px]">
                  {['7D', '30D', '90D', 'ALL'].map(win => (
                    <button
                      key={win}
                      onClick={() => setTimeWindow(win)}
                      className={`px-2 py-0.5 rounded ${timeWindow === win ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {win}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {satelliteHistory.map(obs => (
                  <div key={obs.observationId} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{new Date(obs.acquisitionDate).toLocaleDateString()}</span>
                      <span className="text-gray-500 text-[11px] ml-2">({obs.source})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-emerald-700 font-semibold">NDVI: {obs.indices.ndvi}</span>
                      <span className="text-sky-700">NDWI: {obs.indices.ndwi}</span>
                      <Badge variant={obs.cloudCoveragePercent < 10 ? 'success' : 'warning'} className="text-[9px]">
                        {obs.cloudCoveragePercent}% Cloud
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeLayer === 'drainage' && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold">Topography &amp; Soil Hydrology Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Elevation</span>
                    <span className="font-bold text-gray-800">{topography.elevationMeters || '560'} m ASL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Slope</span>
                    <span className="font-bold text-gray-800">{topography.slopePercent || '2.5'}% ({topography.slopeCategory || 'Gentle'})</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Drainage Risk</span>
                    <Badge variant={drainageRisk.drainageRiskLevel === 'HIGH' ? 'danger' : 'success'} className="text-[10px]">
                      {drainageRisk.drainageRiskLevel}
                    </Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Erosion Risk</span>
                    <Badge variant={drainageRisk.erosionRiskLevel === 'HIGH' ? 'danger' : 'success'} className="text-[10px]">
                      {drainageRisk.erosionRiskLevel}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 space-y-1">
                  <span className="font-bold text-[11px] block">Terrain Hydrological Signals:</span>
                  {drainageRisk.signals.map((sig, i) => (
                    <div key={i} className="text-[11px] leading-relaxed text-indigo-900">&bull; {sig}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Selected Field Agronomic Dossier */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 bg-gray-50/80 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold text-gray-900">{activeField?.name}</CardTitle>
                <Badge variant={fieldIntelligence?.risk.level === 'HIGH' ? 'danger' : 'success'} className="text-[10px]">
                  Risk: {fieldIntelligence?.risk.level}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-500">{activeField?.crop} &bull; {activeField?.variety}</p>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Phenological Stage */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-emerald-950">Crop Phenology:</span>
                  <span className="text-emerald-800 font-mono">DAS: {fieldIntelligence?.cropStage.daysAfterSowing || 45}</span>
                </div>
                <div className="text-emerald-900 font-bold">{fieldIntelligence?.cropStage.stageName}</div>
              </div>

              {/* Field Telemetry Highlights */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-500 block">Canopy NDVI</span>
                  <span className="font-bold text-gray-800">{fieldIntelligence?.telemetry.ndvi}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-500 block">Soil Moisture</span>
                  <span className="font-bold text-gray-800">{fieldIntelligence?.telemetry.soilMoisturePercent}%</span>
                </div>
              </div>

              {/* Management Zones */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-900 block text-[11px]">Management Zones:</span>
                {fieldIntelligence?.managementZones.map(z => (
                  <div key={z.zoneId} className="p-2 rounded bg-gray-50 border border-gray-100 text-[11px] space-y-0.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-800">{z.name}</span>
                      <span className="text-gray-500 font-mono">{z.coveragePercent}% Area</span>
                    </div>
                    <p className="text-gray-600 text-[10px]">{z.description}</p>
                  </div>
                ))}
              </div>

              {/* Spatially Grounded Recommendations */}
              <div className="space-y-1.5 border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900 block text-[11px]">Targeted Agronomic Actions:</span>
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-950 space-y-1">
                  <div className="font-bold text-blue-900">Recommended Action:</div>
                  <p className="text-blue-800">{snapshot.whatShouldIDo[0]?.suggestedAction || 'Maintain standard drip schedule.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* What-If Scenario Modal */}
      <Modal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        title="Field Scenario Simulator (Deterministic What-If)"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px]">
            <strong>Note:</strong> Scenarios are mathematical projections based on physical crop water balance models. Results are tagged <code>SIMULATED</code> and do not alter observed field data.
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Irrigation Adjustment: {irrigationAdj > 0 ? `+${irrigationAdj}%` : `${irrigationAdj}%`}
              </label>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="5" 
                value={irrigationAdj}
                onChange={(e) => {
                  setIrrigationAdj(Number(e.target.value));
                  handleRunSimulation();
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Temperature Shift: {tempShift > 0 ? `+${tempShift}°C` : `${tempShift}°C`}
              </label>
              <input 
                type="range" 
                min="-5" 
                max="5" 
                step="1" 
                value={tempShift}
                onChange={(e) => {
                  setTempShift(Number(e.target.value));
                  handleRunSimulation();
                }}
                className="w-full"
              />
            </div>
          </div>

          {simulationResult && (
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 font-mono text-[11px]">
              <div className="text-emerald-400 font-bold">Simulation Output (SIMULATED):</div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Baseline Risk: {simulationResult.baseline.riskScore}/100</div>
                <div className="text-emerald-300 font-semibold">Projected Risk: {simulationResult.projected.riskScore}/100</div>
                <div>Baseline Soil Moisture: {simulationResult.baseline.soilMoisture}%</div>
                <div className="text-sky-300 font-semibold">Projected Soil Moisture: {simulationResult.projected.soilMoisture}%</div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowSimModal(false)}>Close Scenario</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
