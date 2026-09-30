import React, { useState } from 'react';
import { 
  Sprout, Droplets, Thermometer, ShieldAlert, AlertTriangle, 
  ChevronRight, Compass, BookOpen, Sun, CloudRain, CheckCircle2,
  Calendar, Layers, ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function AgronomicIntelligenceCard({ agronomicContext, onNavigateToCropHealth }) {
  const [activeTab, setActiveTab] = useState('phenology'); // phenology | water | climate | disease

  if (!agronomicContext) return null;

  const stage = agronomicContext.growthStage;
  const water = agronomicContext.waterBalance;
  const irg = agronomicContext.irrigationDecision;
  const heat = agronomicContext.heatStress;
  const cold = agronomicContext.coldStress;
  const disease = agronomicContext.diseaseConduciveness;
  const pest = agronomicContext.pestRisk;
  const climate = agronomicContext.climateRisks;
  const yieldRisk = agronomicContext.yieldRisk;

  const getUrgencyBadgeColor = (rec) => {
    switch (rec) {
      case 'recommended': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'avoid_excess': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'monitor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'text-rose-400';
      case 'high': return 'text-amber-400';
      case 'moderate': return 'text-yellow-400';
      default: return 'text-emerald-400';
    }
  };

  return (
    <Card className="border-emerald-500/20 bg-emerald-950/10">
      <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Advanced Agronomic Intelligence
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                FAO-56 Dual Kc
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-400">
              Crop phenology, water balance, and microclimate pathogen favorability
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('phenology')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'phenology' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Phenology & Stage
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'water' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Water & Irrigation
          </button>
          <button
            onClick={() => setActiveTab('climate')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'climate' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Climate & Thermal
          </button>
          <button
            onClick={() => setActiveTab('disease')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'disease' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Disease Conduciveness
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Tab 1: Phenology */}
        {activeTab === 'phenology' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/20 border border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Phenological Stage</span>
                  <Badge variant="outline" className="text-xs text-slate-300">
                    {stage?.source === 'USER_PROVIDED' ? 'Verified Ground Truth' : 'Sowing Date Model'}
                  </Badge>
                </div>
                <div className="text-base font-semibold text-white flex items-center gap-2">
                  {stage?.stageName || 'Active Vegetative'}
                  {stage?.das !== null && (
                    <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Day {stage.das} (DAS)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {stage?.managementFocus}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block">Crop Kc</span>
                  <span className="font-mono text-emerald-400 font-medium">{stage?.cropCoefficientKc || 0.85}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block">Active Root Depth</span>
                  <span className="font-mono text-white font-medium">{stage?.rootDepthCm || 30} cm</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 col-span-2 md:col-span-1">
                  <span className="text-slate-400 block">Water Sensitivity</span>
                  <span className="font-medium text-amber-400 capitalize">{stage?.waterSensitivity || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* Stage Progress Bar */}
            {stage?.allStages && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Growth Stage Progression</span>
                  <span>Next: {stage.nextStageName}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {stage.allStages.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className={`p-2 rounded-lg text-center text-xs transition-all border ${
                        s.isCurrent
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold ring-1 ring-emerald-500/30'
                          : 'bg-black/20 border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="truncate text-xs">{s.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.typicalDasRange[0]}-{s.typicalDasRange[1]}d</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Water Balance & Irrigation */}
        {activeTab === 'water' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daily Crop ETc Demand</span>
                </div>
                <div className="text-lg font-mono font-semibold text-white">
                  {water?.cropEtcMmDay || 4.2} <span className="text-xs font-normal text-slate-400">mm/day</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ref ET₀: {water?.referenceEt0MmDay} mm × Kc {water?.cropCoefficientKc}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span>7-Day Net Water Balance</span>
                </div>
                <div className={`text-lg font-mono font-semibold ${water?.netBalance7dMm < 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                  {water?.netBalance7dMm >= 0 ? '+' : ''}{water?.netBalance7dMm} <span className="text-xs font-normal text-slate-400">mm</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Rain: {water?.forecastRainfall7dMm} mm vs Demand: {water?.forecastCropDemand7dMm} mm
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Irrigation Decision</span>
                </div>
                <div className="pt-0.5">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold uppercase border ${getUrgencyBadgeColor(irg?.recommendation)}`}>
                    {irg?.recommendation?.replace(/_/g, ' ') || 'MONITOR'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Window: {irg?.actionableWindow || 'Next 48h'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Agronomic Field Action
              </div>
              <p className="text-slate-400 leading-relaxed">
                {irg?.fieldAction || irg?.rationale}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Climate & Thermal */}
        {activeTab === 'climate' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Heat Stress */}
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    Day & Night Thermal Stress
                  </span>
                  <span className={`text-xs font-medium uppercase ${getRiskColor(heat?.riskLevel)}`}>
                    {heat?.riskLevel} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {heat?.physiologicalImpact}
                </p>
                {heat?.nocturnalHeatStress && (
                  <div className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    ⚠️ Nocturnal temperature remains elevated (&gt;{heat?.nocturnalThresholdC}°C), increasing dark respiration loss.
                  </div>
                )}
              </div>

              {/* Climate Warning Horizons */}
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Forecast Hazard Horizons
                  </span>
                  <span className="text-xs text-slate-400">
                    {climate?.activeRisksCount || 0} active
                  </span>
                </div>
                {climate?.risks?.length > 0 ? (
                  <div className="space-y-1.5">
                    {climate.risks.slice(0, 2).map((r, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-slate-900/60 border border-white/5">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>{r.riskType.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-amber-400">{r.horizon}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{r.impact}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    No critical meteorological hazards forecast in 7-day window.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Disease Conduciveness */}
        {activeTab === 'disease' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Microclimatic Pathogen Favorability
                </span>
                <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                  {disease?.overallFavorability?.toUpperCase() || 'LOW'} PRESSURE
                </Badge>
              </div>

              {disease?.conduciveDiseases?.length > 0 ? (
                <div className="space-y-2">
                  {disease.conduciveDiseases.map((d, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>{d.diseaseName} <span className="text-[11px] font-normal text-slate-400">({d.pathogen})</span></span>
                        <span className="text-yellow-400 font-normal">{d.conducivenessLevel} favorability</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        <strong>Scouting tip:</strong> {d.scoutingAdvice}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-2">
                  Microclimatic conditions do not indicate elevated sporulation pressure for known crop pathogens.
                </div>
              )}

              {/* Safety Invariant Notice */}
              <div className="text-[11px] text-slate-500 bg-slate-900/40 p-2 rounded border border-white/5 italic">
                🛡️ <strong>Safety Invariant:</strong> {disease?.safetyDisclaimer}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Literature Citations & Navigation */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>References: {agronomicContext.cropProfile?.referenceSources?.join(', ') || 'FAO-56, ICAR Guidelines'}</span>
          </div>
          {onNavigateToCropHealth && (
            <button
              onClick={onNavigateToCropHealth}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
            >
              View Detailed Crop Health &amp; Diagnostics
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
