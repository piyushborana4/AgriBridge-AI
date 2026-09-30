import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Globe, 
  Database, 
  Info, 
  Save, 
  Trash2, 
  RotateCcw,
  Check,
  AlertCircle,
  Satellite,
  Radio,
  Sparkles,
  ShieldCheck,
  Lock,
  Eye,
  FileText
} from 'lucide-react';
import { 
  getFarmConsent, 
  updateFarmConsent, 
  revokeFarmConsent, 
  getConsentAuditLogs 
} from '../services/interoperability/consentService';

const ToggleSwitch = ({ id, checked, onChange, disabled = false }) => {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  );
};

export default function Settings() {
  const { state, dispatch } = useApp();
  const farms = state?.farms || [];

  // Local state for profile form
  const [profileForm, setProfileForm] = useState({
    userName: state?.settings?.userName || 'Rajesh Patil',
    email: state?.settings?.email || 'rajesh.patil@agribridge.ai'
  });

  const [settingsState, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem('agribridge_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading settings from localStorage:', e);
    }
    return {
      language: 'English',
      units: {
        temperature: 'Celsius',
        area: 'Hectares',
        weight: 'Kg'
      },
      dataRefreshInterval: '15',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    };
  });

  const [errors, setErrors] = useState({});
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Modals state
  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Farmer Sovereign Consent state
  const [selectedFarmId, setSelectedFarmId] = useState(farms[0]?.id || 'farm-1');
  const [farmConsent, setFarmConsent] = useState(() => getFarmConsent(selectedFarmId));

  useEffect(() => {
    if (selectedFarmId) {
      const consent = getFarmConsent(selectedFarmId);
      setFarmConsent(consent);
    }
  }, [selectedFarmId]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveProfile = () => {
    const newErrors = {};
    if (!profileForm.userName.trim()) newErrors.userName = 'Full name is required';
    if (!profileForm.email.trim()) newErrors.email = 'Email address is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setNotificationMsg('Profile saved successfully!');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2500);
  };

  const updateSetting = (key, value, subkey = null) => {
    setSettingsState(prev => {
      let updated;
      if (subkey) {
        updated = { ...prev, [key]: { ...(prev[key] || {}), [subkey]: value } };
      } else {
        updated = { ...prev, [key]: value };
      }
      try {
        localStorage.setItem('agribridge_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist settings:', e);
      }
      return updated;
    });

    setNotificationMsg('Preferences updated');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleUpdateConsent = (updates) => {
    const updated = updateFarmConsent(selectedFarmId, updates, profileForm.userName || 'Farm Manager');
    setFarmConsent(updated);
    setNotificationMsg('Data governance & sovereign consent updated');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2500);
  };

  const handleRevokeConsent = () => {
    const revoked = revokeFarmConsent(selectedFarmId, 'Manual revocation by farmer via Settings', profileForm.userName || 'Farm Manager');
    setFarmConsent(revoked);
    setShowRevokeModal(false);
    setNotificationMsg('All external data sharing revoked. Privacy level set to PRIVATE.');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleOpenAuditLog = () => {
    const logs = getConsentAuditLogs(selectedFarmId);
    setAuditLogs(logs);
    setShowAuditModal(true);
  };

  const handleExportData = () => {
    const exportPayload = {
      profile: profileForm,
      settings: settingsState,
      consent: farmConsent,
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'agribridge_farm_settings_dossier.json');
    dlAnchor.click();
  };

  const handleClearData = () => {
    try {
      localStorage.clear();
      setNotificationMsg('Local cache cleared. Reloading...');
      setShowSaveSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  };

  const handleResetDefaults = () => {
    const defaults = {
      language: 'English',
      units: { temperature: 'Celsius', area: 'Hectares', weight: 'Kg' },
      dataRefreshInterval: '15',
      notifications: { email: true, push: true, sms: false }
    };
    setSettingsState(defaults);
    try {
      localStorage.setItem('agribridge_settings', JSON.stringify(defaults));
    } catch (e) {}
    setShowResetModal(false);
    setNotificationMsg('Settings reset to defaults');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary-600" />
          Platform Settings &amp; Attribution
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Manage system preferences, data refresh cycles, telemetry sources, sovereign farmer consent, and account parameters.
        </p>
      </div>

      {/* Notifications Toast */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg animate-in fade-in duration-200">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">{notificationMsg || 'Settings saved successfully!'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Profile, Regional Settings and Sovereign Consent */}
        <div className="space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary-600" />
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Full Name</label>
                <input
                  type="text"
                  name="userName"
                  value={profileForm.userName}
                  onChange={handleProfileChange}
                  className={`w-full p-2.5 border rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm ${errors.userName ? 'border-red-500' : 'border-[var(--color-border)] focus:ring-2 focus:ring-primary-500'}`}
                />
                {errors.userName && <p className="text-xs text-red-500 mt-1">{errors.userName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className={`w-full p-2.5 border rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm ${errors.email ? 'border-red-500' : 'border-[var(--color-border)] focus:ring-2 focus:ring-primary-500'}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regional & System Preferences */}
          <Card>
            <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5 text-primary-600" />
                Regional &amp; Unit Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Interface Language</label>
                <select 
                  value={settingsState.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full p-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="Marathi">मराठी (Marathi)</option>
                  <option value="Portuguese">Português (Brasil)</option>
                  <option value="Russian">Русский (Russian)</option>
                  <option value="Chinese">中文 (Chinese)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Telemetry Sync Interval</label>
                <select 
                  value={settingsState.dataRefreshInterval}
                  onChange={(e) => updateSetting('dataRefreshInterval', e.target.value)}
                  className="w-full p-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                >
                  <option value="15">Every 15 minutes (Standard)</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every 60 minutes</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Temperature Unit</label>
                  <div className="flex bg-[var(--color-surface-secondary)] p-1 rounded-lg border border-[var(--color-border)]">
                    {['Celsius', 'Fahrenheit'].map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => updateSetting('units', unit, 'temperature')}
                        className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${settingsState.units?.temperature === unit ? 'bg-primary-600 text-white shadow-xs' : 'text-[var(--color-text-secondary)]'}`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Area Unit</label>
                  <div className="flex bg-[var(--color-surface-secondary)] p-1 rounded-lg border border-[var(--color-border)]">
                    {['Hectares', 'Acres'].map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => updateSetting('units', unit, 'area')}
                        className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${settingsState.units?.area === unit ? 'bg-primary-600 text-white shadow-xs' : 'text-[var(--color-text-secondary)]'}`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sovereign Data Governance & Consent Card */}
          <Card className="border-sky-200 bg-sky-50/15">
            <CardHeader className="border-b border-sky-100 bg-sky-50/50 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-sky-950 font-bold">
                  <Lock className="h-5 w-5 text-sky-600" />
                  Sovereign Data Governance &amp; Consent
                </CardTitle>
                <Badge variant={farmConsent?.visibility === 'private' ? 'neutral' : 'success'}>
                  {farmConsent?.visibility ? farmConsent.visibility.toUpperCase() : 'PRIVATE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <p className="text-[var(--color-text-secondary)]">
                You hold absolute sovereignty over your farm data. All data defaults to <strong>Private</strong>. External exchange requires explicit consent and applies privacy-preserving GPS coarsening (~1.1km).
              </p>

              {farms.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Select Farm Parcel</label>
                  <select 
                    value={selectedFarmId} 
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="w-full p-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                  >
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.location || 'Active'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Data Visibility Scope</label>
                <select 
                  value={farmConsent?.visibility || 'private'} 
                  onChange={(e) => handleUpdateConsent({ visibility: e.target.value })}
                  className="w-full p-2 border border-sky-200 rounded-lg bg-white text-gray-900 font-medium"
                >
                  <option value="private">Private (Local device &amp; farmer only)</option>
                  <option value="organization">Organization (Registered FPO / Cooperative)</option>
                  <option value="research">Research (Anonymized &amp; Coarsened Academic Datasets)</option>
                  <option value="shared_network">Shared Network (BRICS Interoperability Exchange)</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-1 border-t border-sky-100">
                <span className="font-semibold text-gray-900 block">Granular Permission Matrix</span>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Allow Anonymized Weather Telemetry</span>
                  <ToggleSwitch 
                    id="consent-weather"
                    checked={Boolean(farmConsent?.allowWeatherSharing)}
                    onChange={() => handleUpdateConsent({ allowWeatherSharing: !farmConsent?.allowWeatherSharing })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Allow Coarsened Soil Analysis Data</span>
                  <ToggleSwitch 
                    id="consent-soil"
                    checked={Boolean(farmConsent?.allowSoilSharing)}
                    onChange={() => handleUpdateConsent({ allowSoilSharing: !farmConsent?.allowSoilSharing })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Allow Aggregated Crop Yield Telemetry</span>
                  <ToggleSwitch 
                    id="consent-crop"
                    checked={Boolean(farmConsent?.allowCropSharing)}
                    onChange={() => handleUpdateConsent({ allowCropSharing: !farmConsent?.allowCropSharing })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Allow Satellite Index Cross-Referencing</span>
                  <ToggleSwitch 
                    id="consent-sat"
                    checked={Boolean(farmConsent?.allowSatelliteTelemetry)}
                    onChange={() => handleUpdateConsent({ allowSatelliteTelemetry: !farmConsent?.allowSatelliteTelemetry })}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs flex items-center gap-1.5"
                  onClick={handleOpenAuditLog}
                >
                  <FileText className="w-3.5 h-3.5 text-sky-600" /> View Immutable Audit Log
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="text-xs flex items-center gap-1.5 ml-auto"
                  onClick={() => setShowRevokeModal(true)}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Revoke All Consent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Notifications, Data Attribution, Data Management */}
        <div className="space-y-6">
          {/* Data Source Attribution Panel */}
          <Card className="border-emerald-200 bg-emerald-50/20">
            <CardHeader className="border-b border-emerald-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-950 font-bold">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Data Source Transparency &amp; Attribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-100">
                <Radio className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Open-Meteo High-Resolution Agrometeorology</span>
                  <p className="text-gray-600 mt-0.5">WMO-compliant hourly forecast, FAO-56 reference ET₀, soil moisture, and precipitation probability.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-100">
                <Satellite className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Sentinel-2 MSI (Copernicus Earth Observation)</span>
                  <p className="text-gray-600 mt-0.5">10m multispectral vegetation vigor (NDVI, NDWI, EVI) with automated QA60 cloud-masking.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-100">
                <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">ISRIC SoilGrids &amp; National Soil Health Card (SHC)</span>
                  <p className="text-gray-600 mt-0.5">Dual-mode pedological data prioritizing farmer-entered verified laboratory tests with regional fallback.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-100">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Google Gemini 2.5 Multimodal Foundation Model</span>
                  <p className="text-gray-600 mt-0.5">Explainable agronomic reasoning, safety-compliant cultural advisory, and foliar pathology diagnostics.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-primary-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)]">Email Notifications</h4>
                  <p className="text-xs text-[var(--color-text-tertiary)]">Weekly reports and agronomic summaries</p>
                </div>
                <ToggleSwitch 
                  id="email-toggle"
                  checked={Boolean(settingsState.notifications?.email)} 
                  onChange={() => updateSetting('notifications', !settingsState.notifications?.email, 'email')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)]">Push Alerts</h4>
                  <p className="text-xs text-[var(--color-text-tertiary)]">Real-time weather and canopy stress alerts</p>
                </div>
                <ToggleSwitch 
                  id="push-toggle"
                  checked={Boolean(settingsState.notifications?.push)} 
                  onChange={() => updateSetting('notifications', !settingsState.notifications?.push, 'push')} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management Section */}
          <Card>
            <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5 text-primary-600" />
                Data &amp; Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Button 
                variant="secondary" 
                className="w-full justify-start flex items-center gap-2 text-xs"
                onClick={handleExportData}
              >
                <Save className="h-4 w-4" /> Export Farm Telemetry Dossier
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full justify-start flex items-center gap-2 text-xs text-amber-600 hover:bg-amber-50 border-amber-200"
                onClick={() => setShowClearModal(true)}
              >
                <Trash2 className="h-4 w-4" /> Clear Cached Farm Data
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full justify-start flex items-center gap-2 text-xs text-red-600 hover:bg-red-50 border-red-200"
                onClick={() => setShowResetModal(true)}
              >
                <RotateCcw className="h-4 w-4" /> Reset Settings to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Local Storage Cache"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--color-text-secondary)]">
            Are you sure you want to clear local storage cache? Your configured farms and preferences will be reset to default platform state.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearData}>Clear Cache</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings to Defaults"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--color-text-secondary)]">
            Are you sure you want to reset all preferences to their default settings?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleResetDefaults}>Reset Settings</Button>
          </div>
        </div>
      </Modal>

      {/* Consent Revoke Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        title="Confirm Sovereign Consent Revocation"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Immediate Data Severance</span>
              This action immediately terminates all external sharing, research pipeline inclusion, and BRICS network synchronization for this farm.
            </div>
          </div>
          <p className="text-gray-600">
            Your visibility will be reset to <strong>Private</strong>, and all telemetry sharing flags will be disabled. This revocation is recorded in your immutable audit ledger.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRevokeModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevokeConsent}>Confirm Revocation</Button>
          </div>
        </div>
      </Modal>

      {/* Consent Audit Log Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title={`Immutable Consent Audit Ledger (${farmConsent?.farmId || selectedFarmId})`}
      >
        <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No recorded consent transactions.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.auditId} className="p-2.5 rounded border border-gray-200 bg-gray-50 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <Badge variant={log.action === 'REVOKE_ALL_CONSENT' ? 'danger' : 'info'}>
                      {log.action}
                    </Badge>
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700">
                    <strong>Changed by:</strong> {log.actor}
                  </div>
                  {log.reason && (
                    <div className="text-gray-600">
                      <strong>Reason:</strong> {log.reason}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-gray-500 truncate">
                    Audit ID: {log.auditId}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowAuditModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
