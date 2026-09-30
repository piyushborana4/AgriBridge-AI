/**
 * Farm Journal Repository & Observation Engine - AgriBridge AI (Phase 5)
 * Allows farmers to record on-the-ground observations, growth milestones,
 * pest/disease sightings, and field conditions with genuine photo metadata.
 *
 * Integrates directly with Farm Context & Evidence Engine as USER_PROVIDED ground truth.
 */

import { createProvenance, createDataEnvelope, DataStatus, SourceType, QualityLevel, FreshnessStatus } from '../data/provenanceTypes.js';

const STORAGE_KEY = 'agribridge_farm_journal_v1';

/**
 * Initial seeded observations
 */
function getInitialJournalEntries() {
  return [
    {
      id: 'JRN-2026-001',
      farmId: 'farm-1',
      field: 'North Parcel A',
      crop: 'Onion',
      growthStage: 'Bulb Formation / Enlargement',
      date: '2026-09-29',
      observationType: 'disease_symptom',
      title: 'Water-soaked spots noticed on outer leaves',
      note: 'Found 3 plants along the eastern furrow displaying localized purplish discoloration with water-soaked margins. Checked root zone — no basal rot present.',
      photo: null,
      tags: ['foliar', 'fungal-suspect', 'north-parcel'],
      isAIRelated: true,
      linkedEvidenceId: 'SIG-OBS-LEAF-001',
      createdAt: '2026-09-29T16:45:00.000Z'
    },
    {
      id: 'JRN-2026-002',
      farmId: 'farm-1',
      field: 'South Parcel B',
      crop: 'Onion',
      growthStage: 'Bulb Formation / Enlargement',
      date: '2026-09-27',
      observationType: 'soil_moisture',
      title: 'Furrow water drainage sluggish after shower',
      note: 'Heavy clay soil in lower elevation area is retaining standing water 6 hours after morning rain. Ditch clearing needed.',
      photo: null,
      tags: ['drainage', 'waterlogging', 'soil'],
      isAIRelated: true,
      linkedEvidenceId: 'SIG-OBS-DRAIN-001',
      createdAt: '2026-09-27T10:15:00.000Z'
    },
    {
      id: 'JRN-2026-003',
      farmId: 'farm-1',
      field: 'West Parcel C',
      crop: 'Onion',
      growthStage: 'Vegetative Canopy',
      date: '2026-09-24',
      observationType: 'growth_milestone',
      title: 'Canopy closure reaching 85%',
      note: 'Uniform green foliage stand. Drip irrigation pulse schedule working efficiently. No pest incidence.',
      photo: null,
      tags: ['milestone', 'healthy', 'canopy'],
      isAIRelated: false,
      linkedEvidenceId: null,
      createdAt: '2026-09-24T09:00:00.000Z'
    }
  ];
}

let memoryJournal = null;

/**
 * Load entries from storage
 */
export function loadJournalEntries() {
  if (typeof localStorage === 'undefined') {
    if (!memoryJournal) {
      memoryJournal = getInitialJournalEntries();
    }
    return memoryJournal;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Silently fallback
  }
  const initial = getInitialJournalEntries();
  saveJournalEntries(initial);
  return initial;
}

/**
 * Save entries to storage
 */
export function saveJournalEntries(entries) {
  if (typeof localStorage === 'undefined') {
    memoryJournal = entries;
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    // Silently fallback
  }
}

/**
 * Retrieve journal entries with comprehensive filters
 */
export function getJournalEntries(farmId = null, filters = {}) {
  let entries = loadJournalEntries();

  if (farmId && farmId !== 'all') {
    entries = entries.filter(e => e.farmId === farmId);
  }

  if (filters.crop && filters.crop !== 'all') {
    entries = entries.filter(e => e.crop?.toLowerCase() === filters.crop.toLowerCase());
  }

  if (filters.field && filters.field !== 'all') {
    entries = entries.filter(e => e.field?.toLowerCase().includes(filters.field.toLowerCase()));
  }

  if (filters.observationType && filters.observationType !== 'all') {
    entries = entries.filter(e => e.observationType === filters.observationType);
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase();
    entries = entries.filter(e => 
      e.title?.toLowerCase().includes(q) ||
      e.note?.toLowerCase().includes(q) ||
      e.field?.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Add a new farmer observation
 */
export function addJournalEntry(entryData) {
  const entries = loadJournalEntries();
  const newEntry = {
    id: entryData.id || `JRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    farmId: entryData.farmId || 'farm-1',
    field: entryData.field || 'Main Parcel',
    crop: entryData.crop || 'Onion',
    growthStage: entryData.growthStage || 'Vegetative',
    date: entryData.date || new Date().toISOString().split('T')[0],
    observationType: entryData.observationType || 'general',
    title: entryData.title || 'Field Observation',
    note: entryData.note || '',
    photo: entryData.photo || null,
    tags: Array.isArray(entryData.tags) ? entryData.tags : (entryData.tags ? [entryData.tags] : []),
    isAIRelated: entryData.isAIRelated ?? true,
    linkedEvidenceId: entryData.linkedEvidenceId || `SIG-OBS-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  entries.unshift(newEntry);
  saveJournalEntries(entries);
  return newEntry;
}

/**
 * Delete a journal entry
 */
export function deleteJournalEntry(entryId) {
  let entries = loadJournalEntries();
  entries = entries.filter(e => e.id !== entryId);
  saveJournalEntries(entries);
  return entries;
}

/**
 * Formats journal entries as USER_PROVIDED evidence items for the Farm Intelligence Engine.
 * Never labels them as sensor telemetry.
 */
export function getJournalForEvidence(farmId) {
  const entries = getJournalEntries(farmId);
  
  return entries.map(entry => {
    const isAnomaly = entry.observationType === 'disease_symptom' || entry.observationType === 'pest_sighting' || entry.observationType === 'soil_moisture';

    return {
      id: entry.linkedEvidenceId || `SIG-OBS-${entry.id}`,
      stream: 'Farmer Observation (Field Log)',
      sourceType: SourceType.FARMER_INPUT,
      status: DataStatus.USER_PROVIDED,
      quality: QualityLevel.MEDIUM,
      observedAt: entry.date,
      title: entry.title,
      summary: entry.note,
      field: entry.field,
      crop: entry.crop,
      isAnomaly,
      provenanceNotes: `Farmer manual observation logged for ${entry.field} on ${entry.date}. Treated as USER_PROVIDED ground indicator.`
    };
  });
}
