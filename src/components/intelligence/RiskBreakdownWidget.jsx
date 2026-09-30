import React, { useState } from 'react';
import { AlertTriangle, Droplets, Leaf, CloudRain, Bug, ShieldAlert, ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import SourceBadge from '../ui/SourceBadge';

export default function RiskBreakdownWidget({ riskIndex, onOpenRiskDetails, className = '' }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  if (!riskIndex) return null;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'water':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'vegetation':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'weather':
        return <CloudRain className="w-4 h-4 text-amber-600" />;
      case 'disease':
        return <Bug className="w-4 h-4 text-rose-600" />;
      case 'soil':
        return <Layers className="w-4 h-4 text-purple-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRiskColor = (score) => {
    if (score >= 60) return 'text-rose-600 bg-rose-500';
    if (score >= 35) return 'text-amber-600 bg-amber-500';
    return 'text-emerald-600 bg-emerald-500';
  };

  const categories = [
    { key: 'water', label: 'Water & Irrigation Stress', weight: '30%' },
    { key: 'vegetation', label: 'Vegetation & Canopy Vigor', weight: '25%' },
    { key: 'weather', label: 'Extreme Weather & Thermal', weight: '20%' },
    { key: 'disease', label: 'Microclimate Disease Conduciveness', weight: '15%' },
    { key: 'soil', label: 'Soil Nutrient & Reaction', weight: '10%' },
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Multi-Signal Risk Index
            </h3>
            <Badge
              variant={
                riskIndex.overallCategory === 'critical' || riskIndex.overallCategory === 'high' ? 'danger' :
                riskIndex.overallCategory === 'moderate' ? 'warning' : 'success'
              }
              size="xs"
            >
              Score: {riskIndex.overallScore}/100
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Weighted agronomic risk synthesis across 5 operational pillars
          </p>
        </div>
        <SourceBadge type="AI INTERPRETATION" size="xs" />
      </div>

      {/* Category Bars */}
      <div className="space-y-3">
        {categories.map(({ key, label, weight }) => {
          const catRisk = (riskIndex.risks || []).find(r => r.category === key);
          const score = catRisk ? catRisk.score : 10;
          const isExpanded = expandedCategory === key;
          const color = getRiskColor(score);

          return (
            <div
              key={key}
              className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 transition-all"
            >
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpandedCategory(isExpanded ? null : key)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                    {getCategoryIcon(key)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {label}
                      <span className="text-[10px] text-slate-400 font-normal">({weight} wt)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${color.split(' ')[0]}`}>
                    {score}/100
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color.split(' ')[1]}`}
                  style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                />
              </div>

              {/* Expanded details */}
              {isExpanded && catRisk && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    {catRisk.description}
                  </div>
                  {catRisk.signals && catRisk.signals.length > 0 && (
                    <div className="text-slate-500 flex flex-wrap gap-1 items-center">
                      <span className="font-medium text-slate-600 dark:text-slate-400">Signals:</span>
                      {catRisk.signals.map((sig, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px]">
                          {sig}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
