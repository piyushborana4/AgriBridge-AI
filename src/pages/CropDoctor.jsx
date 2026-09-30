import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { cropDoctorDiagnoses } from '../data/mockData';
import { analyzeCropImage, validateCropImage } from '../services/ai/cropDoctorService';
import { 
  getCases, 
  createCase, 
  addCaseFollowUp, 
  updateCaseStatus 
} from '../services/operations/cropDoctorRepository';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { 
  Upload, Image as ImageIcon, Camera, CheckCircle, 
  AlertTriangle, ChevronDown, ChevronUp, RotateCcw,
  Info, Activity, X, Leaf, ShieldAlert, Save, FileText,
  HelpCircle, Eye, AlertCircle, Compass, Radio, Calendar,
  ArrowRight, Sparkles, Plus
} from 'lucide-react';

const CROP_DOCTOR_STAGES = {
  UPLOAD: 'UPLOAD',
  PREVIEW: 'PREVIEW',
  ANALYZING: 'ANALYZING',
  RESULT: 'RESULT'
};

const SAMPLE_IMAGE_URL = 'https://images.unsplash.com/photo-1595841696677-647d6e80b27b?q=80&w=600&auto=format&fit=crop';

const getSeverityBadgeVariant = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'high': return 'danger';
    case 'moderate': return 'warning';
    case 'low': return 'success';
    default: return 'default';
  }
};

