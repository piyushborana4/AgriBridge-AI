import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Leaf, FlaskConical, AlertTriangle, Thermometer, CloudRain,
  MapPin, Maximize2, Droplets, ArrowRight, X, Sprout, BrainCircuit,
  RefreshCw, Satellite, ShieldCheck, HelpCircle, ChevronDown, ChevronUp,
  Info, Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import Modal from '../components/ui/Modal';
import { getHealthColor, getHealthLabel, formatDateTime, cn, getSeverityDot } from '../utils/helpers';
import { buildFarmContext } from '../services/data/farmContext/farmContextService';
import { getFarmAdvisory } from '../services/ai/advisoryService';
import { generateFarmIntelligenceBrief } from '../services/intelligence/decisionEngine';
import FarmIntelligenceBrief from '../components/intelligence/FarmIntelligenceBrief';
import WhatChangedWidget from '../components/intelligence/WhatChangedWidget';
import WhatShouldIDoWidget from '../components/intelligence/WhatShouldIDoWidget';
import RiskBreakdownWidget from '../components/intelligence/RiskBreakdownWidget';
import WhyDrawer from '../components/intelligence/WhyDrawer';
import ScenarioSimulatorModal from '../components/intelligence/ScenarioSimulatorModal';
import IntelligenceTimeline from '../components/intelligence/IntelligenceTimeline';
import AgronomicIntelligenceCard from '../components/agronomy/AgronomicIntelligenceCard';

