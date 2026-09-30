import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { regenerativePlanSteps } from '../data/mockData';
import { getRegenerativePlanInsights } from '../services/ai/regenerativeService';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import { StatCard } from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Share2,
  Sprout,
  Wind,
  Droplets,
  Bird,
  Sparkles,
  Info,
  Layers,
  ShieldCheck
} from 'lucide-react';

const StepCard = ({ step, index, totalSteps, expanded, toggleExpand, onTaskToggle }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'upcoming': return 'secondary';
      default: return 'secondary';
    }
  };

  const completedTasks = step.tasks ? step.tasks.filter(t => t.completed).length : 0;
  const totalTasks = step.tasks ? step.tasks.length : 0;

  return (
    <div className="relative pl-8 md:pl-0 mb-8">
      {/* Mobile timeline connector */}
      <div className={`md:hidden absolute left-3 top-10 bottom-[-2rem] w-px bg-[var(--color-border)] ${index === totalSteps - 1 ? 'hidden' : ''}`}></div>
      
      <div className={`md:w-1/2 relative ${index % 2 === 0 ? 'md:pr-12 md:mr-auto' : 'md:pl-12 md:ml-auto'}`}>
        
        {/* Desktop timeline node */}
        <div className={`hidden md:flex absolute top-6 w-8 h-8 rounded-full bg-[var(--color-surface)] border-4 border-[var(--color-surface)] shadow-sm items-center justify-center z-10
          ${step.status === 'completed' ? 'bg-[var(--color-primary-500)] text-white' : 
            step.status === 'in-progress' ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-[var(--color-primary-300)]' : 
            'bg-gray-100 text-gray-400 border-gray-200'}`}
          style={{ 
            ...(index % 2 === 0 ? { right: '-2rem', transform: 'translateX(50%)' } : { left: '-2rem', transform: 'translateX(-50%)' }) 
          }}>
          {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> : 
           step.status === 'in-progress' ? <Clock className="w-4 h-4" /> : 
           <Circle className="w-4 h-4" />}
        </div>

        {/* Mobile timeline node */}
        <div className={`md:hidden absolute left-[-1.5rem] top-6 w-6 h-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center z-10
          ${step.status === 'completed' ? 'text-[var(--color-primary-500)]' : 
            step.status === 'in-progress' ? 'text-[var(--color-primary-500)]' : 
            'text-gray-400'}`}>
          {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5 bg-white rounded-full" /> : 
           step.status === 'in-progress' ? <Clock className="w-5 h-5 bg-white rounded-full" /> : 
           <Circle className="w-5 h-5 bg-white rounded-full" />}
        </div>

        <Card className={`transition-all duration-200 ${step.status === 'in-progress' ? 'ring-2 ring-[var(--color-primary-300)]' : ''}`}>
          <CardHeader className="pb-2 cursor-pointer" onClick={toggleExpand}>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="secondary">{step.phase}</Badge>
              <Badge variant={getStatusColor(step.status)}>
                {step.status.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>{step.title}</span>
              {expanded ? <ChevronUp className="w-5 h-5 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" />}
            </CardTitle>
            <div className="text-sm text-[var(--color-text-secondary)] font-medium mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Duration: {step.duration}
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              {step.description}
            </p>
            
            {totalTasks > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Tasks</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{completedTasks}/{totalTasks} Completed</span>
                </div>
                
                {/* Progress bar for tasks */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${step.status === 'completed' ? 'bg-green-500' : 'bg-[var(--color-primary-500)]'}`}
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>

                {expanded && (
                  <div className="space-y-2 mt-4 pt-2 border-t border-[var(--color-border)]">
                    {step.tasks && step.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-surface-secondary)] cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskToggle(step.id, task.id);
                        }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <span className={`text-sm ${task.completed ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-text-secondary)]'}`}>
                          {task.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function RegenerativePlan() {
  const { selectedFarm } = useApp();
  const [aiInsights, setAiInsights] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  const [steps, setSteps] = useState(() => {
    return (regenerativePlanSteps || []).map(step => ({
      ...step,
      tasks: (step.tasks || []).map((t, i) => ({ 
        id: t.id || `task-${step.id}-${i}`, 
        description: typeof t === 'string' ? t : t.description,
        completed: typeof t === 'string' ? (step.status === 'completed') : !!t.completed 
      }))
    }));
  });

  const [expandedSteps, setExpandedSteps] = useState({
    [steps.find(s => s.status === 'in-progress')?.id || steps[0]?.id]: true
  });

  // Load tailored regenerative AI insights
  useEffect(() => {
    if (selectedFarm) {
      let isMounted = true;
      getRegenerativePlanInsights(selectedFarm).then(res => {
        if (isMounted && res.success && res.data) {
          setAiInsights(res.data);
        }
      });
      return () => { isMounted = false; };
    }
  }, [selectedFarm?.id]);

  const toggleExpand = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleTaskToggle = (stepId, taskId) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        tasks: step.tasks.map(task => {
          if (task.id !== taskId) return task;
          return { ...task, completed: !task.completed };
        })
      };
    }));
  };

  const progressStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    
    steps.forEach(step => {
      if (step.tasks) {
        total += step.tasks.length;
        completed += step.tasks.filter(t => t.completed).length;
      }
    });
    
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    return { total, completed, percentage };
  }, [steps]);

  if (!selectedFarm) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <p className="text-[var(--color-text-secondary)]">Please select a farm to view its regenerative plan.</p>
      </div>
    );
  }

  // Regenerative readiness factor checklist
  const readinessFactors = [
    { factor: 'Micro-Irrigation Adoption', status: 'Optimal', points: '+25 pts', active: selectedFarm.irrigationType?.toLowerCase().includes('drip') },
    { factor: 'Soil Organic Matter > 2.5%', status: 'Favorable', points: '+25 pts', active: (selectedFarm.organicMatter || 0) >= 2.5 },
    { factor: 'Crop Rotation / Multi-Cropping', status: 'Active', points: '+25 pts', active: (selectedFarm.crops || []).length > 1 },
    { factor: 'Verified Soil Lab Baseline', status: 'Verified', points: '+25 pts', active: Boolean(selectedFarm.soilTestDate || selectedFarm.nitrogen > 0) }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Regenerative Transition Plan
            </h1>
            <SourceBadge type="AI INTERPRETATION" label="Soil Carbon Model" />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            12-month biological stewardship and carbon sequestration roadmap for <span className="font-semibold text-[var(--color-text-primary)]">{selectedFarm.name}</span>
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowShareModal(true)} icon={Share2}>
            Share with Advisor
          </Button>
          <Button size="sm" onClick={() => setShowDownloadModal(true)} icon={Download}>
            Download Dossier
          </Button>
        </div>
      </div>

      {/* Progress & Readiness Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-2/3">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Overall Roadmap Progress</span>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">{progressStats.percentage}%</div>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {progressStats.completed} of {progressStats.total} tasks completed
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progressStats.percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg text-center border border-[var(--color-border)]">
                <div className="text-xl font-bold text-emerald-600">
                  {steps.filter(s => s.status === 'completed').length} / {steps.length}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] font-semibold uppercase">Phases Done</div>
              </div>
              <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg text-center border border-[var(--color-border)]">
                <div className="text-xl font-bold text-primary-600">
                  {aiInsights?.score || 74}%
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] font-semibold uppercase">Readiness Score</div>
              </div>
            </div>
          </div>

          {/* Readiness Factor Checklist */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
              Regenerative Readiness Factor Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {readinessFactors.map((rf, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                  <span className="text-gray-700 font-medium">{rf.factor}</span>
                  <span className={`font-bold ${rf.active ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {rf.active ? rf.points : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tailored AI Recommended Practices */}
      {aiInsights?.recommendedPractices && aiInsights.recommendedPractices.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            AI-Tailored Agronomic Interventions for {selectedFarm.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.recommendedPractices.map((rec, idx) => (
              <Card key={idx} className="h-full flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <Badge variant="primary" className="text-[10px]">{rec.timeHorizon}</Badge>
                  </div>
                  <CardTitle className="text-sm font-bold">{rec.practice}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
                    {rec.reason}
                  </p>
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-2.5 rounded-lg text-xs font-medium">
                    <span className="font-bold">Projected Benefit: </span>{rec.expectedBenefit}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Projected Impact Cards */}
      <div>
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3">Projected Soil & Ecological Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Soil Organic Matter"
            value="+1.2%"
            icon={Sprout}
            description="Projected increase over 3 years"
            trend={1.2}
          />
          <StatCard
            label="Carbon Sequestration"
            value="2.4"
            unit=" t CO2/ha/yr"
            icon={Wind}
            description="Estimated carbon drawdown"
            trend={2.4}
          />
          <StatCard
            label="Water Retention"
            value="+15%"
            icon={Droplets}
            description="Improved infiltration capacity"
            trend={15}
          />
          <StatCard
            label="Biodiversity Index"
            value="+28%"
            icon={Bird}
            description="Expected increase in flora/fauna"
            trend={28}
          />
        </div>
      </div>

      {/* Transition Timeline */}
      <div>
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-6">Transition Timeline</h2>
        
        <div className="relative max-w-4xl mx-auto py-4">
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-[var(--color-border)] -translate-x-1/2"></div>
          
          {steps.map((step, index) => (
            <StepCard 
              key={step.id}
              step={step}
              index={index}
              totalSteps={steps.length}
              expanded={!!expandedSteps[step.id]}
              toggleExpand={() => toggleExpand(step.id)}
              onTaskToggle={handleTaskToggle}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Transition Plan with District Agronomist"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-secondary)]">
          <p>
            Share the active 12-month regenerative transition plan for <strong className="text-[var(--color-text-primary)]">{selectedFarm.name}</strong> with your agricultural advisor or cooperative officer.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">Advisor Email / Extension Code</label>
            <input 
              type="text" 
              defaultValue="kvk-agronomist@agri.gov.in"
              className="w-full p-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShowShareModal(false)}>Cancel</Button>
            <Button onClick={() => { alert('Transition plan dispatched to advisor.'); setShowShareModal(false); }}>
              Send Plan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Export Regenerative Transition Plan"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-secondary)]">
          <p>
            Generate a comprehensive PDF dossier containing the complete 12-month timeline, biological soil benchmarks, task logs, and AI recommendations for <strong className="text-[var(--color-text-primary)]">{selectedFarm.name}</strong>.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShowDownloadModal(false)}>Cancel</Button>
            <Button onClick={() => { alert('Regenerative plan dossier exported.'); setShowDownloadModal(false); }} icon={Download}>
              Download PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
