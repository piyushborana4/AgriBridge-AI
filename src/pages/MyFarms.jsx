import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { 
  MapPin, Maximize, Sprout, Droplets, Calendar, Edit2, Trash2, 
  ArrowRight, Plus, AlertCircle, CheckCircle2, Search, Compass, 
  FlaskConical, Check, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchLocations, generateFarmGeoJSON } from '../services/data/geospatial/geocodingProvider';

const soilTypes = [
  'Black Cotton Soil',
  'Alluvial Soil',
  'Red Laterite Soil',
  'Clay Loam',
  'Sandy Loam',
  'Silty Clay'
];

const irrigationTypes = [
  'Drip Irrigation',
  'Canal Irrigation',
  'Borewell / Sprinkler',
  'Rainfed / Natural Drainage',
  'Subsurface Drip'
];

const growthStages = [
  'Germination / Seedling',
  'Early Vegetative',
  'Vegetative / Canopy Development',
  'Flowering / Tasseling',
  'Grain Filling / Pod Development',
  'Maturity / Pre-Harvest'
];

export default function MyFarms() {
  const { state, dispatch, selectedFarm } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [deleteConfirmFarm, setDeleteConfirmFarm] = useState(null);
  const [notification, setNotification] = useState('');

  // Geocoding search state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    lat: 19.9975,
    lng: 73.7898,
    size: '',
    sizeUnit: 'hectares',
    crops: '',
    cropVariety: '',
    growthStage: 'Vegetative / Canopy Development',
    sowingDate: '2026-07-15',
    soilType: 'Black Cotton Soil',
    irrigationType: 'Drip Irrigation',
    owner: '',
    soilTestDate: '',
    soilLabName: '',
    soilPH: 6.8,
    organicMatter: 2.8,
    nitrogen: 220,
    phosphorus: 35,
    potassium: 180,
  });
  
  const [errors, setErrors] = useState({});

  // Debounced geocoding search
  useEffect(() => {
    if (!locationQuery || locationQuery.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      const results = await searchLocations(locationQuery);
      setLocationSuggestions(results);
      setIsSearchingLocation(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Farm name is required (minimum 3 characters).';
    }
    if (!formData.location || formData.location.trim().length < 3) {
      newErrors.location = 'Location is required.';
    }
    if (!formData.size || isNaN(formData.size) || Number(formData.size) <= 0) {
      newErrors.size = 'Size must be a positive number.';
    }
    if (isNaN(formData.lat) || formData.lat < -90 || formData.lat > 90) {
      newErrors.lat = 'Valid latitude (-90 to 90) required.';
    }
    if (isNaN(formData.lng) || formData.lng < -180 || formData.lng > 180) {
      newErrors.lng = 'Valid longitude (-180 to 180) required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectLocation = (loc) => {
    setFormData(prev => ({
      ...prev,
      location: loc.name,
      lat: loc.lat,
      lng: loc.lng,
    }));
    setLocationQuery(loc.name);
    setLocationSuggestions([]);
  };

  const handleOpenModal = (farm = null) => {
    if (farm) {
      setEditingFarm(farm);
      setLocationQuery(farm.location || '');
      setFormData({
        name: farm.name,
        location: farm.location,
        lat: farm.lat || 19.9975,
        lng: farm.lng || 73.7898,
        size: farm.size,
        sizeUnit: farm.sizeUnit || 'hectares',
        crops: farm.crops ? farm.crops.join(', ') : '',
        cropVariety: farm.cropVariety || '',
        growthStage: farm.growthStage || 'Vegetative / Canopy Development',
        sowingDate: farm.sowingDate || '2026-07-15',
        soilType: farm.soilType || 'Black Cotton Soil',
        irrigationType: farm.irrigationType || 'Drip Irrigation',
        owner: farm.owner || '',
        soilTestDate: farm.soilTestDate || '',
        soilLabName: farm.soilLabName || '',
        soilPH: farm.soilPH ?? 6.8,
        organicMatter: farm.organicMatter ?? 2.8,
        nitrogen: farm.nitrogen ?? 220,
        phosphorus: farm.phosphorus ?? 35,
        potassium: farm.potassium ?? 180,
      });
    } else {
      setEditingFarm(null);
      setLocationQuery('');
      setFormData({
        name: '',
        location: '',
        lat: 19.9975,
        lng: 73.7898,
        size: '',
        sizeUnit: 'hectares',
        crops: '',
        cropVariety: '',
        growthStage: 'Vegetative / Canopy Development',
        sowingDate: new Date().toISOString().split('T')[0],
        soilType: 'Black Cotton Soil',
        irrigationType: 'Drip Irrigation',
        owner: '',
        soilTestDate: '',
        soilLabName: '',
        soilPH: 6.8,
        organicMatter: 2.8,
        nitrogen: 220,
        phosphorus: 35,
        potassium: 180,
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = {
      ...formData,
      size: Number(formData.size),
      lat: Number(formData.lat),
      lng: Number(formData.lng),
      crops: formData.crops ? formData.crops.split(',').map(c => c.trim()).filter(Boolean) : ['Mixed Crops'],
      soilPH: Number(formData.soilPH),
      organicMatter: Number(formData.organicMatter),
      nitrogen: Number(formData.nitrogen),
      phosphorus: Number(formData.phosphorus),
      potassium: Number(formData.potassium),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingFarm) {
      dispatch({ type: 'UPDATE_FARM', payload: { id: editingFarm.id, ...payload } });
      setNotification(`Farm "${formData.name}" updated with real location & telemetry.`);
    } else {
      dispatch({ 
        type: 'ADD_FARM', 
        payload: { 
          ...payload, 
          soilHealth: 78, 
          cropHealth: 84 
        } 
      });
      setNotification(`New farm "${formData.name}" added successfully.`);
    }
    setIsModalOpen(false);
    setTimeout(() => setNotification(''), 3500);
  };

  const confirmDelete = (farm) => {
    setDeleteConfirmFarm(farm);
  };

  const executeDelete = () => {
    if (!deleteConfirmFarm) return;
    const farmName = deleteConfirmFarm.name;
    dispatch({ type: 'DELETE_FARM', payload: deleteConfirmFarm.id });
    setDeleteConfirmFarm(null);
    setNotification(`Farm "${farmName}" deleted.`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Farm Management</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Configure farm coordinates, phenological stage, and verified soil test parameters.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Farm Parcel
        </Button>
      </div>

      {/* Farm Grid */}
      {state.farms.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No farms configured"
          description="Get started by creating your first farm parcel to activate live weather and Sentinel-2 satellite data streams."
          actionLabel="Add Farm"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.farms.map((farm) => {
            const isSelected = farm.id === selectedFarm?.id;
            const hasSoilTest = Boolean(farm.soilTestDate || farm.nitrogen > 0);
            
            return (
              <Card 
                key={farm.id} 
                className={`relative flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm' : ''
                }`}
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold">{farm.name}</CardTitle>
                          {isSelected && (
                            <Badge variant="success" className="text-[10px] uppercase tracking-wider">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {farm.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(farm)}
                          className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-primary-600 hover:bg-gray-100 transition-colors"
                          title="Edit Farm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {state.farms.length > 1 && (
                          <button
                            onClick={() => confirmDelete(farm)}
                            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Farm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* Source Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <SourceBadge type="LIVE" label="Open-Meteo Synced" />
                      <SourceBadge type="LATEST OBSERVATION" label="Sentinel-2" />
                      {hasSoilTest ? (
                        <SourceBadge type="FARMER ENTERED" label="Lab Soil Test" />
                      ) : (
                        <SourceBadge type="MODELED ESTIMATE" label="SoilGrids Baseline" />
                      )}
                    </div>

                    {/* Coordinates & Geometry preview */}
                    <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[var(--color-text-secondary)] font-mono">
                        <Compass className="w-3.5 h-3.5 text-primary-600" />
                        {farm.lat?.toFixed(4)}°N, {farm.lng?.toFixed(4)}°E
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        GeoJSON Point
                      </span>
                    </div>

                    {/* Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-gray-50 border border-gray-100">
                        <span className="text-[var(--color-text-tertiary)] block text-[10px]">Crops & Variety</span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {(farm.crops || []).join(', ')} {farm.cropVariety ? `(${farm.cropVariety})` : ''}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border border-gray-100">
                        <span className="text-[var(--color-text-tertiary)] block text-[10px]">Size</span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {farm.size} {farm.sizeUnit || 'hectares'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border border-gray-100">
                        <span className="text-[var(--color-text-tertiary)] block text-[10px]">Soil Type</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{farm.soilType}</span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border border-gray-100">
                        <span className="text-[var(--color-text-tertiary)] block text-[10px]">Irrigation</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{farm.irrigationType}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-[var(--color-border)] bg-gray-50/50 rounded-b-xl flex items-center justify-between">
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    Updated {farm.lastUpdated || 'Recently'}
                  </div>
                  {isSelected ? (
                    <span className="text-xs font-semibold text-primary-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected Parcel
                    </span>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => dispatch({ type: 'SELECT_FARM', payload: farm.id })}
                    >
                      Select Farm
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFarm ? `Edit Farm: ${editingFarm.name}` : 'Add New Farm Parcel'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          {/* Farm Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Farm Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Green Valley Farm"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-300'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Location Search & Auto-Geocoding */}
          <div className="relative">
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1 flex items-center justify-between">
              <span>Location (Geocoded) *</span>
              {isSearchingLocation && <span className="text-[10px] text-primary-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Searching...</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setFormData(prev => ({ ...prev, location: e.target.value }));
                }}
                placeholder="Search city, district, or region..."
                className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                  errors.location ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-300'
                }`}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
            
            {/* Geocoding Suggestions Dropdown */}
            {locationSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {locationSuggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 flex items-center justify-between border-b last:border-0 border-gray-100"
                  >
                    <span className="font-medium text-gray-800">{loc.name}</span>
                    <span className="font-mono text-[10px] text-gray-500">{loc.lat}°, {loc.lng}°</span>
                  </button>
                ))}
              </div>
            )}
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          {/* Latitude and Longitude */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Latitude (WGS84) *
              </label>
              <input
                type="number"
                step="0.0001"
                name="lat"
                value={formData.lat}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                  errors.lat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-300'
                }`}
              />
              {errors.lat && <p className="text-xs text-red-500 mt-1">{errors.lat}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Longitude (WGS84) *
              </label>
              <input
                type="number"
                step="0.0001"
                name="lng"
                value={formData.lng}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                  errors.lng ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-300'
                }`}
              />
              {errors.lng && <p className="text-xs text-red-500 mt-1">{errors.lng}</p>}
            </div>
          </div>

          {/* Size & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Size *
              </label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="e.g. 12"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                  errors.size ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-300'
                }`}
              />
              {errors.size && <p className="text-xs text-red-500 mt-1">{errors.size}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Unit
              </label>
              <select
                name="sizeUnit"
                value={formData.sizeUnit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="hectares">Hectares</option>
                <option value="acres">Acres</option>
              </select>
            </div>
          </div>

          {/* Crops & Variety */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Primary Crops (comma separated)
              </label>
              <input
                type="text"
                name="crops"
                value={formData.crops}
                onChange={handleInputChange}
                placeholder="e.g., Wheat, Cotton"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Crop Variety / Strain
              </label>
              <input
                type="text"
                name="cropVariety"
                value={formData.cropVariety}
                onChange={handleInputChange}
                placeholder="e.g., HD-2967 / Shriram 303"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Growth Stage & Sowing Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Phenological Growth Stage
              </label>
              <select
                name="growthStage"
                value={formData.growthStage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {growthStages.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Sowing Date
              </label>
              <input
                type="date"
                name="sowingDate"
                value={formData.sowingDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Soil Type & Irrigation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Soil Classification
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {soilTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Irrigation System
              </label>
              <select
                name="irrigationType"
                value={formData.irrigationType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {irrigationTypes.map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Soil Test Section */}
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-700" />
              <h4 className="text-xs font-bold text-indigo-900">Farmer Soil Health Card (Optional Lab Data)</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Test Date</label>
                <input
                  type="date"
                  name="soilTestDate"
                  value={formData.soilTestDate}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Testing Laboratory Name</label>
                <input
                  type="text"
                  name="soilLabName"
                  value={formData.soilLabName}
                  onChange={handleInputChange}
                  placeholder="e.g., Regional Krishi Lab"
                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  name="soilPH"
                  value={formData.soilPH}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">OM (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="organicMatter"
                  value={formData.organicMatter}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Nitrogen (mg/kg)</label>
                <input
                  type="number"
                  name="nitrogen"
                  value={formData.nitrogen}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Potassium (mg/kg)</label>
                <input
                  type="number"
                  name="potassium"
                  value={formData.potassium}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFarm ? 'Save Changes' : 'Create Farm Parcel'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmFarm)}
        onClose={() => setDeleteConfirmFarm(null)}
        title="Confirm Farm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong className="text-gray-900">{deleteConfirmFarm?.name}</strong>? All associated telemetry and satellite indices will be permanently removed.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmFarm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={executeDelete}>
              Delete Farm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
