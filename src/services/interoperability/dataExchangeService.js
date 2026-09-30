/**
 * AgriBridge AI — Data Exchange & Interoperability Pipeline (Phase 7)
 * Executes structured data exchange, schema validation, quarantine handling,
 * and immutable exchange logging.
 * 
 * CORE PRINCIPLE:
 * Every exchanged dataset must pass schema, provenance, and permission validation.
 * Invalid records are quarantined with diagnostic error reasons, never silently repaired.
 */

import { validateAgriculturalDataEnvelope, migrateEnvelopeVersion } from './dataContracts.js';
import { applyPrivacyPreservingTransform } from './privacyService.js';

export const EXCHANGE_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
  REJECTED: 'rejected'
};

const STORAGE_KEYS = {
  EXCHANGE_LOGS: 'agribridge_exchange_logs_v1',
  QUARANTINE_STORE: 'agribridge_quarantine_records_v1'
};

let memoryExchangeLogs = [];
let memoryQuarantineStore = [];

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

function getExchangeLogsFromStore() {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXCHANGE_LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read exchange logs from localStorage:', e);
    }
  }
  return memoryExchangeLogs;
}

function saveExchangeLogsToStore(logs) {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXCHANGE_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.warn('Failed to persist exchange logs to localStorage:', e);
    }
  }
  memoryExchangeLogs = logs;
}

/**
 * Executes a structured data exchange transaction
 * @param {object} params
 * @param {string} params.source - E.g. 'Local Farm Digital Twin'
 * @param {string} params.destination - E.g. 'BRICS Agricultural Knowledge Network'
 * @param {string} params.recordType - E.g. 'observation' | 'soil_test' | 'weather_record'
 * @param {Array<object>} params.envelopes - Array of AgriculturalDataEnvelopes
 * @param {object} [params.options] - { anonymize: boolean, targetScope: string }
 * @returns {object} Transaction result with exchange log
 */
export function executeDataExchange({
  source,
  destination,
  recordType,
  envelopes = [],
  options = {}
}) {
  if (!source || !destination) {
    throw new Error('Data exchange requires explicit source and destination');
  }

  const exchangeId = `EXC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  let validatedCount = 0;
  let rejectedCount = 0;
  const processedRecords = [];
  const validationErrors = [];

  for (const rawEnv of envelopes) {
    try {
      // 1. Version Migration Check
      const envelope = migrateEnvelopeVersion(rawEnv);

      // 2. Schema Validation
      const schemaCheck = validateAgriculturalDataEnvelope(envelope);
      if (!schemaCheck.isValid) {
        rejectedCount++;
        validationErrors.push({
          recordId: envelope?.recordId || 'unknown',
          errors: schemaCheck.errors
        });
        quarantineRecord(exchangeId, envelope, 'SCHEMA_VALIDATION_FAILURE', schemaCheck.errors);
        continue;
      }

      // 3. Privacy / Anonymization Transformation if required
      if (options.anonymize !== false && destination.includes('Network') || destination.includes('Research')) {
        const transformResult = applyPrivacyPreservingTransform(envelope, options);
        if (!transformResult.success) {
          rejectedCount++;
          validationErrors.push({
            recordId: envelope.recordId,
            errors: [transformResult.reason]
          });
          quarantineRecord(exchangeId, envelope, 'PRIVACY_PERMISSION_BLOCKED', [transformResult.reason]);
          continue;
        }
        processedRecords.push(transformResult.anonymizedEnvelope);
      } else {
        processedRecords.push(envelope);
      }

      validatedCount++;
    } catch (err) {
      rejectedCount++;
      validationErrors.push({
        recordId: rawEnv?.recordId || 'unparseable',
        errors: [err.message]
      });
      quarantineRecord(exchangeId, rawEnv, 'UNHANDLED_PROCESSING_ERROR', [err.message]);
    }
  }

  // Determine Exchange Status
  let status = EXCHANGE_STATUS.COMPLETED;
  if (envelopes.length === 0) {
    status = EXCHANGE_STATUS.COMPLETED;
  } else if (rejectedCount === envelopes.length) {
    status = EXCHANGE_STATUS.REJECTED;
  } else if (rejectedCount > 0) {
    status = EXCHANGE_STATUS.PARTIAL;
  }

  const exchangeLog = {
    exchangeId,
    timestamp,
    source,
    destination,
    recordType: recordType || 'mixed_agri_records',
    totalCount: envelopes.length,
    recordCount: validatedCount,
    errorCount: rejectedCount,
    status,
    schemaVersion: '1.2.0',
    validationStatus: rejectedCount === 0 ? 'ALL_VALID' : rejectedCount < envelopes.length ? 'PARTIAL_FAILURES' : 'ALL_REJECTED',
    validationErrors: validationErrors.slice(0, 10)
  };

  const currentLogs = getExchangeLogsFromStore();
  currentLogs.unshift(exchangeLog);
  saveExchangeLogsToStore(currentLogs);

  return {
    exchangeId,
    status,
    validatedCount,
    rejectedCount,
    processedRecords,
    log: exchangeLog
  };
}

/**
 * Quarantines an invalid record for administrative audit
 */
function quarantineRecord(exchangeId, record, reasonCode, issues = []) {
  const quarantineEntry = {
    id: `QUAR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    exchangeId,
    recordId: record?.recordId || 'unassigned',
    reasonCode,
    issues,
    rawPayloadSnippet: JSON.stringify(record?.payload || record || {}).substring(0, 300),
    quarantinedAt: new Date().toISOString()
  };

  if (isLocalStorageAvailable()) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARANTINE_STORE) || '[]');
      existing.unshift(quarantineEntry);
      localStorage.setItem(STORAGE_KEYS.QUARANTINE_STORE, JSON.stringify(existing.slice(0, 100)));
    } catch (e) {
      console.warn('Failed to quarantine record:', e);
    }
  } else {
    memoryQuarantineStore.unshift(quarantineEntry);
  }

  return quarantineEntry;
}

/**
 * Retrieves the data exchange audit logs
 */
export function getExchangeLogs() {
  return getExchangeLogsFromStore();
}

/**
 * Retrieves quarantined records
 */
export function getQuarantinedRecords() {
  if (isLocalStorageAvailable()) {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARANTINE_STORE) || '[]');
    } catch (e) {
      return [];
    }
  }
  return memoryQuarantineStore;
}

/**
 * Resets stores for test runs
 */
export function resetExchangeMemoryStore() {
  memoryExchangeLogs = [];
  memoryQuarantineStore = [];
}
