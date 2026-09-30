/**
 * AgriBridge AI - Central Platform Service Configuration
 * 
 * Defines modes:
 * AI_MODE: "live" (when Gemini is active) | "prototype" (when fallback mode is active)
 * DATA_MODE: "prototype" | "live" (for sensor/weather/satellite streams)
 */

export const CONFIG = {
  API_BASE_URL: '/api',
  DEFAULT_AI_MODE: 'prototype',
  DATA_MODE: 'prototype',
  CONFIDENCE_THRESHOLD_UNCERTAIN: 70,
  MAX_IMAGE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
};

let cachedAIStatus = null;

/**
 * Checks backend API health and Gemini connectivity status
 */
export async function checkAIHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${CONFIG.API_BASE_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      cachedAIStatus = data;
      return data;
    }
  } catch (e) {
    // API server not running or network error - gracefully fall back
  }

  cachedAIStatus = {
    status: 'fallback',
    aiMode: 'prototype',
    model: 'Prototype Calibrated Model',
    message: 'Prototype AI mode — connect Gemini API for live analysis.'
  };

  return cachedAIStatus;
}

export function getCachedAIStatus() {
  return cachedAIStatus || {
    status: 'ready',
    aiMode: 'prototype',
    model: 'Prototype Model',
    message: 'Prototype AI mode — connect Gemini API for live analysis.'
  };
}
