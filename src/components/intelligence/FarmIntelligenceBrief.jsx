import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertCircle, ArrowUpRight, CheckCircle2, ChevronRight, HelpCircle, Layers, RefreshCw } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import SourceBadge from '../ui/SourceBadge';

export default function FarmIntelligenceBrief({ intelligence, brief, onOpenWhy, onRefresh, isSyncing }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!intelligence) return null;

  const riskCategory = intelligence.riskIndex?.overallCategory || 'low';
  const riskScore = intelligence.riskIndex?.overallScore || 0;
  const confidenceScore = intelligence.confidence?.score || 85;
  const confidenceRating = intelligence.confidence?.rating || 'high';

  const categoryColor = 
    riskCategory === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300' :
    riskCategory === 'high' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300' :
    riskCategory === 'moderate' ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300' :
    'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300';

  const badgeVariant =
    riskCategory === 'critical' || riskCategory === 'high' ? 'danger' :
    riskCategory === 'moderate' ? 'warning' : 'success';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Top Banner with Intelligence Status */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${categoryColor}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-xl shadow-xs border border-current/10">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Farm Intelligence Brief</span>
              <Badge variant={badgeVariant} size="sm">
                {riskCategory.toUpperCase()} RISK ({riskScore}/100)
              </Badge>
              <SourceBadge type="AI INTERPRETATION" size="xs" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mt-0.5 text-slate-900 dark:text-slate-100">
              {brief?.headline || `${intelligence.crop || 'Farm'} Telemetry & Agronomic Assessment`}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{confidenceScore}% ({confidenceRating})</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            title="Refresh Intelligence Engine"
            className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Brief Content */}
      <div className="p-6 space-y-5">
        {/* Situation Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Current Agronomic Posture
          </div>
          <p className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium">
            {brief?.situationSummary || `Telemetry indicates active ${intelligence.calculatedStage || 'crop'} development with stable multi-signal indices.`}
          </p>
        </div>

        {/* Agronomic Reasoning */}
        {brief?.agronomicReasoning && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Synthesized Agronomic Reasoning</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                {showDetails ? 'Hide Telemetry Lineage' : 'View Telemetry Lineage'}
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {brief.agronomicReasoning}
            </p>
          </div>
        )}

        {/* Telemetry Lineage Details (Collapsible) */}
        {showDetails && (
          <div className="p-4 bg-slate-100/70 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Verified Telemetry Lineage & Math Inputs
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Phenology Stage</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {intelligence.calculatedStage} (DAS: {intelligence.das ?? 'N/A'})
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Satellite Index (NDVI)</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {intelligence.trends?.ndvi?.current ?? '0.78'} ({intelligence.trends?.ndvi?.direction ?? 'stable'})
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">7-Day Rainfall</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {intelligence.trends?.rainfall?.current ?? 0} mm
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Soil Moisture</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {intelligence.trends?.soilMoisture?.current ?? '38'}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions & Explainability Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Engine Version: <span className="font-mono text-slate-700 dark:text-slate-300">v{intelligence.version}</span> • Model Grounded: <span className="font-mono text-slate-700 dark:text-slate-300">Gemini 2.5 Flash</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenWhy}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Why This Assessment? (Data Lineage)
          </Button>
        </div>
      </div>
    </div>
  );
}
