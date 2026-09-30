/**
 * AgriBridge AI — Resilience, Circuit Breakers & Provider Health Service (Phase 9)
 * Manages circuit breakers for external telemetry providers, exponential retries,
 * idempotency locks, and truthful provider failure fallbacks.
 */

export const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Failing, fast-fallback
  HALF_OPEN: 'HALF_OPEN'  // Testing recovery
};

export const PROVIDER_HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNAVAILABLE: 'UNAVAILABLE',
  NOT_CONFIGURED: 'NOT_CONFIGURED'
};

/**
 * Production Circuit Breaker Implementation
 */
export class CircuitBreaker {
  constructor({
    name = 'generic-breaker',
    failureThreshold = 3,
    resetTimeoutMs = 15000,
    fallbackFn = null
  } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.fallbackFn = fallbackFn;
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(actionFn, ...args) {
    const now = Date.now();

    // Check if OPEN circuit should transition to HALF_OPEN
    if (this.state === CIRCUIT_STATES.OPEN) {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CIRCUIT_STATES.HALF_OPEN;
        this.successCount = 0;
      } else {
        // Fast-fail to fallback
        if (this.fallbackFn) return this.fallbackFn(...args);
        throw new Error(`Circuit for ${this.name} is OPEN (Fast-fallback active).`);
      }
    }

    try {
      const result = await actionFn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (this.fallbackFn) {
        return this.fallbackFn(...args);
      }
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= 2) {
        this.state = CIRCUIT_STATES.CLOSED;
      }
    }
  }

  onFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold || this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.state = CIRCUIT_STATES.OPEN;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
    };
  }
}

/**
 * Retries an asynchronous function with exponential backoff and jitter
 * @param {Function} fn - Function to execute
 * @param {object} [options]
 * @param {number} [options.maxRetries=3]
 * @param {number} [options.baseDelayMs=200]
 * @param {number} [options.backoffFactor=2]
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, {
  maxRetries = 3,
  baseDelayMs = 200,
  backoffFactor = 2
} = {}) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt >= maxRetries) throw err;
      const jitter = Math.random() * 50;
      const delay = (baseDelayMs * Math.pow(backoffFactor, attempt - 1)) + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// In-memory idempotency cache
const idempotencyStore = new Map();

/**
 * Idempotency gatekeeper to prevent duplicate mutations
 * @param {string} key - Idempotency key
 * @param {number} [ttlMs=300000] - 5 minutes default
 * @returns {{ isDuplicate: boolean, cachedResult?: any }}
 */
export function checkIdempotency(key, ttlMs = 300000) {
  if (!key) return { isDuplicate: false };
  const record = idempotencyStore.get(key);
  if (record && (Date.now() - record.timestamp < ttlMs)) {
    return { isDuplicate: true, cachedResult: record.result };
  }
  return { isDuplicate: false };
}

/**
 * Stores the result for an idempotency key
 * @param {string} key
 * @param {any} result
 */
export function setIdempotencyResult(key, result) {
  if (!key) return;
  idempotencyStore.set(key, {
    timestamp: Date.now(),
    result
  });
}

// Track provider health statuses
const providerHealthStore = {
  weather: { status: PROVIDER_HEALTH_STATUS.HEALTHY, provider: 'Open-Meteo High-Resolution Agrometeorology', lastChecked: new Date().toISOString() },
  satellite: { status: PROVIDER_HEALTH_STATUS.HEALTHY, provider: 'Copernicus Sentinel-2 MSI STAC', lastChecked: new Date().toISOString() },
  soil: { status: PROVIDER_HEALTH_STATUS.HEALTHY, provider: 'ISRIC SoilGrids & National Soil Health Card', lastChecked: new Date().toISOString() },
  gemini: { 
    status: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0 && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') 
      ? PROVIDER_HEALTH_STATUS.HEALTHY 
      : PROVIDER_HEALTH_STATUS.NOT_CONFIGURED, 
    provider: 'Google Gemini 2.5 Multimodal Engine', 
    lastChecked: new Date().toISOString() 
  },
  database: { status: PROVIDER_HEALTH_STATUS.HEALTHY, provider: 'AgriBridge Sovereign Farm Store', lastChecked: new Date().toISOString() }
};

/**
 * Updates a provider's operational health state
 * @param {string} providerName - 'weather' | 'satellite' | 'soil' | 'gemini' | 'database'
 * @param {string} status - from PROVIDER_HEALTH_STATUS
 * @param {string} [notes]
 */
export function updateProviderHealth(providerName, status, notes = '') {
  if (providerHealthStore[providerName]) {
    providerHealthStore[providerName].status = status;
    providerHealthStore[providerName].lastChecked = new Date().toISOString();
    if (notes) providerHealthStore[providerName].notes = notes;
  }
}

/**
 * Returns complete provider and subsystem health overview
 * @returns {object}
 */
export function getProviderHealthOverview() {
  const isHealthy = Object.values(providerHealthStore).every(p => p.status === PROVIDER_HEALTH_STATUS.HEALTHY || p.status === PROVIDER_HEALTH_STATUS.NOT_CONFIGURED);
  const hasUnavailable = Object.values(providerHealthStore).some(p => p.status === PROVIDER_HEALTH_STATUS.UNAVAILABLE);

  let overallStatus = PROVIDER_HEALTH_STATUS.HEALTHY;
  if (hasUnavailable) {
    overallStatus = PROVIDER_HEALTH_STATUS.DEGRADED;
  }

  return {
    overallStatus,
    providers: { ...providerHealthStore },
    timestamp: new Date().toISOString()
  };
}
