/**
 * AgriBridge AI — Freshness-Aware Agricultural Observation Cache (Phase 9)
 * Provides TTL caching for weather, satellite, and soil telemetry while strictly preserving
 * observation timestamps, retrieval metadata, and data provenance.
 */

class ObservationCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Sets an entry in the cache with explicit provenance and TTL
   * @param {string} key - Unique cache key
   * @param {any} payload - Agricultural telemetry payload
   * @param {object} params
   * @param {number} [params.ttlMs=900000] - 15 minutes default
   * @param {string} [params.source='External Provider']
   * @param {string} [params.provenance='Observed']
   * @param {string} [params.observedAt]
   */
  set(key, payload, {
    ttlMs = 900000,
    source = 'External Provider',
    provenance = 'Observed',
    observedAt = new Date().toISOString()
  } = {}) {
    const now = Date.now();
    this.cache.set(key, {
      payload,
      source,
      provenance,
      observedAt,
      retrievedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
      timestampMs: now,
      ttlMs
    });
  }

  /**
   * Retrieves a cache entry if fresh and unexpired
   * @param {string} key
   * @returns {object|null} Cache record with payload and provenance, or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestampMs > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.payload,
      isCached: true,
      source: entry.source,
      provenance: entry.provenance,
      observedAt: entry.observedAt,
      retrievedAt: entry.retrievedAt,
      expiresAt: entry.expiresAt,
      ageSeconds: Math.round((now - entry.timestampMs) / 1000)
    };
  }

  /**
   * Clears expired items from cache
   */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestampMs > entry.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Returns cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      activeKeys: Array.from(this.cache.keys())
    };
  }
}

export const agriculturalCache = new ObservationCache();
