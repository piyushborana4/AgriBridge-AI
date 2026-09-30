/**
 * AgriBridge AI — Production Environment & Centralized Configuration (Phase 9)
 * Manages environment-aware configurations, required vs optional provider settings,
 * startup validation, and client-side secret exposure guards.
 */

export const APP_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

export const FEATURE_FLAGS = {
  ENABLE_GEMINI_LIVE: true,
  ENABLE_SATELLITE_LIVE: true,
  ENABLE_SOIL_LIVE: true,
  ENABLE_WEATHER_LIVE: true,
  ENABLE_BRICS_EXCHANGE: true,
  ENABLE_EXPERT_REVIEW: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_AI_COST_CONTROLS: true,
  ENABLE_AUDIT_LOGGING: true
};

/**
 * Returns the active application environment
 */
export function getAppEnvironment() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || process.env.APP_ENV || APP_ENVIRONMENTS.DEVELOPMENT;
  }
  return APP_ENVIRONMENTS.DEVELOPMENT;
}

/**
 * Validates environment configuration at startup
 * @param {object} [envVars] - Environment variables to validate
 * @returns {{ isValid: boolean, warnings: string[], errors: string[], config: object }}
 */
export function validateEnvironmentConfig(envVars = (typeof process !== 'undefined' ? process.env : {})) {
  const env = envVars || {};
  const errors = [];
  const warnings = [];

  const appEnv = env.NODE_ENV || env.APP_ENV || APP_ENVIRONMENTS.DEVELOPMENT;
  const port = Number(env.PORT) || 3001;

  // AI Configuration
  const hasGeminiKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your_gemini_api_key_here' && env.GEMINI_API_KEY.trim() !== '');
  if (!hasGeminiKey) {
    if (appEnv === APP_ENVIRONMENTS.PRODUCTION) {
      warnings.push('GEMINI_API_KEY not configured. Application will operate in safe deterministic prototype mode.');
    } else {
      warnings.push('GEMINI_API_KEY not provided — running in prototype fallback mode.');
    }
  }

  // Weather Provider
  const weatherUrl = env.OPEN_METEO_API_URL || 'https://api.open-meteo.com/v1/forecast';
  
  // Satellite STAC
  const stacUrl = env.COPERNICUS_STAC_URL || 'https://stac.dataspace.copernicus.eu/v1';

  // SoilGrids
  const soilUrl = env.SOILGRIDS_API_URL || 'https://rest.isric.org/soilgrids/v2.0/properties/query';

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      environment: appEnv,
      port,
      ai: {
        isConfigured: hasGeminiKey,
        model: env.GEMINI_MODEL || 'gemini-2.5-flash',
        timeoutMs: Number(env.AI_TIMEOUT_MS) || 20000,
        maxTokens: Number(env.AI_MAX_TOKENS) || 2048
      },
      providers: {
        weatherUrl,
        stacUrl,
        soilUrl
      },
      rateLimits: {
        apiRequestsPerMin: Number(env.RATE_LIMIT_API_PER_MIN) || 120,
        aiRequestsPerMin: Number(env.RATE_LIMIT_AI_PER_MIN) || 15,
        maxImageSizeBytes: Number(env.MAX_IMAGE_SIZE_BYTES) || 15728640 // 15MB
      },
      features: { ...FEATURE_FLAGS }
    }
  };
}

/**
 * Scans payload or text to prevent accidental secret leakage
 * @param {string|object} content
 * @returns {{ isSafe: boolean, flaggedPatterns: string[] }}
 */
export function scanForSecretExposure(content) {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  const flagged = [];

  // Detect common secret patterns
  const patterns = [
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
    { name: 'Bearer Token', regex: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi },
    { name: 'Generic Secret Key', regex: /(?:secret|password|private_key|apikey|api_key)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/gi }
  ];

  patterns.forEach(p => {
    if (p.regex.test(text)) {
      flagged.push(p.name);
    }
  });

  return {
    isSafe: flagged.length === 0,
    flaggedPatterns: flagged
  };
}
