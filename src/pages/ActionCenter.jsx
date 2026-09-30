import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import Modal from '../components/ui/Modal';
import WhyDrawer from '../components/intelligence/WhyDrawer';
import { 
  getActions, 
  createAction, 
  startAction, 
  completeAction, 
  snoozeAction, 
  dismissAction, 
  undoAction, 
  recordActionFeedback,
  syncActionsFromIntelligence 
} from '../services/operations/actionRepository';
import { buildFarmContext } from '../services/data/farmContext/farmContextService';
import { compileFarmIntelligence } from '../services/intelligence/farmIntelligenceService';
import { 
  CheckCircle2, Clock, AlertTriangle, Play, Sparkles, 
  RotateCcw, ThumbsUp, ThumbsDown, HelpCircle, Eye, 
  Camera, Plus, Filter, Calendar, Sprout, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function ActionCenter() {
  const { state, selectedFarm } = useApp();
  const [actions, setActions] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, today, in_progress, completed, regenerative
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedFarmFilter, setSelectedFarmFilter] = useState(selectedFarm?.id || 'all');
  
  // Modals & Drawers
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [targetAction, setTargetAction] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [activeIntelligence, setActiveIntelligence] = useState(null);

  // New Action Modal
  const [newActionModalOpen, setNewActionModalOpen] = useState(false);
  const [newActionForm, setNewActionForm] = useState({
    title: '',
    description: '',
    reason: '',
    priority: 'high',
    urgency: 'today',
    category: 'operational',
    isRegenerative: false
  });

  const refreshActions = () => {
    const list = getActions(selectedFarmFilter === 'all' ? null : selectedFarmFilter);
    setActions(list);
  };

  // Sync and load actions
  useEffect(() => {
    async function loadAndSync() {
      if (selectedFarm) {
        try {
          const context = await buildFarmContext(selectedFarm);
          const intelligence = compileFarmIntelligence(context);
          setActiveIntelligence(intelligence);
          syncActionsFromIntelligence(selectedFarm.id, intelligence.candidateRecommendations);
        } catch (e) {
          console.warn('[ActionCenter] Context sync notice:', e);
        }
      }
      refreshActions();
    }
    loadAndSync();
  }, [selectedFarm]);

  useEffect(() => {
    refreshActions();
  }, [selectedFarmFilter]);

  // Actions handlers
  const handleStart = (id) => {
    startAction(id);
    refreshActions();
  };

  const handleOpenComplete = (action) => {
    setTargetAction(action);
    setCompletionNotes('');
    setCompletionPhoto(null);
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = (e) => {
    e.preventDefault();
    if (!targetAction) return;
    completeAction(targetAction.id, {
      notes: completionNotes,
      photo: completionPhoto
    });
    setCompleteModalOpen(false);
    setTargetAction(null);
    refreshActions();
  };

  const handleSnooze = (id) => {
    snoozeAction(id, 2);
    refreshActions();
  };

  const handleDismiss = (id) => {
    dismissAction(id, 'Dismissed by farmer');
    refreshActions();
  };

  const handleUndo = (id) => {
    undoAction(id);
    refreshActions();
  };

  const handleFeedback = (actionId, rating, note = '') => {
    recordActionFeedback(actionId, rating, note);
    refreshActions();
  };

  const handleCreateNewAction = (e) => {
    e.preventDefault();
    if (!newActionForm.title.trim()) return;

    createAction({
      ...newActionForm,
      farmId: selectedFarm?.id || 'farm-1'
    });

    setNewActionModalOpen(false);
    setNewActionForm({
      title: '',
      description: '',
      reason: '',
      priority: 'high',
      urgency: 'today',
      category: 'operational',
      isRegenerative: false
    });
    refreshActions();
  };

  // Filtered List
  const filteredActions = actions.filter(action => {
    if (activeTab === 'today') return action.urgency === 'today' && action.status !== 'completed' && action.status !== 'dismissed';
    if (activeTab === 'in_progress') return action.status === 'in_progress';
    if (activeTab === 'completed') return action.status === 'completed';
    if (activeTab === 'regenerative') return action.isRegenerative;
    if (activeTab === 'pending') return action.status === 'pending';
    return action.status !== 'dismissed';
  }).filter(action => {
    if (priorityFilter !== 'all') return action.priority === priorityFilter;
    return true;
  });

  const todayUrgentCount = actions.filter(a => a.urgency === 'today' && a.status === 'pending').length;
  const inProgressCount = actions.filter(a => a.status === 'in_progress').length;
  const completedCount = actions.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Farmer Action Center</h1>
            <Badge variant="primary" size="sm">Operational Hub</Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Deterministic agronomic recommendations converted into trackable, verified farm operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Farm selector filter */}
          <select
            value={selectedFarmFilter}
            onChange={(e) => setSelectedFarmFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-gray-700 shadow-2xs focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Farm Parcels ({state.farms?.length || 1})</option>
            {state.farms?.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.crops?.[0] || 'Crop'})</option>
            ))}
          </select>

          <Button 
            onClick={() => setNewActionModalOpen(true)} 
            size="sm" 
            className="text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Log Custom Task
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-rose-50/80 border border-rose-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Due Today</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">{todayUrgentCount}</div>
          <span className="text-[10px] text-rose-700">Immediate agronomic priorities</span>
        </div>

        <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">In Progress</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{inProgressCount}</div>
          <span className="text-[10px] text-blue-700">Operations underway</span>
        </div>

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Completed & Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{completedCount}</div>
          <span className="text-[10px] text-emerald-700">With outcome feedback</span>
        </div>

        <div className="p-3.5 bg-teal-50/80 border border-teal-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800">Regenerative Practices</span>
            <Sprout className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-900 mt-1">
            {actions.filter(a => a.isRegenerative).length}
          </div>
          <span className="text-[10px] text-teal-700">Soil carbon & humus targets</span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Active Tasks' },
            { id: 'today', label: `Today's Priority (${todayUrgentCount})` },
            { id: 'in_progress', label: `In Progress (${inProgressCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'regenerative', label: 'Regenerative Plan' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-primary-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end">
          <span className="text-[11px] text-gray-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-3.5">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">You're all caught up!</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No pending actions matching this filter right now. Agronomic telemetry is within normal bounds.
            </p>
          </div>
        ) : (
          filteredActions.map(action => {
            const isCompleted = action.status === 'completed';
            const isInProgress = action.status === 'in_progress';
            const isCritical = action.priority === 'critical' || action.priority === 'high';

            return (
              <Card 
                key={action.id} 
                className={`transition-all border ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : isCritical 
                    ? 'border-l-4 border-l-rose-500 border-gray-200' 
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={action.priority === 'critical' || action.priority === 'high' ? 'danger' : 'secondary'}
                          size="xs"
                        >
                          {action.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge variant="outline" size="xs">
                          {action.urgency === 'today' ? 'DUE TODAY' : action.urgency === 'this_week' ? 'THIS WEEK' : 'MONITOR'}
                        </Badge>
                        {action.isRegenerative && (
                          <Badge variant="success" size="xs" className="flex items-center gap-1">
                            <Sprout className="w-3 h-3" /> Regenerative
                          </Badge>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono">#{action.id}</span>
                      </div>

                      <h3 className={`text-base font-bold ${isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                        {action.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {action.description}
                      </p>

                      {action.reason && (
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-gray-900">Agronomic Rationale: </span>
                            {action.reason}
                          </div>
                        </div>
                      )}

                      {/* Observations Note if completed */}
                      {isCompleted && action.observationNotes && (
                        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                          <strong>Farmer Observation:</strong> "{action.observationNotes}"
                          <span className="text-[10px] text-emerald-700 block mt-0.5 font-mono">
                            Completed on {new Date(action.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Outcome Feedback Loop */}
                      {isCompleted && (
                        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">Did this action help?</span>
                            {action.feedbackOutcome ? (
                              <Badge variant="success" size="xs">
                                {action.feedbackOutcome.label}
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleFeedback(action.id, 'helpful', 'Observed positive vegetative recovery.')}
                                  className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center gap-1 font-medium"
                                >
                                  <ThumbsUp className="w-3 h-3" /> Yes
                                </button>
                                <button
                                  onClick={() => handleFeedback(action.id, 'somewhat', 'Moderate improvement observed.')}
                                  className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-medium"
                                >
                                  Somewhat
                                </button>
                                <button
                                  onClick={() => handleFeedback(action.id, 'no', 'No visible change in canopy.')}
                                  className="px-2 py-0.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded flex items-center gap-1 font-medium"
                                >
                                  <ThumbsDown className="w-3 h-3" /> No
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleUndo(action.id)}
                            className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-1 underline"
                          >
                            <RotateCcw className="w-3 h-3" /> Re-open action
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions Buttons */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                      {action.evidenceIds && action.evidenceIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEvidenceId(action.evidenceIds[0]);
                            setWhyDrawerOpen(true);
                          }}
                          className="text-xs text-primary-700 hover:text-primary-800 flex items-center gap-1.5 px-2.5 py-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Evidence ({action.evidenceIds.length})
                        </Button>
                      )}

                      {!isCompleted && (
                        <>
                          {!isInProgress ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStart(action.id)}
                              className="text-xs flex items-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 text-blue-600" /> Start
                            </Button>
                          ) : (
                            <Badge variant="primary" size="sm" className="animate-pulse">
                              In Progress
                            </Badge>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleOpenComplete(action)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                          </Button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSnooze(action.id)}
                              className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                              title="Snooze 2 days"
                            >
                              Snooze
                            </button>
                            <button
                              onClick={() => handleDismiss(action.id)}
                              className="text-[11px] text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50"
                              title="Dismiss action"
                            >
                              Dismiss
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Complete Action Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Farm Operation"
      >
        <form onSubmit={handleConfirmComplete} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900">
            <strong>Action:</strong> {targetAction?.title}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Field Observation & Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="E.g., Cleared 45 meters of drainage furrow. Water is flowing smoothly now."
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Attach Ground Verification Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer">
              <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <span className="text-xs text-gray-600 block">Click to upload field verification photo</span>
              <span className="text-[10px] text-gray-400">JPG, PNG up to 10MB</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save & Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Custom Task Modal */}
      <Modal
        isOpen={newActionModalOpen}
        onClose={() => setNewActionModalOpen(false)}
        title="Schedule Operational Task"
      >
        <form onSubmit={handleCreateNewAction} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={newActionForm.title}
              onChange={(e) => setNewActionForm(p => ({ ...p, title: e.target.value }))}
              placeholder="E.g., Apply biofertilizer drench in Block B"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Instructions</label>
            <textarea
              rows={2}
              value={newActionForm.description}
              onChange={(e) => setNewActionForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Specify target beds, application volume, or equipment requirements..."
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={newActionForm.priority}
                onChange={(e) => setNewActionForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency</label>
              <select
                value={newActionForm.urgency}
                onChange={(e) => setNewActionForm(p => ({ ...p, urgency: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="monitor">Monitor / Scheduled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRegen"
              checked={newActionForm.isRegenerative}
              onChange={(e) => setNewActionForm(p => ({ ...p, isRegenerative: e.target.checked }))}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isRegen" className="text-xs text-gray-700 font-medium">
              Link as Regenerative Agriculture Transition practice
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setNewActionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Action</Button>
          </div>
        </form>
      </Modal>

      {/* Explainability / Evidence Drawer */}
      <WhyDrawer
        isOpen={whyDrawerOpen}
        onClose={() => setWhyDrawerOpen(false)}
        intelligence={activeIntelligence}
        selectedEvidenceId={selectedEvidenceId}
      />
    </div>
  );
}
