import React from 'react';
import { Calendar, Satellite, CloudRain, Thermometer, Layers, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import SourceBadge from '../ui/SourceBadge';

export default function IntelligenceTimeline({ events = [], className = '' }) {
  if (!events || events.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 ${className}`}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Farm Event Timeline
        </h3>
        <p className="text-xs text-slate-500">No chronological timeline events recorded yet.</p>
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'satellite_observation':
        return <Satellite className="w-4 h-4 text-blue-600" />;
      case 'weather_alert':
        return <CloudRain className="w-4 h-4 text-indigo-600" />;
      case 'soil_analysis':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'farmer_action':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'risk_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Farm Event Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological log of multi-sensor acquisitions, weather anomalies, and actions
          </p>
        </div>
        <SourceBadge type="LIVE" size="xs" />
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {events.slice(0, 6).map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-2xs group-hover:border-emerald-500 transition-colors">
              <span className="scale-75">{getEventIcon(evt.type)}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {evt.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(evt.timestamp).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {evt.summary}
              </p>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>Source: {evt.source}</span>
                <Badge variant={evt.badgeColor === 'green' ? 'success' : evt.badgeColor === 'rose' ? 'danger' : 'info'} size="xs">
                  {evt.badge}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
