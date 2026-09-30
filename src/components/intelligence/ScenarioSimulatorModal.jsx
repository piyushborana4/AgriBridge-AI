import React, { useState } from 'react';
import { X, Sparkles, Sliders, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SourceBadge from '../ui/SourceBadge';
import { simulateAgronomicScenario } from '../../services/intelligence/decisionEngine';

export default function ScenarioSimulatorModal({ isOpen, onClose, farmContext }) {
  const [rainModifier, setRainModifier] = useState(-30); // mm delta
  const [tempModifier, setTempModifier] = useState(2); // °C delta
  const [soilMoistureDrop, setSoilMoistureDrop] = useState(15); // % drop

  if (!isOpen || !farmContext) return null;

  const simulation = simulateAgronomicScenario(farmContext, {
    name: 'Custom Agronomic Stress Test',
    rainfallModifier: rainModifier,
    tempModifier: tempModifier,
    soilMoistureDrop: soilMoistureDrop
  });

  const baseScore = simulation?.baselineRisk ?? (farmContext.riskScore || 25);
  const simScore = simulation?.simulatedRisk ?? 45;
  const delta = simulation?.riskDelta ?? (simScore - baseScore);

  const isDeteriorating = delta > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                What-If Scenario Simulator
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                HYPOTHETICAL SIMULATION
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Test Environmental & Water Stress Scenarios
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Simulate microclimate variations to evaluate crop resilience and proactive risk posture for {farmContext.name}.
            </p>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            Adjust Simulated Environmental Variables
          </div>

          {/* Rainfall Modifier */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>7-Day Rainfall Modification:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {rainModifier >= 0 ? `+${rainModifier} mm` : `${rainModifier} mm`}
              </span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="5"
              value={rainModifier}
              onChange={(e) => setRainModifier(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Severe Drought (-60mm)</span>
              <span>Baseline (0mm)</span>
              <span>Heavy Inundation (+60mm)</span>
            </div>
          </div>

          {/* Temperature Modifier */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Ambient Peak Temperature Shift:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {tempModifier >= 0 ? `+${tempModifier}°C` : `${tempModifier}°C`}
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="8"
              step="1"
              value={tempModifier}
              onChange={(e) => setTempModifier(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Cooler (-5°C)</span>
              <span>Current</span>
              <span>Heatwave (+8°C)</span>
            </div>
          </div>

          {/* Soil Moisture Drop */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Subsoil Moisture Depletion:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                -{soilMoistureDrop}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={soilMoistureDrop}
              onChange={(e) => setSoilMoistureDrop(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Normal (0%)</span>
              <span>Moderate Deficit (20%)</span>
              <span>Severe Depletion (40%)</span>
            </div>
          </div>
        </div>

        {/* Projected Outcome Card */}
        <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm text-purple-900 dark:text-purple-200">
              Simulated Risk Impact Projection
            </div>
            <Badge variant={simScore > 50 ? 'danger' : simScore > 30 ? 'warning' : 'success'}>
              Projected Risk: {simScore}/100
            </Badge>
          </div>

          <div className="flex items-center justify-around p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900/40 text-center">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Baseline Score</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{baseScore}/100</div>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Simulated Score</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{simScore}/100</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Risk Delta</div>
              <div className={`text-xl font-bold ${isDeteriorating ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isDeteriorating ? `+${delta}` : delta} pts
              </div>
            </div>
          </div>

          {/* Top Simulated Actions */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold text-purple-900 dark:text-purple-200">
              Proactive Mitigation Actions for this Scenario:
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              {simulation?.simulatedIntelligence?.candidateRecommendations?.slice(0, 2).map((rec, i) => (
                <li key={i}>{rec.title}: {rec.action}</li>
              )) || (
                <li>Maintain supplemental irrigation scheduling to preserve root-zone hydration.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRainModifier(0);
              setTempModifier(0);
              setSoilMoistureDrop(0);
            }}
            className="text-xs text-slate-500"
          >
            Reset to Baseline
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Done Testing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
