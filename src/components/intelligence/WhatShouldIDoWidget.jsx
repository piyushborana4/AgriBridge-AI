import React, { useState } from 'react';
import { CheckCircle2, Clock, Eye, AlertTriangle, Check, ThumbsUp, ThumbsDown, HelpCircle, Bell, ArrowRight, Sparkles } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function WhatShouldIDoWidget({ recommendations = [], onActionCompleted, onOpenWhyEvidence, className = '' }) {
  const [completedActions, setCompletedActions] = useState(new Set());
  const [feedback, setFeedback] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleMarkDone = (id, title) => {
    const updated = new Set(completedActions);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
      if (onActionCompleted) {
        onActionCompleted({ id, title, timestamp: new Date().toISOString() });
      }
    }
    setCompletedActions(updated);
  };

  const handleFeedback = (id, response) => {
    setFeedback(prev => ({ ...prev, [id]: response }));
  };

  const filteredRecs = recommendations.filter(r => {
    if (selectedFilter === 'all') return true;
    return r.urgency === selectedFilter;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'immediate':
      case 'today':
        return <Badge variant="danger" size="xs">Action Today</Badge>;
      case 'this_week':
        return <Badge variant="warning" size="xs">This Week</Badge>;
      default:
        return <Badge variant="info" size="xs">Monitor</Badge>;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              What Should I Do?
            </h3>
            <span className="text-xs text-slate-400">({recommendations.length} prioritized actions)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational recommendations strictly grounded in verified crop telemetry
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          {['all', 'immediate', 'this_week', 'monitor'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 rounded-lg transition-colors capitalize ${
                selectedFilter === filter
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'immediate' ? 'Today' : filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      {filteredRecs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
          <p className="text-xs text-slate-500 mt-1">No pending actions for the selected timeframe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecs.map((rec, idx) => {
            const isDone = completedActions.has(rec.id || `rec-${idx}`);
            const fb = feedback[rec.id || `rec-${idx}`];

            return (
              <div
                key={rec.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 opacity-75'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleMarkDone(rec.id || `rec-${idx}`, rec.title || rec.action)}
                      className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                          {rec.title || rec.action}
                        </span>
                        {getUrgencyBadge(rec.urgency)}
                        {rec.category && (
                          <Badge variant="outline" size="xs">
                            {rec.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rec.action !== rec.title ? rec.action : rec.rationale}
                      </p>

                      {rec.rationale && rec.action !== rec.title && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          Rationale: {rec.rationale}
                        </p>
                      )}

                      {/* Evidence Tags & Explainability Trigger */}
                      {rec.evidenceIds && rec.evidenceIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">Grounded in:</span>
                          {rec.evidenceIds.map(evId => (
                            <button
                              key={evId}
                              onClick={() => onOpenWhyEvidence && onOpenWhyEvidence(evId)}
                              className="text-[10px] font-mono px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors"
                            >
                              #{evId}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Mechanism */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400">Helpful?</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleFeedback(rec.id || `rec-${idx}`, 'yes')}
                        className={`p-1 rounded border text-xs transition-colors ${
                          fb === 'yes'
                            ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-700'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Yes, helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(rec.id || `rec-${idx}`, 'no')}
                        className={`p-1 rounded border text-xs transition-colors ${
                          fb === 'no'
                            ? 'bg-rose-100 dark:bg-rose-950 border-rose-300 text-rose-700'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Link to Action Center */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">Track operations, schedule tasks & record feedback</span>
        <a 
          href="/action-center" 
          className="font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          Open Action Center <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
