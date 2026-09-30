/**
 * AgriBridge AI — Farmer Consent & Data Permissions Service (Phase 7)
 * Implements granular data governance, sovereign farmer data ownership,
 * and immutable consent audit logging.
 * 
 * CORE PRINCIPLE:
 * Farmer data defaults to PRIVATE. Consent is required before any sharing,
 * and consent must be freely revocable at any time.
 */

import { DATA_VISIBILITY, CONSENT_STATUS } from './dataContracts.js';

const STORAGE_KEYS = {
  CONSENT_SETTINGS: 'agribridge_farm_consent_v1',
  CONSENT_AUDIT: 'agribridge_consent_audit_log_v1'
};

// In-memory universal fallback for Node.js test environment
let memoryConsentStore = {};
let memoryConsentAuditLogs = [];

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

/**
 * Default consent configuration for any newly registered farm
 */
export const DEFAULT_FARM_CONSENT = {
  visibility: DATA_VISIBILITY.PRIVATE,
  consentRequired: true,
  consentStatus: CONSENT_STATUS.NOT_REQUIRED,
  sharingScope: {
    allowOrganizationAdvisory: false,
    allowAnonymizedResearch: false,
    allowSharedPestAlerts: false,
    allowBricsKnowledgeHub: false
  },
  spatialPrecision: 'district_approximate', // 'exact' | 'district_approximate' | 'regional_centroid'
  lastUpdated: new Date().toISOString(),
  auditTrailCount: 0
};

/**
 * Retrieves the current data permission & consent profile for a farm
 * @param {string} farmId
 * @returns {object} Farm consent configuration
 */
export function getFarmConsent(farmId) {
  if (!farmId) return { ...DEFAULT_FARM_CONSENT, farmId: 'unknown' };

  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CONSENT_SETTINGS}_${farmId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read consent from localStorage:', e);
    }
  } else if (memoryConsentStore[farmId]) {
    return { ...memoryConsentStore[farmId] };
  }

  return { ...DEFAULT_FARM_CONSENT, farmId };
}

/**
 * Updates a farm's consent configuration and records an immutable audit entry
 * @param {string} farmId
 * @param {object} updates - Updates to sharingScope, visibility, etc.
 * @param {string} [purpose='Farmer Operations Update']
 * @returns {object} Updated consent profile
 */
export function updateFarmConsent(farmId, updates = {}, purpose = 'Farmer Operational Preference Update') {
  if (!farmId) throw new Error('Cannot update consent: farmId is required');

  const current = getFarmConsent(farmId);
  const updated = {
    ...current,
    ...updates,
    farmId,
    sharingScope: {
      ...current.sharingScope,
      ...(updates.sharingScope || {})
    },
    consentStatus: CONSENT_STATUS.GRANTED,
    lastUpdated: new Date().toISOString(),
    auditTrailCount: (current.auditTrailCount || 0) + 1
  };

  // Determine visibility based on scope
  if (updated.sharingScope.allowBricsKnowledgeHub || updated.sharingScope.allowAnonymizedResearch) {
    updated.visibility = DATA_VISIBILITY.RESEARCH;
  } else if (updated.sharingScope.allowOrganizationAdvisory) {
    updated.visibility = DATA_VISIBILITY.ORGANIZATION;
  } else {
    updated.visibility = DATA_VISIBILITY.PRIVATE;
  }

  // Save updated consent
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.CONSENT_SETTINGS}_${farmId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist consent to localStorage:', e);
    }
  } else {
    memoryConsentStore[farmId] = updated;
  }

  // Record Audit Entry
  recordConsentAuditEvent({
    farmId,
    action: 'CONSENT_UPDATED',
    visibility: updated.visibility,
    sharingScope: updated.sharingScope,
    purpose,
    timestamp: updated.lastUpdated
  });

  return updated;
}

/**
 * Explicitly revokes all sharing permissions and sets visibility to PRIVATE
 * @param {string} farmId
 * @param {string} [reason='Farmer requested complete revocation']
 * @returns {object} Revoked consent profile
 */
export function revokeFarmConsent(farmId, reason = 'Farmer requested complete revocation') {
  if (!farmId) throw new Error('Cannot revoke consent: farmId is required');

  const current = getFarmConsent(farmId);
  const revoked = {
    ...current,
    visibility: DATA_VISIBILITY.PRIVATE,
    consentStatus: CONSENT_STATUS.REVOKED,
    sharingScope: {
      allowOrganizationAdvisory: false,
      allowAnonymizedResearch: false,
      allowSharedPestAlerts: false,
      allowBricsKnowledgeHub: false
    },
    revokedAt: new Date().toISOString(),
    revocationReason: reason,
    lastUpdated: new Date().toISOString(),
    auditTrailCount: (current.auditTrailCount || 0) + 1
  };

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.CONSENT_SETTINGS}_${farmId}`, JSON.stringify(revoked));
    } catch (e) {
      console.warn('Failed to persist revoked consent to localStorage:', e);
    }
  } else {
    memoryConsentStore[farmId] = revoked;
  }

  recordConsentAuditEvent({
    farmId,
    action: 'CONSENT_REVOKED',
    visibility: DATA_VISIBILITY.PRIVATE,
    sharingScope: revoked.sharingScope,
    purpose: reason,
    timestamp: revoked.lastUpdated
  });

  return revoked;
}

/**
 * Records an immutable consent audit log entry
 */
export function recordConsentAuditEvent(event) {
  const auditEntry = {
    id: `AUDIT-CONSENT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...event,
    recordedAt: new Date().toISOString()
  };

  if (isLocalStorageAvailable()) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSENT_AUDIT) || '[]');
      existing.unshift(auditEntry);
      localStorage.setItem(STORAGE_KEYS.CONSENT_AUDIT, JSON.stringify(existing.slice(0, 100)));
    } catch (e) {
      console.warn('Failed to record consent audit log:', e);
    }
  } else {
    memoryConsentAuditLogs.unshift(auditEntry);
  }

  return auditEntry;
}

/**
 * Retrieves the consent audit log history
 */
export function getConsentAuditLogs(farmId = null) {
  let logs = [];
  if (isLocalStorageAvailable()) {
    try {
      logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSENT_AUDIT) || '[]');
    } catch (e) {
      logs = [];
    }
  } else {
    logs = memoryConsentAuditLogs;
  }

  if (farmId) {
    return logs.filter(l => l.farmId === farmId);
  }
  return logs;
}

/**
 * Resets in-memory stores for isolated testing
 */
export function resetConsentMemoryStore() {
  memoryConsentStore = {};
  memoryConsentAuditLogs = [];
}
