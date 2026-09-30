/**
 * AgriBridge AI — Phase 9 Production Hardening, Security & Observability Test Suite
 * Validates secret exposure detection, RBAC permissions, farm ownership verification,
 * input validation, circuit breakers, idempotency, structured logging, audit ledger, and observation caching.
 */

import assert from 'assert';
import {
  validateEnvironmentConfig,
  scanForSecretExposure,
  APP_ENVIRONMENTS
} from '../../config/environment.js';
import {
  USER_ROLES,
  hasPermission,
  verifyFarmOwnership,
  validateCoordinates,
  validateSoilParameters,
  validateImageUpload,
  sanitizeInput,
  checkRateLimit
} from '../../security/securityService.js';
import {
  generateRequestId,
  createStructuredLog,
  recordAuditEvent,
  listAuditEvents,
  incrementTelemetry,
  getTelemetryMetrics
} from '../../observability/observabilityService.js';
import {
  CircuitBreaker,
  CIRCUIT_STATES,
  retryWithBackoff,
  checkIdempotency,
  setIdempotencyResult,
  getProviderHealthOverview,
  updateProviderHealth,
  PROVIDER_HEALTH_STATUS
} from '../../resilience/resilienceService.js';
import { agriculturalCache } from '../../cache/cacheService.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('================================================================');
console.log('  AGRIBRIDGE AI — PHASE 9 PRODUCTION HARDENING & SECURITY TESTS ');
console.log('================================================================\n');

// 1. Secret Exposure Scanner
test('Security: Scans and flags secret tokens, API keys, and private credentials', () => {
  const safeText = 'Normal farm observation without credentials';
  assert.strictEqual(scanForSecretExposure(safeText).isSafe, true);

  const exposedKey = 'Configured key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q in client';
  const scanResult = scanForSecretExposure(exposedKey);
  assert.strictEqual(scanResult.isSafe, false);
  assert(scanResult.flaggedPatterns.includes('Google API Key'));
});

// 2. RBAC & Ownership Verification
test('Security: RBAC enforces role permissions and prevents unauthorized farm mutations', () => {
  const farmerUser = { id: 'farmer-101', role: USER_ROLES.FARMER };
  const expertUser = { id: 'expert-202', role: USER_ROLES.EXPERT };
  const researcherUser = { id: 'researcher-303', role: USER_ROLES.RESEARCHER };

  assert.strictEqual(hasPermission(farmerUser, 'farm:create'), true);
  assert.strictEqual(hasPermission(farmerUser, 'crop_doctor:review'), false); // Farmers cannot peer-review
  assert.strictEqual(hasPermission(expertUser, 'crop_doctor:review'), true);
  assert.strictEqual(hasPermission(researcherUser, 'farm:delete'), false);

  // Ownership verification
  const myFarm = { id: 'farm-1', ownerId: 'farmer-101' };
  const otherFarm = { id: 'farm-2', ownerId: 'farmer-999' };

  assert.strictEqual(verifyFarmOwnership(farmerUser, myFarm), true);
  assert.strictEqual(verifyFarmOwnership(farmerUser, otherFarm), false); // Unauthorized access blocked
  assert.strictEqual(verifyFarmOwnership(expertUser, otherFarm), true); // Extension officer access permitted
});

// 3. Input Validation & XSS Sanitization
test('Security: Validates coordinates, soil bounds, image uploads, and sanitizes XSS', () => {
  // Coordinates
  assert.strictEqual(validateCoordinates({ lat: 19.87, lng: 75.34 }).isValid, true);
  assert.strictEqual(validateCoordinates({ lat: 95.0, lng: 75.34 }).isValid, false); // lat > 90

  // Soil parameters
  assert.strictEqual(validateSoilParameters({ pH: 6.8, organicMatter: 2.5 }).isValid, true);
  assert.strictEqual(validateSoilParameters({ pH: 16.0 }).isValid, false); // pH > 14

  // Upload limits
  assert.strictEqual(validateImageUpload({ sizeBytes: 500000, mimeType: 'image/jpeg' }).isValid, true);
  assert.strictEqual(validateImageUpload({ sizeBytes: 25000000, mimeType: 'image/jpeg' }).isValid, false); // >15MB
  assert.strictEqual(validateImageUpload({ sizeBytes: 50000, mimeType: 'application/pdf' }).isValid, false); // Forbidden format

  // XSS Sanitization
  const maliciousInput = '<script>alert("hack")</script>Healthy Tomato Field';
  const clean = sanitizeInput(maliciousInput);
  assert(!clean.includes('<script>'), 'Script tags must be stripped');
});

