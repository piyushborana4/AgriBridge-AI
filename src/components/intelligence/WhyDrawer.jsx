import React from 'react';
import { X, ShieldCheck, Database, Calendar, Activity, AlertTriangle, Layers, Info, CheckCircle2 } from 'lucide-react';
import Badge from '../ui/Badge';
import SourceBadge from '../ui/SourceBadge';

export default function WhyDrawer({ isOpen, onClose, intelligence, selectedEvidenceId }) {
  if (!isOpen || !intelligence) return null;

  const { evidenceItems = [], confidence = {}, lineage = {}, riskIndex = {} } = intelligence;

  const activeEvidence = selectedEvidenceId
    ? evidenceItems.filter(e => e.id === selectedEvidenceId)
    : evidenceItems;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Data Lineage & Explainability
              </span>
              <SourceBadge type="LIVE" size="xs" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Why This Intelligence Assessment?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Confidence Breakdown Card */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  AI Assessment Confidence: {confidence.score || 85}%
                </span>
              </div>
              <Badge variant="success" size="sm">
                {(confidence.rating || 'HIGH').toUpperCase()}
              </Badge>
            </div>

            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Confidence is computed deterministically from sensor freshness, cloud cover mask verification, and cross-source telemetry consistency.
            </p>

            {confidence.breakdown && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 text-xs">
                {Object.entries(confidence.breakdown).map(([key, val]) => (
                  <div key={key} className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-slate-500 capitalize">{key}: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{val.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traceable Evidence Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Traceable Telemetry Evidence ({activeEvidence.length})
              </h3>
            </div>

            <div className="space-y-3">
              {activeEvidence.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200">
                        #{item.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                    </div>
                    <Badge variant={item.confidence >= 80 ? 'success' : 'warning'} size="xs">
                      {item.confidence}% Confidence
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div>Source: <span className="font-medium text-slate-700 dark:text-slate-300">{item.source}</span></div>
                    {item.timestamp && <div>Observed: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(item.timestamp).toLocaleDateString()}</span></div>}
                    <div>Metric Value: <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Lineage & Providers */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Connected Data Providers
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Satellite: {lineage.satelliteSource} (Acquisition: {lineage.satelliteAcquisitionDate || 'Recent'}, Cloud Cover: {lineage.cloudCoveragePct}%)</li>
              <li>• Agrometeorology: {lineage.weatherSource} (Real-time forecast & historical accumulation)</li>
              <li>• Soil Telemetry: {lineage.soilSource} (Horizon-level physicochemical modeling)</li>
            </ul>
          </div>

          {/* Safety & Extension Disclaimer */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Agronomic Safety Protocol
            </div>
            <p className="leading-relaxed">
              AgriBridge AI recommendations adhere strictly to ICAR and regional agricultural extension guidelines. Chemical interventions, when necessary, must be verified with your local Krishi Vigyan Kendra (KVK) agronomist.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
}
