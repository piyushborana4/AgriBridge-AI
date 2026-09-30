import { CONFIG } from '../config';

/**
 * Executes a resilient JSON request to the AgriBridge AI backend API.
 * Never throws an uncaught error to the UI; always returns a structured object.
 */
export async function apiRequest(endpoint, payload = {}, timeoutMs = 15000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }

    // Attempt to parse server error payload
    let errorMsg = 'Server responded with error status';
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // Ignore parse error
    }

    return {
      success: false,
      error: errorMsg,
      status: response.status,
    };
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      error: isTimeout ? 'Request timed out' : (error.message || 'Network connection failed'),
      isTimeout,
    };
  }
}