const CropDoctor = () => {
  const { state, selectedFarm } = useApp();
  
  const [currentStage, setCurrentStage] = useState(CROP_DOCTOR_STAGES.UPLOAD);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSampleImage, setIsSampleImage] = useState(false);
  const [error, setError] = useState('');
  const [analyzingText, setAnalyzingText] = useState('Preparing image...');
  
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [cases, setCases] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState([]);
  const [showExplainabilityModal, setShowExplainabilityModal] = useState(false);

  // Follow-up modal state
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedCaseForFollowUp, setSelectedCaseForFollowUp] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({
    note: '',
    conditionStatus: 'improving',
    diagnosis: ''
  });
  
  const fileInputRef = useRef(null);

  const availableCrops = selectedFarm && selectedFarm.crops ? selectedFarm.crops : ['Wheat', 'Rice', 'Cotton'];

  const refreshCases = () => {
    const list = getCases(selectedFarm?.id || 'farm-1');
    setCases(list);
  };

  useEffect(() => {
    refreshCases();
  }, [selectedFarm]);

  const toggleHistoryExpand = (id) => {
    setExpandedHistory(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setError('');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validation = validateCropImage(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      setImageFile(file);
      setIsSampleImage(false);
      setImagePreview(URL.createObjectURL(file));
      setCurrentStage(CROP_DOCTOR_STAGES.PREVIEW);
    }
  };

  const handleFileSelect = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateCropImage(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      setImageFile(file);
      setIsSampleImage(false);
      setImagePreview(URL.createObjectURL(file));
      setCurrentStage(CROP_DOCTOR_STAGES.PREVIEW);
    }
  };

  const handleUseSampleImage = () => {
    setError('');
    const targetCrop = selectedCrop || availableCrops[0] || 'Wheat';
    setSelectedCrop(targetCrop);
    setImageFile(null);
    setIsSampleImage(true);
    setImagePreview(SAMPLE_IMAGE_URL);
    setCurrentStage(CROP_DOCTOR_STAGES.PREVIEW);
  };

  const startAnalysis = async () => {
    if (!selectedCrop) {
      setError('Please select a target crop before running AI diagnosis.');
      setCurrentStage(CROP_DOCTOR_STAGES.UPLOAD);
      return;
    }
    
    setError('');
    setCurrentStage(CROP_DOCTOR_STAGES.ANALYZING);
    setAnalyzingText('Uploading foliar specimen...');

    const t1 = setTimeout(() => setAnalyzingText('Analyzing foliar lesions and venation...'), 700);
    const t2 = setTimeout(() => setAnalyzingText('Correlating with farm weather & growth stage...'), 1500);
    const t3 = setTimeout(() => setAnalyzingText('Synthesizing diagnostic report...'), 2300);
    
    try {
      const result = await analyzeCropImage({
        file: imageFile,
        crop: selectedCrop,
        sampleUrl: isSampleImage ? SAMPLE_IMAGE_URL : null,
        farm: selectedFarm
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (result.success && result.data) {
        setCurrentDiagnosis(result.data);
        setCurrentStage(CROP_DOCTOR_STAGES.RESULT);
      } else {
        setError(result.error || 'AI service temporarily unavailable.');
        setCurrentStage(CROP_DOCTOR_STAGES.PREVIEW);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setError('AI service encountered an unexpected error. Please try again.');
      setCurrentStage(CROP_DOCTOR_STAGES.PREVIEW);
    }
  };

  const handleSaveDiagnosis = () => {
    if (currentDiagnosis) {
      createCase({
        ...currentDiagnosis,
        farmId: selectedFarm?.id || 'farm-1',
        crop: currentDiagnosis.crop || selectedCrop,
        image: imagePreview
      });
      refreshCases();
      resetWorkflow();
    }
  };

  const handleOpenFollowUp = (c, e) => {
    e.stopPropagation();
    setSelectedCaseForFollowUp(c);
    setFollowUpForm({
      note: '',
      conditionStatus: 'improving',
      diagnosis: `Follow-up inspection for ${c.diagnosis}`
    });
    setFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!selectedCaseForFollowUp) return;

    addCaseFollowUp(selectedCaseForFollowUp.caseId, {
      note: followUpForm.note,
      conditionStatus: followUpForm.conditionStatus,
      diagnosis: followUpForm.diagnosis
    });

    setFollowUpModalOpen(false);
    setSelectedCaseForFollowUp(null);
    refreshCases();
  };

  const resetWorkflow = () => {
    setCurrentStage(CROP_DOCTOR_STAGES.UPLOAD);
    setImageFile(null);
    setImagePreview(null);
    setIsSampleImage(false);
    setCurrentDiagnosis(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Crop Doctor</h1>
            <SourceBadge type="AI INTERPRETATION" label="Multimodal Vision AI" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Pathology diagnostics grounded in farm weather, phenology, and leaf imagery for <span className="font-semibold text-[var(--color-text-primary)]">{selectedFarm?.name || 'Your Farm'}</span>
          </p>
        </div>
        {currentStage !== CROP_DOCTOR_STAGES.UPLOAD && (
          <Button variant="secondary" onClick={resetWorkflow} icon={RotateCcw}>
            New Diagnosis
          </Button>
        )}
      </div>
      
      {/* Safety Notice */}
      <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <strong>Pathology & Safety Guidelines:</strong> AgriBridge AI provides visual observations and cultural management recommendations. It does not prescribe exact chemical dosages. Consult your local agricultural extension service (KVK) for verified chemical protocols.
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* UPLOAD STAGE */}
          {currentStage === CROP_DOCTOR_STAGES.UPLOAD && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                  1. Select Target Crop *
                </label>
                <select 
                  className="w-full max-w-md p-2.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedCrop}
                  onChange={(e) => {
                    setSelectedCrop(e.target.value);
                    if (e.target.value && error) setError('');
                  }}
                >
                  <option value="">-- Choose crop to diagnose --</option>
                  {availableCrops.map((crop, idx) => (
                    <option key={idx} value={crop}>{crop}</option>
                  ))}
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Soybean">Soybean</option>
                </select>
                {error && <p className="text-red-600 text-xs font-medium mt-1">{error}</p>}
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${error && !imagePreview ? 'border-red-300 bg-red-50/50' : 'border-[var(--color-border)] hover:border-primary-400 hover:bg-[var(--color-surface-secondary)]'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input 
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-primary-50 text-primary-600 border border-primary-100 rounded-2xl flex items-center justify-center shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[var(--color-text-primary)]">Upload Crop Foliage Photo</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
                      Upload a clear photo of the affected leaf, stem, or fruit (Max 10MB, JPG/PNG/WebP).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button onClick={() => fileInputRef.current?.click()} icon={ImageIcon}>
                      Browse Files
                    </Button>
                    <Button variant="secondary" onClick={handleUseSampleImage} icon={Camera}>
                      Use Sample Specimen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW STAGE */}
          {currentStage === CROP_DOCTOR_STAGES.PREVIEW && (
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">Image Inspection Preview</h3>
                <Badge variant="primary" className="flex items-center gap-1">
                  <Leaf className="w-3 h-3" />
                  Crop: {selectedCrop || 'Foliage Specimen'}
                </Badge>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center aspect-video max-h-[360px] border border-[var(--color-border)] shadow-xs">
                {imagePreview && (
                  <img src={imagePreview} alt="Crop preview" className="max-w-full max-h-[360px] object-contain" />
                )}
                <button 
                  onClick={resetWorkflow}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={resetWorkflow}>Choose Different Image</Button>
                <Button onClick={startAnalysis} icon={Activity}>Analyze Crop Image</Button>
              </div>
            </div>
          )}

          {/* ANALYZING STAGE */}
          {currentStage === CROP_DOCTOR_STAGES.ANALYZING && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary-100 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary-600" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Evaluating Crop Health</h3>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium animate-pulse">{analyzingText}</p>
              </div>
            </div>
          )}

          {/* RESULT STAGE */}
          {currentStage === CROP_DOCTOR_STAGES.RESULT && currentDiagnosis && (
            <div className="space-y-6">
              {currentDiagnosis.notice && (
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{currentDiagnosis.notice}</span>
                  </div>
                  <Badge variant="warning" className="text-[10px]">Prototype Fallback</Badge>
                </div>
              )}

              {currentDiagnosis.isLowConfidence && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    Diagnosis Uncertain ({currentDiagnosis.confidence}% Confidence)
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    AI could not confidently identify the condition from this image. We recommend capturing a clearer close-up of the affected leaf/fruit/stem in natural daylight or submitting for expert agronomist review.
                  </p>
                </div>
              )}

              {currentDiagnosis.isNotPlant && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-900">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    Unable to identify a crop/plant in this image
                  </div>
                  <p className="text-xs text-red-800">
                    Please upload an image focused on agricultural crops or plant foliage.
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square border border-[var(--color-border)] shadow-xs">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Analyzed Crop" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-tertiary)]">Diagnostic Specimen</div>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="primary">{currentDiagnosis.crop}</Badge>
                        <Badge variant={getSeverityBadgeVariant(currentDiagnosis.severity)}>
                          {currentDiagnosis.severity} Severity
                        </Badge>
                        <Badge variant="default" className="capitalize">
                          Part: {currentDiagnosis.plant_part || 'Leaf'}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] flex items-center gap-2">
                        {currentDiagnosis.severity === 'high' || currentDiagnosis.severity === 'critical' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        ) : (
                          <Leaf className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {currentDiagnosis.diagnosis}
                      </h2>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-primary-600">
                        {currentDiagnosis.confidence}%
                      </div>
                      <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Confidence</div>
                    </div>
                  </div>

                  {/* Symptoms & Possible Causes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
                      <h4 className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-2 mb-2 uppercase tracking-wider">
                        <Eye className="w-3.5 h-3.5 text-blue-600" /> Observable Symptoms
                      </h4>
                      <ul className="space-y-1.5">
                        {(currentDiagnosis.symptoms || []).map((symptom, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-[var(--color-surface-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
                      <h4 className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-2 mb-2 uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 text-amber-600" /> Possible Causes & Correlates
                      </h4>
                      <ul className="space-y-1.5">
                        {(currentDiagnosis.possible_causes || []).map((cause, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Cultural Actions */}
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
                    <h4 className="font-semibold text-xs text-emerald-950 flex items-center gap-2 mb-2 uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" /> Immediate Non-Chemical Actions
                    </h4>
                    <ul className="space-y-1.5">
                      {(currentDiagnosis.recommended_actions || []).map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-emerald-900 leading-relaxed">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)] items-center">
                    <Button onClick={handleSaveDiagnosis} icon={Save} className="flex-1">
                      Save to Farm Dossier
                    </Button>
                    <Button variant="secondary" onClick={() => setShowExplainabilityModal(true)} icon={HelpCircle}>
                      Why am I seeing this?
                    </Button>
                    <Button variant="secondary" onClick={resetWorkflow} icon={RotateCcw}>
                      New Diagnosis
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Case Management & Diagnostic History Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" /> Clinical Crop Doctor Cases ({cases.length})
          </h3>
          <span className="text-xs text-gray-500">Multi-temporal condition tracking</span>
        </div>
        
        {cases.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="No clinical cases on record"
            description="Diagnoses saved from the Crop Doctor will be tracked as longitudinal cases with scheduled follow-ups."
          />
        ) : (
          <div className="space-y-3.5">
            {cases.map((c) => {
              const isExpanded = expandedHistory.includes(c.caseId);
              const statusVariant = c.status === 'resolved' ? 'success' : c.status === 'expert_review' ? 'danger' : 'warning';
              
              return (
                <Card key={c.caseId} className="overflow-hidden border border-gray-200">
                  <div 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors"
                    onClick={() => toggleHistoryExpand(c.caseId)}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{c.diagnosis}</h4>
                          <Badge variant={statusVariant} size="xs">
                            {c.status.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-gray-400 font-mono">#{c.caseId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-0.5">
                          <span className="font-semibold text-primary-700">{c.crop}</span>
                          <span>•</span>
                          <span>Logged: {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
                          <span>•</span>
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Next Follow-up: {c.followUpDate || 'In 3 days'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleOpenFollowUp(c, e)}
                        className="text-xs px-2.5 py-1 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-primary-600" /> Log Follow-up
                      </Button>
                      <Badge variant={getSeverityBadgeVariant(c.severity)}>
                        {c.severity}
                      </Badge>
                      <div className="text-[var(--color-text-tertiary)]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <h5 className="font-bold text-xs text-[var(--color-text-primary)] mb-1.5 uppercase tracking-wider">
                            Initial Clinical Symptoms
                          </h5>
                          <ul className="space-y-1">
                            {(c.symptoms || []).map((sym, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                                <span className="text-primary-600">•</span> {sym}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-[var(--color-text-primary)] mb-1.5 uppercase tracking-wider">
                            Recommended Cultural Actions
                          </h5>
                          <ul className="space-y-1">
                            {(c.recommendedActions || c.recommended_actions || []).map((rec, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> 
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Longitudinal Follow-up Trajectory */}
                      {Array.isArray(c.followUps) && c.followUps.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <h5 className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-primary-600" /> Follow-Up Inspection Trajectory ({c.followUps.length})
                          </h5>
                          <div className="space-y-2">
                            {c.followUps.map((flw, idx) => (
                              <div key={flw.id || idx} className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">Follow-up #{idx + 1}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500">{new Date(flw.date).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-gray-600">{flw.note || flw.followUpDiagnosis}</p>
                                </div>
                                <Badge 
                                  variant={flw.conditionStatus === 'improving' ? 'success' : flw.conditionStatus === 'resolved' ? 'primary' : 'warning'}
                                  size="xs"
                                >
                                  {flw.conditionStatus ? flw.conditionStatus.toUpperCase() : 'MONITORING'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Inspection Modal */}
      <Modal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        title="Record Clinical Follow-Up Inspection"
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-950">
            <strong>Case:</strong> {selectedCaseForFollowUp?.diagnosis} ({selectedCaseForFollowUp?.crop})
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Condition Assessment Trajectory
            </label>
            <select
              value={followUpForm.conditionStatus}
              onChange={(e) => setFollowUpForm(p => ({ ...p, conditionStatus: e.target.value }))}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
            >
              <option value="improving">Improving (Lesion progression halted / healthy new growth)</option>
              <option value="monitoring">Monitoring (Symptoms stable / no active spread)</option>
              <option value="worsening">Worsening (Lesions expanding across upper canopy)</option>
              <option value="resolved">Resolved (Pathogen eradicated / parcel healthy)</option>
              <option value="uncertain">Uncertain (Unable to confidently determine change)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Field Notes & Observations
            </label>
            <textarea
              rows={3}
              value={followUpForm.note}
              onChange={(e) => setFollowUpForm(p => ({ ...p, note: e.target.value }))}
              placeholder="E.g., Inspected central foliage after 3 days. Pruning infected leaves stopped spread. New leaves show no discoloration."
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Follow-Up Inspection</Button>
          </div>
        </form>
      </Modal>

      {/* Explainability Modal */}
      <Modal
        isOpen={showExplainabilityModal}
        onClose={() => setShowExplainabilityModal(false)}
        title="AI Diagnostic Explainability & Farm Lineage"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            AgriBridge AI evaluated the following visual and microclimate parameters:
          </p>
          <div className="space-y-2 p-3 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
            <div className="flex justify-between">
              <span className="font-semibold text-[var(--color-text-primary)]">Target Crop Identified:</span>
              <span>{currentDiagnosis?.crop || selectedCrop}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[var(--color-text-primary)]">Observed Foliar Lesions:</span>
              <span>{currentDiagnosis?.evidence?.visual || 'Concentric leaf margin spots'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[var(--color-text-primary)]">Microclimate Humidity:</span>
              <span>{currentDiagnosis?.evidence?.weatherCorrelation || 'Elevated humidity (>65%)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[var(--color-text-primary)]">Data Lineage:</span>
              <span>RGB Foliar Image + Open-Meteo Telemetry</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl">
            <strong>Agricultural Safety Note:</strong> Visual symptoms can overlap between fungal pathogens and nutrient deficiencies. If symptoms persist across &gt; 15% of your plot, consult an agronomist before purchasing treatment inputs.
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setShowExplainabilityModal(false)}>Got It</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CropDoctor;