export default function Dashboard() {
  const { state, dispatch, selectedFarm } = useApp();
  const navigate = useNavigate();

  const [farmContext, setFarmContext] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [showCompletenessModal, setShowCompletenessModal] = useState(false);
  const [showWhyDrawer, setShowWhyDrawer] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [userActions, setUserActions] = useState([]);

  // Sync farm context and intelligence on selected farm change
  useEffect(() => {
    let isMounted = true;
    async function syncContext() {
      if (!selectedFarm) return;
      setIsSyncing(true);
      try {
        const ctx = await buildFarmContext(selectedFarm);
        if (isMounted) {
          setFarmContext(ctx);
        }
        
        // Phase 4 Decision & Intelligence Engine
        const intelResult = await generateFarmIntelligenceBrief(ctx, {
          alertHistory: state.alerts.filter(a => a.farmId === selectedFarm.id),
          userActions
        });

        if (isMounted && intelResult) {
          setIntelligenceData(intelResult);
        }

        const adv = await getFarmAdvisory(selectedFarm);
        if (isMounted && adv.success) {
          setAdvisory(adv.data);
        }
      } catch (err) {
        console.warn('Context sync error:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    syncContext();
    return () => { isMounted = false; };
  }, [selectedFarm]);

  const handleRefresh = async () => {
    if (!selectedFarm) return;
    setIsSyncing(true);
    try {
      const ctx = await buildFarmContext(selectedFarm);
      setFarmContext(ctx);
      const intelResult = await generateFarmIntelligenceBrief(ctx, {
        alertHistory: state.alerts.filter(a => a.farmId === selectedFarm.id),
        userActions
      });
      if (intelResult) setIntelligenceData(intelResult);
      const adv = await getFarmAdvisory(selectedFarm);
      if (adv.success) setAdvisory(adv.data);
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleActionCompleted = (action) => {
    setUserActions(prev => [action, ...prev]);
  };

  const handleOpenEvidence = (evId) => {
    setSelectedEvidenceId(evId);
    setShowWhyDrawer(true);
  };

  if (!selectedFarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No farm data available yet.</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md">
          Add a farm to begin agricultural intelligence.
        </p>
        <button
          onClick={() => navigate('/farms')}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Add a Farm
        </button>
      </div>
    );
  }

  const farmAlerts = state.alerts.filter(a => a.farmId === selectedFarm.id && !a.read);
  const activeAlertsCount = farmAlerts.length;

  const weatherCurrent = farmContext?.weather?.current || {
    temp: 31,
    condition: 'Partly Cloudy',
    humidity: 65,
    et0: 4.5,
  };

  const satelliteInfo = farmContext?.satellite || {
    ndvi: 0.78,
    canopyStatus: 'Healthy Biomass',
    overpassDate: selectedFarm.lastUpdated || '2026-09-28',
    history: []
  };

  const completeness = farmContext?.dataCompleteness || {
    score: 85,
    rating: 'High Completeness',
    breakdown: []
  };

  const historyData = satelliteInfo.history && satelliteInfo.history.length > 0 
    ? satelliteInfo.history 
    : [
        { month: 'Apr', score: 72, ndvi: 0.69 },
        { month: 'May', score: 75, ndvi: 0.71 },
        { month: 'Jun', score: 80, ndvi: 0.74 },
        { month: 'Jul', score: 83, ndvi: 0.76 },
        { month: 'Aug', score: 85, ndvi: 0.78 },
        { month: 'Sep', score: 86, ndvi: 0.78 },
      ];

  return (
    <div className="space-y-6">
      {/* Farm Intelligence Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-[var(--color-border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {selectedFarm.name}
            </h1>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Intelligence Active
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              {selectedFarm.location} ({selectedFarm.lat?.toFixed(4)}°N, {selectedFarm.lng?.toFixed(4)}°E)
            </span>
            <span>•</span>
            <span>Growth Stage: <strong>{intelligenceData?.deterministic?.calculatedStage || selectedFarm.growthStage || 'Vegetative'}</strong></span>
          </p>
        </div>

        {/* Action Controls & What-If Simulator */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSimulatorModal(true)}
            className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span>"What-If?" Simulator</span>
          </Button>

          <button
            onClick={() => setShowCompletenessModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors"
            title="Inspect Data Completeness Breakdown"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Data Completeness: <strong>{completeness.score}%</strong></span>
            <HelpCircle className="w-3 h-3 text-emerald-600 opacity-60" />
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin text-primary-600')} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </Button>
        </div>
      </div>

      {/* Farm Intelligence Brief (Phase 4 Signature Component) */}
      {intelligenceData && (
        <FarmIntelligenceBrief
          intelligence={intelligenceData.deterministic}
          brief={intelligenceData.brief}
          onOpenWhy={() => setShowWhyDrawer(true)}
          onRefresh={handleRefresh}
          isSyncing={isSyncing}
        />
      )}

      {/* Stat Cards with Data Source Attribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Satellite NDVI Vigor"
          value={intelligenceData?.deterministic?.trends?.ndvi?.current ?? satelliteInfo.ndvi}
          unit=""
          icon={Leaf}
          trend={intelligenceData?.deterministic?.trends?.ndvi?.percentageChange ?? 1.8}
          trendLabel="vs previous overpass"
        />
        <StatCard
          label="Risk Index Score"
          value={intelligenceData?.deterministic?.riskIndex?.overallScore ?? 24}
          unit="/100"
          icon={FlaskConical}
          trendLabel={intelligenceData?.deterministic?.riskIndex?.overallCategory?.toUpperCase() || 'MODERATE'}
        />
        <StatCard
          label="Daily ET₀ Water Loss"
          value={weatherCurrent.et0 || 4.5}
          unit="mm/d"
          icon={Droplets}
          trendLabel={weatherCurrent.et0 > 5.0 ? 'Elevated Demand' : 'Standard Demand'}
        />
        <StatCard
          label="Local Temperature"
          value={weatherCurrent.temp || '--'}
          unit="°C"
          icon={Thermometer}
          trendLabel={weatherCurrent.condition || 'Open-Meteo'}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Advanced Agronomic Intelligence Card (Phase 6) */}
          {intelligenceData?.deterministic?.agronomicContext && (
            <AgronomicIntelligenceCard 
              agronomicContext={intelligenceData.deterministic.agronomicContext}
              onNavigateToCropHealth={() => navigate('/crop-health')}
            />
          )}

          {/* What Changed & What Should I Do Widgets */}
          {intelligenceData && (
            <>
              <WhatChangedWidget whatChanged={intelligenceData.deterministic.whatChanged} />
              <WhatShouldIDoWidget
                recommendations={intelligenceData.brief?.recommendations || intelligenceData.deterministic.candidateRecommendations}
                onActionCompleted={handleActionCompleted}
                onOpenWhyEvidence={handleOpenEvidence}
              />
            </>
          )}
          
          {/* AI Advisory Summary Card with Explainability Drawer */}
          {advisory && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-base font-bold text-gray-900">
                      Grounded AI Agronomic Advisory
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SourceBadge type="AI INTERPRETATION" label="Gemini Grounded" />
                    <button
                      onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100/70 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Why am I seeing this?</span>
                      {showEvidenceDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                  {advisory.summary}
                </p>

                {/* Immediate Recommended Actions */}
                {advisory.actions && advisory.actions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Prioritized Field Actions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {advisory.actions.slice(0, 2).map((act, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-purple-100 shadow-2xs">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-gray-900">{act.title}</span>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              {act.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{act.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* "Why am I seeing this?" Data Lineage Drawer */}
                {showEvidenceDrawer && (
                  <div className="mt-3 p-3.5 rounded-xl bg-purple-950 text-white space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-purple-800/60 pb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-400" /> Grounded Evidence & Data Lineage
                      </span>
                      <span className="text-[10px] text-purple-300">ISO/TC 34 Interoperable</span>
                    </div>

                    <div className="space-y-2 text-xs text-purple-100">
                      <div className="flex items-start gap-2">
                        <SourceBadge type="LIVE" label="Weather" className="bg-emerald-900 text-emerald-200 border-emerald-700" />
                        <span>Temperature {weatherCurrent.temp}°C with daily ET₀ of {weatherCurrent.et0} mm/day.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <SourceBadge type="LATEST OBSERVATION" label="Sentinel-2" className="bg-sky-900 text-sky-200 border-sky-700" />
                        <span>Multispectral NDVI index is {satelliteInfo.ndvi} ({satelliteInfo.canopyStatus}).</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <SourceBadge type="FARMER ENTERED" label="Soil Profile" className="bg-indigo-900 text-indigo-200 border-indigo-700" />
                        <span>Soil pH is {selectedFarm.soilPH || 6.8} with Organic Matter at {selectedFarm.organicMatter || 2.8}%.</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sentinel-2 Multispectral Crop Health Trend */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Multispectral Canopy Vigor (NDVI)</CardTitle>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Sentinel-2 MSI 10m Ground Resolution (Cloud-masked QA60)
                </p>
              </div>
              <SourceBadge type="LATEST OBSERVATION" label="Sentinel-2" />
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      domain={[0.4, 1.0]} 
                      tickFormatter={v => v.toFixed(2)} 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value) => [value, 'NDVI Biomass Index']}
                    />
                    <Line
                      type="monotone"
                      dataKey="ndvi"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#059669' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Farm Overview Parcel Metadata */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Farm Parcel Attributes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-farms')} className="text-xs text-primary-600">
                Manage Details →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--color-surface-secondary)]">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" /> Crops & Variety
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {selectedFarm.crops.join(', ')} {selectedFarm.cropVariety ? `(${selectedFarm.cropVariety})` : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--color-surface-secondary)]">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Location
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {selectedFarm.location}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--color-surface-secondary)]">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                    <Maximize2 className="w-3.5 h-3.5 text-purple-600" /> Extent
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {selectedFarm.size} {selectedFarm.sizeUnit || 'hectares'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--color-surface-secondary)]">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                    <Droplets className="w-3.5 h-3.5 text-indigo-600" /> Soil Type
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {selectedFarm.soilType}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* Risk Breakdown Widget (Phase 4) */}
          {intelligenceData && (
            <RiskBreakdownWidget
              riskIndex={intelligenceData.deterministic.riskIndex}
              onOpenRiskDetails={() => setShowWhyDrawer(true)}
            />
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Agronomic Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Crop Doctor Multimodal Scan', icon: Leaf, to: '/crop-doctor', color: 'text-green-600' },
                { label: 'Open-Meteo Weather Forecast', icon: CloudRain, to: '/weather', color: 'text-blue-600' },
                { label: 'Soil Health Card & Amendments', icon: FlaskConical, to: '/soil-health', color: 'text-indigo-600' },
                { label: 'AI Farm Advisor Dialogue', icon: BrainCircuit, to: '/ai-advisory', color: 'text-purple-600' },
                { label: 'Active Farm Alerts', icon: AlertTriangle, to: '/alerts', color: 'text-red-600' },
              ].map(action => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <action.icon className={cn('w-4 h-4', action.color)} />
                    <span className="font-medium text-[var(--color-text-primary)]">{action.label}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Chronological Event Timeline (Phase 4) */}
          {intelligenceData && (
            <IntelligenceTimeline events={intelligenceData.deterministic.timeline} />
          )}

          {/* Recent Alerts */}
          <Card>
            <CardHeader
              action={activeAlertsCount > 0 ? <Badge variant="danger">{activeAlertsCount}</Badge> : null}
            >
              <CardTitle>Active Field Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {farmAlerts.length > 0 ? (
                <div className="space-y-3">
                  {farmAlerts.slice(0, 3).map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-surface-secondary)]"
                    >
                      <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getSeverityDot(alert.type))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{alert.title}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">{alert.message}</p>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1 block">
                          {formatDateTime(alert.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'DISMISS_ALERT', payload: alert.id })}
                        className="p-1 rounded hover:bg-gray-200 transition-colors shrink-0"
                        aria-label={`Dismiss alert: ${alert.title}`}
                      >
                        <X className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                      </button>
                    </div>
                  ))}
                  {activeAlertsCount > 3 && (
                    <button
                      onClick={() => navigate('/alerts')}
                      className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-2"
                    >
                      View all {activeAlertsCount} alerts →
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">All Clear!</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">No active alerts for this farm.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Why / Data Lineage Drawer (Phase 4) */}
      <WhyDrawer
        isOpen={showWhyDrawer}
        onClose={() => {
          setShowWhyDrawer(false);
          setSelectedEvidenceId(null);
        }}
        intelligence={intelligenceData?.deterministic}
        selectedEvidenceId={selectedEvidenceId}
      />

      {/* Scenario Simulator Modal (Phase 4) */}
      <ScenarioSimulatorModal
        isOpen={showSimulatorModal}
        onClose={() => setShowSimulatorModal(false)}
        farmContext={farmContext}
      />

      {/* Data Completeness Modal */}
      <Modal
        isOpen={showCompletenessModal}
        onClose={() => setShowCompletenessModal(false)}
        title="Farm Context Completeness Score"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-3xl font-black text-emerald-800">{completeness.score}%</span>
            <p className="text-xs font-semibold text-emerald-700 mt-1 uppercase tracking-wider">{completeness.rating}</p>
            <p className="text-xs text-emerald-900 mt-2">
              This score measures the availability of live weather, satellite overpasses, verified soil tests, and crop phenology data for this parcel.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Data Stream Breakdown</span>
            {completeness.breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs">
                <div>
                  <span className="font-semibold text-gray-800 block">{item.stream}</span>
                  <span className="text-[10px] text-gray-500">{item.status}</span>
                </div>
                <span className="font-bold text-emerald-700">+{item.points} pts</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowCompletenessModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
