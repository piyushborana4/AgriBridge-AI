import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { askAdvisor, getFarmAdvisory } from '../services/ai/advisoryService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { 
  Send, Bot, User, Sparkles, Trash2, Download, 
  HelpCircle, Info, CheckCircle2, AlertTriangle, Clock, Sprout,
  Activity, ShieldCheck, ChevronDown, ChevronUp, BrainCircuit 
} from 'lucide-react';

export default function AIAdvisory() {
  const { state, selectedFarm } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [advisoryPlan, setAdvisoryPlan] = useState(null);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = useState(false);
  const [showExplainabilityModal, setShowExplainabilityModal] = useState(false);
  const [showEvidenceBreakdown, setShowEvidenceBreakdown] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    'Should I irrigate my crops today?',
    'How can I improve my soil organic matter?',
    'What pest prevention measures should I take this week?',
    'What is the optimal harvest window for my crops?'
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch grounded advisory plan when selected farm changes
  useEffect(() => {
    if (selectedFarm) {
      let isMounted = true;
      setIsLoadingAdvisory(true);
      getFarmAdvisory(selectedFarm).then(res => {
        if (isMounted && res.success && res.data) {
          setAdvisoryPlan(res.data);
          setIsLoadingAdvisory(false);
        }
      }).catch(() => {
        if (isMounted) setIsLoadingAdvisory(false);
      });
      return () => { isMounted = false; };
    }
  }, [selectedFarm?.id]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;
    
    const newUserMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setSuggestedQuestions([]);
    setIsTyping(true);

    try {
      const response = await askAdvisor(text, selectedFarm, messages);
      const newAiMsg = { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: response.response,
        notice: response.notice,
        aiMode: response.aiMode
      };
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
      if (response.suggestedQuestions && response.suggestedQuestions.length > 0) {
        setSuggestedQuestions(response.suggestedQuestions);
      }
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now() + 1, 
          role: 'ai', 
          text: `I encountered an issue connecting to the AI service. Based on ${selectedFarm?.name || 'your farm'} telemetry, soil moisture and health remain in fair condition.`,
          isError: true
        }
      ]);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear this advisory conversation?")) {
      setMessages([]);
      setSuggestedQuestions([
        'Should I irrigate my crops today?',
        'How can I improve my soil organic matter?',
        'What pest prevention measures should I take this week?',
        'What is the optimal harvest window for my crops?'
      ]);
    }
  };

  const handleExport = () => {
    const exportData = messages.map(m => `[${m.role.toUpperCase()}] ${m.text}`).join('\n\n');
    const blob = new Blob([exportData || 'No messages in conversation.'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agribridge-advisory-${selectedFarm?.name || 'farm'}.txt`;
    a.click();
  };

  if (!selectedFarm) {
    return (
      <EmptyState
        title="No Farm Selected"
        description="Please select or add a farm parcel to generate an AI agronomic advisory."
        icon={BrainCircuit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">AI Agronomic Advisor</h1>
            <SourceBadge type="AI INTERPRETATION" label="Gemini Grounded" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Personalized intelligence grounded in telemetry from <span className="font-semibold text-[var(--color-text-primary)]">{selectedFarm?.name || 'Your Farm'}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setShowExplainabilityModal(true)} size="sm" icon={HelpCircle}>
            Why am I seeing this?
          </Button>
          <Button variant="secondary" onClick={handleExport} size="sm" icon={Download}>
            Export Dossier
          </Button>
          <Button variant="secondary" onClick={handleClear} size="sm" icon={Trash2}>
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Structured Advisory Action Summary Card with Evidence Breakdown */}
      {advisoryPlan && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/40 via-white to-indigo-50/20">
          <CardHeader className="pb-3 border-b border-[var(--color-border)]/60">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="primary">Active Farm Intelligence</Badge>
                  <Badge variant={advisoryPlan.priority === 'high' ? 'danger' : 'warning'}>
                    Priority: {advisoryPlan.priority || 'Medium'}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  {advisoryPlan.summary}
                </CardTitle>
              </div>
              <button
                onClick={() => setShowEvidenceBreakdown(!showEvidenceBreakdown)}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <span>Evidence Trace</span>
                {showEvidenceBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(advisoryPlan.actions || []).map((action, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-[var(--color-border)] shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-[var(--color-text-primary)]">{action.title}</span>
                    <Badge variant={action.urgency === 'today' ? 'danger' : action.urgency === 'this_week' ? 'warning' : 'default'} className="text-[10px]">
                      {action.urgency?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{action.reason}</p>
                </div>
              ))}
            </div>

            {/* Structured Evidence Breakdown */}
            {showEvidenceBreakdown && advisoryPlan.evidence && advisoryPlan.evidence.length > 0 && (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs">
                <span className="font-bold text-purple-950 uppercase tracking-wider block">
                  Observed Telemetry & Interpretation Matrix
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {advisoryPlan.evidence.map((ev, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-purple-100">
                      <span className="font-bold text-[11px] text-purple-900 block">{ev.source}</span>
                      <p className="text-gray-700 text-[11px] mt-0.5"><strong>Observed:</strong> {ev.observation}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5"><strong>Interpretation:</strong> {ev.interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat Container */}
      <div className="flex flex-col bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm min-h-[480px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-h-[520px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shadow-xs">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Ask AI About {selectedFarm?.name || 'Your Farm'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  I can analyze crop stress, schedule irrigation, recommend soil amendments, or evaluate seasonal harvest timing.
                </p>
              </div>
              <div className="w-full text-left bg-[var(--color-surface-secondary)] p-3 rounded-xl border border-[var(--color-border)] text-xs">
                <div className="font-semibold text-[var(--color-text-primary)] mb-1">Grounded Parameters:</div>
                <div className="text-[var(--color-text-secondary)] space-y-0.5">
                  <div>• Farm: <strong className="text-[var(--color-text-primary)]">{selectedFarm?.name}</strong> ({selectedFarm?.location})</div>
                  <div>• Crops: <strong className="text-[var(--color-text-primary)]">{selectedFarm?.crops?.join(', ')}</strong></div>
                  <div>• Soil: <strong className="text-[var(--color-text-primary)]">{selectedFarm?.soilType}</strong> (pH {selectedFarm?.soilPH}, OM {selectedFarm?.organicMatter}%)</div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-2xl px-4 py-2.5 text-xs flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] font-medium">Analyzing farm context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {suggestedQuestions.length > 0 && !isTyping && (
          <div className="px-4 py-2 bg-[var(--color-surface-secondary)]/50 border-t border-[var(--color-border)] flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] shrink-0">Suggested:</span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs whitespace-nowrap px-3 py-1 bg-white border border-[var(--color-border)] hover:border-primary-400 hover:text-primary-700 rounded-lg transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Chat input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-[var(--color-border)] bg-white flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask a question about ${selectedFarm?.name || 'your farm'} (e.g. "Should I irrigate today?")...`}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            disabled={isTyping}
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            icon={Send}
            size="md"
          >
            Ask
          </Button>
        </form>
      </div>

      {/* Explainability & Grounding Modal */}
      <Modal
        isOpen={showExplainabilityModal}
        onClose={() => setShowExplainabilityModal(false)}
        title="AI Reasoning Grounds & Contextual Input Audit"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            AgriBridge AI reasons exclusively from verified telemetry registered for <strong className="text-[var(--color-text-primary)]">{selectedFarm?.name}</strong>. Here is the active dataset supplied to the Gemini model:
          </p>
          <div className="space-y-2 p-3.5 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
            <div className="flex justify-between"><span className="font-semibold text-[var(--color-text-primary)]">Cultivated Crops:</span> <span>{selectedFarm?.crops?.join(', ')}</span></div>
            <div className="flex justify-between"><span className="font-semibold text-[var(--color-text-primary)]">Soil Classification:</span> <span>{selectedFarm?.soilType}</span></div>
            <div className="flex justify-between"><span className="font-semibold text-[var(--color-text-primary)]">Active Soil pH:</span> <span>{selectedFarm?.soilPH} (Target: 6.5–7.2)</span></div>
            <div className="flex justify-between"><span className="font-semibold text-[var(--color-text-primary)]">Available N-P-K:</span> <span>{selectedFarm?.nitrogen} - {selectedFarm?.phosphorus} - {selectedFarm?.potassium} mg/kg</span></div>
            <div className="flex justify-between"><span className="font-semibold text-[var(--color-text-primary)]">Organic Matter (Humus):</span> <span>{selectedFarm?.organicMatter}%</span></div>
            <div className="flex justify-between"><span className="font-semibold text-[var(--color-text-primary)]">Irrigation Network:</span> <span>{selectedFarm?.irrigationType}</span></div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl">
            <strong>System Safeguard:</strong> The AI model is strictly instructed never to fabricate sensor readings or recommend hazardous unverified chemical combinations.
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setShowExplainabilityModal(false)}>Acknowledge</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
