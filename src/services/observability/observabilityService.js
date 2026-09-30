/**
 * AgriBridge AI — Observability, Structured Logging & Audit Event Service (Phase 9)
 * Manages request correlation, structured log generation, immutable audit logging,
 * and operational telemetry metrics tracking.
 */

import { LOG_LEVELS } from '../config/environment.js';

// Universal in-memory audit store
let auditEventLedger = [
  {
    auditId: 'audit-boot-001',
    timestamp: '2026-09-30T10:00:00.000Z',
    eventType: 'SYSTEM_STARTUP',
    actor: 'system-process',
    resourceType: 'system',
    resourceId: 'agribridge-core-node',
    requestId: 'req-boot-init',
    result: 'SUCCESS',
    metadata: { environment: 'production', status: 'ready' }
  }
];

// Telemetry counters
const telemetryStore = {
  apiRequestsTotal: 0,
  apiErrorsTotal: 0,
  aiRequestsTotal: 0,
  aiValidationFailuresTotal: 0,
  providerOutagesTotal: 0,
  cacheHitsTotal: 0,
  cacheMissesTotal: 0
};

/**
 * Generates a unique Request Correlation Identifier
 * @returns {string} e.g. "req-1727712345678-abc12"
 */
export function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Creates a sanitized, structured log entry
 * @param {object} params
 * @returns {object} Structured log record
 */
export function createStructuredLog({
  level = LOG_LEVELS.INFO,
  service = 'agribridge-core',
  requestId = null,
  userId = null,
  farmId = null,
  operation = 'general',
  durationMs = null,
  status = 'SUCCESS',
  errorCode = null,
  message = '',
  metadata = {}
}) {
  // Redact any potential secret in metadata
  const cleanMetadata = { ...metadata };
  ['password', 'token', 'apiKey', 'api_key', 'secret'].forEach(k => {
    if (cleanMetadata[k]) cleanMetadata[k] = '[REDACTED]';
  });

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    requestId: requestId || generateRequestId(),
    userId: userId || 'anonymous',
    farmId: farmId || 'unspecified',
    operation,
    durationMs: durationMs !== null ? Math.round(durationMs) : null,
    status,
    errorCode,
    message,
    metadata: cleanMetadata
  };

  return entry;
}

/**
 * Records an immutable audit event
 * @param {object} params
 * @returns {object} Created Audit Event
 */
export function recordAuditEvent({
  eventType,
  actor = 'anonymous',
  resourceType,
  resourceId,
  requestId = null,
  result = 'SUCCESS',
  metadata = {}
}) {
  if (!eventType) throw new Error('AuditEvent requires eventType');

  // Sanitize metadata
  const cleanMeta = { ...metadata };
  ['password', 'apiKey', 'secret', 'token'].forEach(k => {
    if (cleanMeta[k]) cleanMeta[k] = '[REDACTED]';
  });

  const event = {
    auditId: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType,
    actor,
    resourceType: resourceType || 'general',
    resourceId: resourceId || 'unspecified',
    requestId: requestId || generateRequestId(),
    result,
    metadata: cleanMeta
  };

  auditEventLedger.unshift(event);
  return event;
}

/**
 * Lists recorded audit events
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function listAuditEvents(filters = {}) {
  return auditEventLedger.filter(e => {
    if (filters.eventType && e.eventType !== filters.eventType) return false;
    if (filters.actor && e.actor !== filters.actor) return false;
    if (filters.resourceId && e.resourceId !== filters.resourceId) return false;
    return true;
  });
}

/**
 * Records telemetry metrics for observability
 * @param {string} metricName - Key in telemetryStore
 * @param {number} [increment=1]
 */
export function incrementTelemetry(metricName, increment = 1) {
  if (telemetryStore[metricName] !== undefined) {
    telemetryStore[metricName] += increment;
  }
}

/**
 * Returns current operational telemetry metrics
 * @returns {object} Telemetry statistics
 */
export function getTelemetryMetrics() {
  return {
    ...telemetryStore,
    timestamp: new Date().toISOString(),
    status: 'OBSERVABILITY_ACTIVE'
  };
}