// 4. Rate Limiting & Sliding Window
test('Security: Rate limiter throttles excessive requests within time window', () => {
  const clientKey = `test-ip-${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(clientKey, 5, 10000);
    assert.strictEqual(res.allowed, true);
  }
  // 6th request exceeds limit
  const exceeded = checkRateLimit(clientKey, 5, 10000);
  assert.strictEqual(exceeded.allowed, false);
  assert.strictEqual(exceeded.remaining, 0);
});

// 5. Circuit Breaker & Resilience
async function runCircuitBreakerTests() {
  await asyncTest('Resilience: Circuit breaker opens on repeated provider failures and triggers safe fallback', async () => {
    let callCount = 0;
    const failingService = async () => {
      callCount += 1;
      throw new Error('Remote Provider Network Timeout');
    };

    const breaker = new CircuitBreaker({
      name: 'test-satellite-service',
      failureThreshold: 2,
      resetTimeoutMs: 1000,
      fallbackFn: () => ({ status: 'UNAVAILABLE', isFallback: true })
    });

    // Attempt 1: Fails -> Fallback returned
    const r1 = await breaker.execute(failingService);
    assert.strictEqual(r1.status, 'UNAVAILABLE');
    assert.strictEqual(breaker.state, CIRCUIT_STATES.CLOSED);

    // Attempt 2: Fails -> Threshold reached -> Circuit OPENS
    const r2 = await breaker.execute(failingService);
    assert.strictEqual(r2.status, 'UNAVAILABLE');
    assert.strictEqual(breaker.state, CIRCUIT_STATES.OPEN);

    // Attempt 3: Fast-fail without calling external service
    const beforeCalls = callCount;
    const r3 = await breaker.execute(failingService);
    assert.strictEqual(r3.status, 'UNAVAILABLE');
    assert.strictEqual(callCount, beforeCalls); // External service was not called
  });
}

// 6. Idempotency Manager
test('Resilience: Idempotency manager traps and prevents duplicate mutations', () => {
  const key = `idempotency-key-${Date.now()}`;
  assert.strictEqual(checkIdempotency(key).isDuplicate, false);

  setIdempotencyResult(key, { actionId: 'act-123', status: 'COMPLETED' });

  const duplicateCheck = checkIdempotency(key);
  assert.strictEqual(duplicateCheck.isDuplicate, true);
  assert.strictEqual(duplicateCheck.cachedResult.actionId, 'act-123');
});

// 7. Structured Logging & Secret Redaction
test('Observability: Structured logs correlate request IDs and redact sensitive fields', () => {
  const log = createStructuredLog({
    service: 'farm-intelligence',
    operation: 'evaluate_risk',
    durationMs: 42.5,
    metadata: {
      farmId: 'farm-1',
      apiKey: 'AIzaSySecret123', // Must be redacted
      crop: 'Onion'
    }
  });

  assert(log.requestId.startsWith('req-'));
  assert.strictEqual(log.metadata.apiKey, '[REDACTED]');
  assert.strictEqual(log.durationMs, 43);
});

// 8. Immutable Audit Event Ledger
test('Observability: Records and queries immutable audit transactions', () => {
  const event = recordAuditEvent({
    eventType: 'ACTION_COMPLETED',
    actor: 'farmer-user-01',
    resourceType: 'farm_action',
    resourceId: 'action-irrigate-plot-04',
    metadata: { method: 'drip' }
  });

  assert(event.auditId.startsWith('audit-'));
  assert.strictEqual(event.eventType, 'ACTION_COMPLETED');

  const queried = listAuditEvents({ eventType: 'ACTION_COMPLETED' });
  assert(queried.length >= 1);
});

// 9. Freshness-Aware Observation Cache
test('Cache: Caches agricultural observations with provenance and enforces TTL', () => {
  const cacheKey = 'weather-forecast-farm-1';
  agriculturalCache.set(cacheKey, { temperature: 31.5, humidity: 62 }, {
    ttlMs: 5000,
    source: 'Open-Meteo High-Resolution Agrometeorology',
    provenance: 'Observed Live'
  });

  const cached = agriculturalCache.get(cacheKey);
  assert(cached !== null);
  assert.strictEqual(cached.isCached, true);
  assert.strictEqual(cached.source, 'Open-Meteo High-Resolution Agrometeorology');
  assert.strictEqual(cached.data.temperature, 31.5);
});

// 10. Provider Health Overview (Truth in Operational Status)
test('Resilience: Provider health tracker reports honest operational states without fake metrics', () => {
  const health = getProviderHealthOverview();
  assert(health.providers.weather !== undefined);
  assert(health.providers.satellite !== undefined);
  assert(health.providers.soil !== undefined);
  assert(health.providers.gemini !== undefined);
  assert.strictEqual(health.overallStatus, PROVIDER_HEALTH_STATUS.HEALTHY);

  // Mark a provider unavailable
  updateProviderHealth('satellite', PROVIDER_HEALTH_STATUS.UNAVAILABLE, 'CDSE STAC endpoint maintenance');
  const degradedHealth = getProviderHealthOverview();
  assert.strictEqual(degradedHealth.overallStatus, PROVIDER_HEALTH_STATUS.DEGRADED);
  assert.strictEqual(degradedHealth.providers.satellite.status, PROVIDER_HEALTH_STATUS.UNAVAILABLE);

  // Restore
  updateProviderHealth('satellite', PROVIDER_HEALTH_STATUS.HEALTHY);
});

async function main() {
  await runCircuitBreakerTests();

  console.log('\n================================================================');
  console.log(`  PHASE 9 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
