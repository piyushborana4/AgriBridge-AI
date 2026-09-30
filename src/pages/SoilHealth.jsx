import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import { StatCard } from '../components/ui/StatCard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  Info, Download, Calendar, Droplets, TestTube, AlertTriangle, 
  CheckCircle2, FlaskConical, ShieldCheck, Edit3 
} from 'lucide-react';
import { getResolvedSoilData, getSoilHistory, getSoilRecommendations } from '../services/data/soil/soilProvider';

const SoilHealth = () => {
  const { state, dispatch, selectedFarm } = useApp();
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [testDate, setTestDate] = useState('');
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  // Edit soil test parameters state
  const [soilForm, setSoilForm] = useState({
    soilPH: 6.8,
    organicMatter: 2.8,
    nitrogen: 220,
    phosphorus: 35,
    potassium: 180,
    soilLabName: 'Regional Krishi Vigyan Lab',
    soilTestDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (selectedFarm) {
      setSoilForm({
        soilPH: selectedFarm.soilPH ?? 6.8,
        organicMatter: selectedFarm.organicMatter ?? 2.8,
        nitrogen: selectedFarm.nitrogen ?? 220,
        phosphorus: selectedFarm.phosphorus ?? 35,
        potassium: selectedFarm.potassium ?? 180,
        soilLabName: selectedFarm.soilLabName || 'Regional Krishi Vigyan Lab',
        soilTestDate: selectedFarm.soilTestDate || new Date().toISOString().split('T')[0]
      });
    }
  }, [selectedFarm]);

  if (!selectedFarm) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-[var(--color-text-secondary)]">Please select a farm to view soil health data.</p>
      </div>
    );
  }

  const soilEnvelope = getResolvedSoilData(selectedFarm);
  const soilData = soilEnvelope.data || soilEnvelope;
  const recommendations = getSoilRecommendations(selectedFarm, soilData);
  const trendData = getSoilHistory(selectedFarm.id);

  const handleScheduleTest = (e) => {
    e.preventDefault();
    if (!testDate) return;
    setScheduledSuccess(true);
    setTimeout(() => {
      setScheduledSuccess(false);
      setIsTestModalOpen(false);
      setTestDate('');
    }, 1500);
  };

  const handleSaveSoilTest = (e) => {
    e.preventDefault();
    const updated = {
      ...selectedFarm,
      soilPH: Number(soilForm.soilPH),
      organicMatter: Number(soilForm.organicMatter),
      nitrogen: Number(soilForm.nitrogen),
      phosphorus: Number(soilForm.phosphorus),
      potassium: Number(soilForm.potassium),
      soilLabName: soilForm.soilLabName,
      soilTestDate: soilForm.soilTestDate,
      soilHealth: Math.min(95, Math.round(
        (soilForm.nitrogen / 280) * 30 +
        (soilForm.phosphorus / 45) * 25 +
        (soilForm.potassium / 220) * 25 +
        (soilForm.organicMatter / 4.0) * 20
      ))
    };
    dispatch({ type: 'UPDATE_FARM', payload: updated });
    setIsLogModalOpen(false);
  };

  // Radar chart normalized metrics
  const radarData = [
    { subject: 'Nitrogen (N)', value: Math.min(100, Math.round((soilData.macronutrients.nitrogen.value / 280) * 100)), fullMark: 100 },
    { subject: 'Phosphorus (P)', value: Math.min(100, Math.round((soilData.macronutrients.phosphorus.value / 45) * 100)), fullMark: 100 },
    { subject: 'Potassium (K)', value: Math.min(100, Math.round((soilData.macronutrients.potassium.value / 220) * 100)), fullMark: 100 },
    { subject: 'Organic Matter', value: Math.min(100, Math.round((soilData.organicMatterPercent / 4.0) * 100)), fullMark: 100 },
    { subject: 'pH Balance', value: Math.min(100, Math.round(((7.0 - Math.abs(soilData.ph - 6.8)) / 7.0) * 100)), fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Source Badge & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Soil Health & Pedology</h1>
            <SourceBadge 
              type={soilData.sourceBadge} 
              label={soilData.isFarmerEntered ? 'Farmer Lab Test' : 'Modeled Baseline'} 
            />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
            <span>Confidence: <strong>{soilData.confidence}</strong></span>
            <span>•</span>
            <span>Source: <strong>{soilData.source}</strong></span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setIsLogModalOpen(true)} className="text-xs flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Log Soil Lab Test
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsReportModalOpen(true)} className="text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Report
          </Button>
          <Button size="sm" onClick={() => setIsTestModalOpen(true)} className="text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Book Soil Test
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Soil Health Index" 
          value={`${soilData.soilHealthScore}%`}
          trend={1.2}
          trendLabel={soilData.isFarmerEntered ? 'Verified Lab' : 'Modeled Baseline'}
          icon={TestTube}
        />
        <StatCard 
          label="Soil Reaction (pH)" 
          value={soilData.ph}
          description="Optimal range: 6.2 – 7.5"
          trendLabel={soilData.phStatus}
        />
        <StatCard 
          label="Organic Matter" 
          value={`${soilData.organicMatterPercent}%`}
          description="Target: >3.0%"
          trendLabel={soilData.organicMatterPercent >= 3.0 ? 'Optimal Carbon' : 'Requires Humus'}
        />
        <StatCard 
          label="Cation Exchange" 
          value={soilData.cationExchangeCapacity}
          description="CEC Nutrient Buffer"
          trendLabel={soilData.electricalConductivity}
        />
      </div>

      {/* Macronutrient Status & Radar Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macronutrients Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Primary Macronutrients (NPK Profile)</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Laboratory available nutrient concentration</p>
            </div>
            <SourceBadge type={soilData.sourceBadge} label={soilData.sourceBadge} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nitrogen */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Available Nitrogen (N)</span>
                  <Badge variant="primary">{soilData.macronutrients.nitrogen.status}</Badge>
                </div>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {soilData.macronutrients.nitrogen.value} <span className="text-xs font-normal text-gray-500">mg/kg</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Target: {soilData.macronutrients.nitrogen.target}</span>
              </div>

              {/* Phosphorus */}
              <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Phosphorus (P₂O₅)</span>
                  <Badge variant="warning">{soilData.macronutrients.phosphorus.status}</Badge>
                </div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {soilData.macronutrients.phosphorus.value} <span className="text-xs font-normal text-gray-500">mg/kg</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Target: {soilData.macronutrients.phosphorus.target}</span>
              </div>

              {/* Potassium */}
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Potassium (K₂O)</span>
                  <Badge variant="success">{soilData.macronutrients.potassium.status}</Badge>
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {soilData.macronutrients.potassium.value} <span className="text-xs font-normal text-gray-500">mg/kg</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Target: {soilData.macronutrients.potassium.target}</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Targeted Soil Amendments
              </span>
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-xs">
                  <FlaskConical className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block">{rec.title}</span>
                    <p className="text-gray-600 mt-0.5">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Nutrient Balance Polygon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Soil Metric" dataKey="value" stroke="#059669" fill="#10b981" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Soil Test Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Verified Soil Laboratory Test"
      >
        <form onSubmit={handleSaveSoilTest} className="space-y-4">
          <p className="text-xs text-gray-600">
            Enter test parameters from your official Soil Health Card (SHC) or accredited soil testing laboratory.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Testing Lab Name</label>
              <input
                type="text"
                value={soilForm.soilLabName}
                onChange={(e) => setSoilForm(p => ({ ...p, soilLabName: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sampling Date</label>
              <input
                type="date"
                value={soilForm.soilTestDate}
                onChange={(e) => setSoilForm(p => ({ ...p, soilTestDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Soil pH (0-14)</label>
              <input
                type="number"
                step="0.1"
                value={soilForm.soilPH}
                onChange={(e) => setSoilForm(p => ({ ...p, soilPH: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organic Matter (%)</label>
              <input
                type="number"
                step="0.1"
                value={soilForm.organicMatter}
                onChange={(e) => setSoilForm(p => ({ ...p, organicMatter: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">N (mg/kg)</label>
              <input
                type="number"
                value={soilForm.nitrogen}
                onChange={(e) => setSoilForm(p => ({ ...p, nitrogen: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">P (mg/kg)</label>
              <input
                type="number"
                value={soilForm.phosphorus}
                onChange={(e) => setSoilForm(p => ({ ...p, phosphorus: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">K (mg/kg)</label>
              <input
                type="number"
                value={soilForm.potassium}
                onChange={(e) => setSoilForm(p => ({ ...p, potassium: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Verified Soil Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* Book Test Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Schedule Soil Sample Collection"
      >
        <form onSubmit={handleScheduleTest} className="space-y-4">
          {scheduledSuccess ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Sample collection booked successfully!</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                A certified field technician will visit {selectedFarm.name} to collect core samples (12 GPS grid points).
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsTestModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Confirm Booking</Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Download Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Export Soil Pedology Report"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            Summary export for <strong>{selectedFarm.name}</strong> containing full NPK balance, cation exchange capacity, and biological recommendations.
          </p>
          <div className="p-3 bg-gray-50 rounded-lg border text-xs font-mono space-y-1">
            <div>PARCEL: {selectedFarm.name}</div>
            <div>STATUS: {soilData.confidence}</div>
            <div>NPK: {soilData.macronutrients.nitrogen.value} / {soilData.macronutrients.phosphorus.value} / {soilData.macronutrients.potassium.value} mg/kg</div>
            <div>pH: {soilData.ph} | OM: {soilData.organicMatterPercent}%</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>Close</Button>
            <Button onClick={() => setIsReportModalOpen(false)}>Download PDF</Button>
          </div>
        </div>
      </Modal>

      <p className="text-center text-[10px] text-[var(--color-text-tertiary)] pt-3 border-t border-[var(--color-border)]">
        Soil intelligence framework aligned with ICAR Soil Health Card standards and ISRIC SoilGrids pedological maps.
      </p>
    </div>
  );
};

export default SoilHealth;
