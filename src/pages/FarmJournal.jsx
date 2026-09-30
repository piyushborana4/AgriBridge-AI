import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import Modal from '../components/ui/Modal';
import { 
  getJournalEntries, 
  addJournalEntry, 
  deleteJournalEntry 
} from '../services/operations/journalRepository';
import { 
  BookOpen, Plus, Search, Filter, Calendar, 
  MapPin, Tag, Camera, AlertCircle, Sparkles, 
  Trash2, Image as ImageIcon, Eye, CheckCircle2 
} from 'lucide-react';

export default function FarmJournal() {
  const { state, selectedFarm } = useApp();
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmFilter, setSelectedFarmFilter] = useState(selectedFarm?.id || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    field: 'North Parcel A',
    crop: selectedFarm?.crops?.[0] || 'Onion',
    growthStage: selectedFarm?.growthStage || 'Bulb Formation / Enlargement',
    date: new Date().toISOString().split('T')[0],
    observationType: 'disease_symptom',
    note: '',
    tags: 'foliar, inspection',
    isAIRelated: true,
    photo: null
  });

  const refreshEntries = () => {
    const list = getJournalEntries(selectedFarmFilter === 'all' ? null : selectedFarmFilter, {
      search: searchQuery,
      observationType: typeFilter,
      crop: cropFilter
    });
    setEntries(list);
  };

  useEffect(() => {
    refreshEntries();
  }, [selectedFarmFilter, searchQuery, typeFilter, cropFilter]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!newEntry.title.trim() || !newEntry.note.trim()) return;

    addJournalEntry({
      ...newEntry,
      farmId: selectedFarm?.id || 'farm-1',
      tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setIsAddModalOpen(false);
    setNewEntry({
      title: '',
      field: 'North Parcel A',
      crop: selectedFarm?.crops?.[0] || 'Onion',
      growthStage: 'Bulb Formation / Enlargement',
      date: new Date().toISOString().split('T')[0],
      observationType: 'disease_symptom',
      note: '',
      tags: 'foliar, inspection',
      isAIRelated: true,
      photo: null
    });
    refreshEntries();
  };

  const handleDelete = (id) => {
    deleteJournalEntry(id);
    refreshEntries();
  };

  const typeLabels = {
    disease_symptom: { label: 'Pathogen / Symptom', badge: 'danger' },
    pest_sighting: { label: 'Pest Sighting', badge: 'warning' },
    soil_moisture: { label: 'Soil & Moisture', badge: 'primary' },
    growth_milestone: { label: 'Growth Milestone', badge: 'success' },
    general: { label: 'General Scouting', badge: 'secondary' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Farm Field Journal</h1>
            <SourceBadge type="FARMER ENTERED" label="Farmer Observations" />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Ground-truth field scouting log. Entries feed into the Farm Context Engine as verified USER_PROVIDED evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedFarmFilter}
            onChange={(e) => setSelectedFarmFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-gray-700 shadow-2xs"
          >
            <option value="all">All Farm Parcels ({state.farms?.length || 1})</option>
            {state.farms?.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            size="sm" 
            className="text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Log Field Observation
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search observations by keyword, plot name, or tags..."
              className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700"
            >
              <option value="all">All Observation Types</option>
              <option value="disease_symptom">Pathogen / Symptoms</option>
              <option value="pest_sighting">Pest Sightings</option>
              <option value="soil_moisture">Soil & Moisture</option>
              <option value="growth_milestone">Growth Milestones</option>
              <option value="general">General Scouting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journal Timeline Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">Your farm journal is empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Record your first field observation. Ground sightings provide critical calibration for satellite and weather models.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="mt-4 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add First Observation
            </Button>
          </div>
        ) : (
          entries.map(entry => {
            const typeInfo = typeLabels[entry.observationType] || typeLabels.general;

            return (
              <Card key={entry.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={typeInfo.badge} size="xs">
                          {typeInfo.label}
                        </Badge>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> {entry.date}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> {entry.field}
                        </span>
                        <span className="text-xs text-emerald-700 font-medium">
                          • {entry.crop} ({entry.growthStage})
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900">
                        {entry.title}
                      </h3>

                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                        {entry.note}
                      </p>

                      {/* Tags & AI Indicator */}
                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.tags?.map((t, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-gray-400" /> {t}
                            </span>
                          ))}
                        </div>

                        {entry.isAIRelated && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" /> Used by Context Engine ({entry.linkedEvidenceId})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors self-start"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Observation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Field Observation"
      >
        <form onSubmit={handleAddEntry} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Observation Title</label>
            <input
              type="text"
              value={newEntry.title}
              onChange={(e) => setNewEntry(p => ({ ...p, title: e.target.value }))}
              placeholder="E.g., Leaf yellowing noticed along lower furrow"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Field / Parcel Name</label>
              <input
                type="text"
                value={newEntry.field}
                onChange={(e) => setNewEntry(p => ({ ...p, field: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Observation Date</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={newEntry.observationType}
                onChange={(e) => setNewEntry(p => ({ ...p, observationType: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              >
                <option value="disease_symptom">Pathogen / Disease Symptom</option>
                <option value="pest_sighting">Pest Sighting</option>
                <option value="soil_moisture">Soil Moisture & Drainage</option>
                <option value="growth_milestone">Growth Milestone</option>
                <option value="general">General Field Scouting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Crop Growth Stage</label>
              <input
                type="text"
                value={newEntry.growthStage}
                onChange={(e) => setNewEntry(p => ({ ...p, growthStage: e.target.value }))}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Field Notes</label>
            <textarea
              rows={3}
              value={newEntry.note}
              onChange={(e) => setNewEntry(p => ({ ...p, note: e.target.value }))}
              placeholder="Describe symptoms, affected plant count, leaf patterns, or soil conditions..."
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Comma-separated Tags</label>
            <input
              type="text"
              value={newEntry.tags}
              onChange={(e) => setNewEntry(p => ({ ...p, tags: e.target.value }))}
              placeholder="foliar, fungal, north-plot"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Observation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
