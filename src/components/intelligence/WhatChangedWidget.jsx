import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, Clock, Activity, CloudRain, Droplets, Thermometer, Leaf } from 'lucide-react';
import Badge from '../ui/Badge';
import SourceBadge from '../ui/SourceBadge';

export default function WhatChangedWidget({ whatChanged, className = '' }) {
  if (!whatChanged || !whatChanged.items || whatChanged.items.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            What Changed?
          </h3>
          <SourceBadge type="LATEST OBSERVATION" size="xs" />
        </div>
        <p className="text-xs text-slate-500">No significant parameter changes detected in recent telemetry cycles.</p>
      </div>
    );
  }

  const getMetricIcon = (category) => {
    switch (category) {
      case 'vegetation':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'weather':
        return <CloudRain className="w-4 h-4 text-blue-600" />;
      case 'soil':
        return <Droplets className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return <Badge variant="danger" size="xs">Significant Shift</Badge>;
      case 'moderate':
        return <Badge variant="warning" size="xs">Moderate Shift</Badge>;
      default:
        return <Badge variant="success" size="xs">Normal Range</Badge>;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              What Changed?
            </h3>
            <span className="text-xs text-slate-400">({whatChanged.changesCount} tracked metrics)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sequential telemetry delta across satellite, weather, and soil horizons
          </p>
        </div>
        <SourceBadge type="LATEST OBSERVATION" size="xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {whatChanged.items.map((item) => {
          const isPos = item.percentageChange > 0;
          const isNeg = item.percentageChange < 0;

          return (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between space-y-2.5 transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                    {getMetricIcon(item.category)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.metric}
                  </span>
                </div>
                {getSeverityBadge(item.severity)}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.current}
                  </span>
                  {item.previous !== undefined && (
                    <span className="text-xs text-slate-400 ml-1.5 line-through">
                      {item.previous}
                    </span>
                  )}
                </div>

                {item.percentageChange !== undefined && item.percentageChange !== null && (
                  <div className={`flex items-center text-xs font-bold ${
                    item.severity === 'high' ? 'text-rose-600 dark:text-rose-400' :
                    isPos ? 'text-emerald-600 dark:text-emerald-400' :
                    isNeg ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                  }`}>
                    {isPos && <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />}
                    {isNeg && <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
                    {isPos ? `+${item.percentageChange}%` : `${item.percentageChange}%`}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
