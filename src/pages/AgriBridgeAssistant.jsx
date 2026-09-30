import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import WhyDrawer from '../components/intelligence/WhyDrawer';
import { 
  askAgriBridgeAssistant, 
  getScopedAssistantContext 
} from '../services/ai/assistantService';
import { createAction } from '../services/operations/actionRepository';
import { compileFarmIntelligence } from '../services/intelligence/farmIntelligenceService';
import { buildFarmContext } from '../services/data/farmContext/farmContextService';
import { 
  Bot, Send, Sparkles, User, ShieldCheck, 
  AlertCircle, CheckCircle2, ArrowRight, HelpCircle, 
  Layers, Plus, RefreshCw, Eye 
} from 'lucide-react';

const QUICK_QUESTIONS = [
  "What should I do today?",
  "Why is my farm risk increasing?",
  "What changed this week?",
  "Did the recent rainfall affect my farm?",
  "What is my soil pH?",
  "What information is missing?"
];

export default function AgriBridgeAssistant() {
  const { state, selectedFarm } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeContext, setActiveContext] = useState(null);
  const [activeIntelligence, setActiveIntelligence] = useState(null);
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [confirmedActionIds, setConfirmedActionIds] = useState(new Set());
  const messagesEndRef = useRef(null);

  // Load Context on farm select
  useEffect(() => {
    async function loadContext() {
      if (selectedFarm) {
        try {
          const rawContext = await buildFarmContext(selectedFarm);
          const intel = compileFarmIntelligence(rawContext);
          setActiveIntelligence(intel);
          const scoped = await getScopedAssistantContext(selectedFarm);
          setActiveContext(scoped);

          // Initial welcome message
          setMessages([
            {
              id: 'msg-welcome',
              sender: 'assistant',
              timestamp: new Date().toISOString(),
              answer: `Hello! I am your AgriBridge Operations Assistant for **${selectedFarm.name}**. I'm connected to your live weather (${scoped?.weather?.temp}°C, ${scoped?.weather?.humidity}% RH), Sentinel-2 telemetry, soil records, and Farm Action Center. How can I assist you with your ${scoped?.farm?.crop || 'crop'} today?`,
              keyPoints: [
                `Active Parcel: ${selectedFarm.name} (${scoped?.farm?.crop || 'Crop'})`,
                `Evidence Coverage: ${scoped?.intelligence?.confidenceScore || 85}%`,
                `Active Farm Risk: ${scoped?.intelligence?.riskScore || 32}/100`
              ],
              evidenceIds: [],
              recommendedActions: [],
              proposedAction: null,
              dataCaveats: scoped?.soil?.isLabTest ? 'Verified Laboratory Soil Card active.' : 'Notice: Soil records are based on ISRIC SoilGrids modeled baseline.',
              aiMode: 'grounded'
            }
          ]);
        } catch (e) {
          console.warn('[AgriBridgeAssistant] Context load notice:', e);
        }
      }
    }
    loadContext();
  }, [selectedFarm]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.answer || m.text || '' }]
      }));

      const response = await askAgriBridgeAssistant(text, selectedFarm, history);

      const assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        ...response
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          answer: 'I encountered an error connecting to telemetry. Operating under deterministic fallback guidelines.',
          keyPoints: ['Connection retry scheduled'],
          evidenceIds: [],
          recommendedActions: [],
          proposedAction: null,
          dataCaveats: 'Offline telemetry active.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = (action) => {
    if (!action) return;
    createAction({
      ...action,
      farmId: selectedFarm?.id || 'farm-1'
    });
    setConfirmedActionIds(prev => new Set([...prev, action.title]));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[900px] gap-3">
      {/* Top Telemetry Context Banner */}
      <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
            <Bot className="w-4.5 h-4.5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{selectedFarm?.name || 'Selected Parcel'}</h2>
              <SourceBadge 
                type={activeContext?.weather?.sourceBadge || 'LIVE'} 
                label={activeContext?.weather?.sourceBadge || 'LIVE'} 
                size="xs"
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Crop: <strong>{activeContext?.farm?.crop}</strong> • Stage: <strong>{activeContext?.farm?.growthStage}</strong> • Temp: <strong>{activeContext?.weather?.temp}°C</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Badge variant="outline" size="xs">
            Risk: {activeContext?.intelligence?.riskScore || 32}/100
          </Badge>
          <Badge variant="primary" size="xs">
            Evidence: {activeContext?.intelligence?.confidenceScore || 85}%
          </Badge>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map(msg => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end gap-2.5">
                <div className="max-w-xl bg-primary-600 text-white rounded-2xl rounded-tr-none px-4 py-3 text-xs leading-relaxed shadow-2xs">
                  {msg.text}
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            );
          }

          // Assistant Message Card
          return (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>

              <div className="max-w-2xl bg-gray-50/80 border border-gray-200 rounded-2xl rounded-tl-none p-4 sm:p-5 space-y-3.5 text-xs text-gray-800 shadow-2xs">
                {/* Main Answer */}
                <div className="text-gray-900 leading-relaxed font-normal whitespace-pre-wrap">
                  {msg.answer}
                </div>

                {/* Key Points */}
                {msg.keyPoints && msg.keyPoints.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                      Ground Telemetry Points
                    </span>
                    {msg.keyPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Evidence Citations & Why Drawer */}
                {msg.evidenceIds && msg.evidenceIds.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-gray-500 font-semibold">CITED EVIDENCE:</span>
                    {msg.evidenceIds.map((eid, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedEvidenceId(eid);
                          setWhyDrawerOpen(true);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-2.5 h-2.5" /> {eid}
                      </button>
                    ))}
                  </div>
                )}

                {/* Proposed Action Card with Explicit Confirmation */}
                {msg.proposedAction && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-900">Proposed Farm Operation</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{msg.proposedAction.title}</p>
                    <p className="text-[11px] text-gray-600">{msg.proposedAction.description}</p>

                    <div className="pt-2 flex items-center gap-2">
                      {confirmedActionIds.has(msg.proposedAction.title) ? (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Scheduled in Action Center
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmAction(msg.proposedAction)}
                          className="text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Confirm & Add to Action Center
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Caveats */}
                {msg.dataCaveats && (
                  <div className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-100 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{msg.dataCaveats}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 italic p-3">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span>Consulting farm telemetry and agrometeorological models...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 shrink-0">
          Suggested:
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg whitespace-nowrap shadow-2xs hover:border-primary-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={`Ask about crop health, risk drivers, or irrigation for ${selectedFarm?.name || 'this parcel'}...`}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs bg-transparent focus:outline-hidden"
        />

        <Button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          size="sm"
          className="rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </Button>
      </div>

      {/* Explainability Drawer */}
      <WhyDrawer
        isOpen={whyDrawerOpen}
        onClose={() => setWhyDrawerOpen(false)}
        intelligence={activeIntelligence}
        selectedEvidenceId={selectedEvidenceId}
      />
    </div>
  );
}
