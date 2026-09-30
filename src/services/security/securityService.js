/**
 * AgriBridge AI — Production Security, RBAC & Input Validation Service (Phase 9)
 * Handles role-based access control, ownership verification, input validation,
 * rate limiting, upload sanitization, and AI cost controls.
 */

export const USER_ROLES = {
  FARMER: 'FARMER',
  EXPERT: 'EXPERT',
  FIELD_OFFICER: 'FIELD_OFFICER',
  RESEARCHER: 'RESEARCHER',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.FARMER]: [
    'farm:read', 'farm:create', 'farm:update', 'farm:delete',
    'journal:read', 'journal:create', 'journal:update',
    'crop_doctor:create', 'crop_doctor:read',
    'advisory:read', 'action:read', 'action:update', 'alert:read', 'alert:update',
    'knowledge:read', 'model:read', 'evaluation:read'
  ],
  [USER_ROLES.EXPERT]: [
    'farm:read', 'journal:read', 'crop_doctor:create', 'crop_doctor:read', 'crop_doctor:review',
    'advisory:read', 'action:read', 'alert:read',
    'knowledge:read', 'knowledge:manage', 'model:read', 'evaluation:read', 'evaluation:run'
  ],
  [USER_ROLES.FIELD_OFFICER]: [
    'farm:read', 'farm:create', 'farm:update', 'journal:read', 'journal:create',
    'crop_doctor:create', 'crop_doctor:read', 'advisory:read', 'action:read', 'action:update', 'alert:read'
  ],
  [USER_ROLES.RESEARCHER]: [
    'knowledge:read', 'model:read', 'evaluation:read', 'evaluation:run'
  ],
  [USER_ROLES.ADMIN]: [
    'farm:read', 'farm:create', 'farm:update', 'farm:delete',
    'journal:read', 'journal:create', 'journal:update',
    'crop_doctor:create', 'crop_doctor:read', 'crop_doctor:review',
    'advisory:read', 'action:read', 'action:update', 'alert:read', 'alert:update',
    'knowledge:read', 'knowledge:manage', 'model:read', 'model:manage',
    'evaluation:read', 'evaluation:run', 'admin:system', 'admin:audit'
  ],
  [USER_ROLES.SYSTEM]: [
    'admin:system', 'admin:audit', 'evaluation:run'
  ]
};

/**
 * Checks if a user has permission to perform an action
 * @param {object} user - User object { id, role }
 * @param {string} permission - Required permission string
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const role = user.role.toUpperCase();
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || role === USER_ROLES.ADMIN;
}

/**
 * Validates whether a user is authorized to access/modify a specific farm
 * @param {object} user - Requesting user { id, role }
 * @param {object} farm - Target farm { id, ownerId, sharedWith }
 * @returns {boolean}
 */
export function verifyFarmOwnership(user, farm) {
  if (!user || !farm) return false;
  const role = (user.role || '').toUpperCase();
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SYSTEM) return true;
  if (role === USER_ROLES.EXPERT || role === USER_ROLES.FIELD_OFFICER) return true; // Authorized extension staff
  return farm.ownerId === user.id || (Array.isArray(farm.sharedWith) && farm.sharedWith.includes(user.id));
}

/**
 * Validates geographic coordinate bounds
 * @param {object} coords - { lat, lng } or { latitude, longitude }
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateCoordinates(coords) {
  if (!coords || typeof coords !== 'object') {
    return { isValid: false, error: 'Coordinates must be an object with latitude and longitude.' };
  }
  const lat = coords.lat !== undefined ? Number(coords.lat) : Number(coords.latitude);
  const lng = coords.lng !== undefined ? Number(coords.lng) : Number(coords.longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return { isValid: false, error: `Invalid latitude: ${lat}. Must be between -90 and 90.` };
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return { isValid: false, error: `Invalid longitude: ${lng}. Must be between -180 and 180.` };
  }

  return { isValid: true };
}

/**
 * Validates soil parameter ranges
 * @param {object} soil - { pH, organicMatter, nitrogen, phosphorus, potassium }
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateSoilParameters(soil) {
  const errors = [];
  if (!soil || typeof soil !== 'object') return { isValid: true, errors: [] };

  if (soil.pH !== undefined && (soil.pH < 0 || soil.pH > 14)) {
    errors.push(`Soil pH must be between 0 and 14 (got ${soil.pH})`);
  }
  if (soil.organicMatter !== undefined && (soil.organicMatter < 0 || soil.organicMatter > 100)) {
    errors.push(`Organic matter percentage must be between 0 and 100% (got ${soil.organicMatter})`);
  }
  if (soil.nitrogen !== undefined && soil.nitrogen < 0) {
    errors.push(`Soil nitrogen cannot be negative (got ${soil.nitrogen})`);
  }
  if (soil.phosphorus !== undefined && soil.phosphorus < 0) {
    errors.push(`Soil phosphorus cannot be negative (got ${soil.phosphorus})`);
  }
  if (soil.potassium !== undefined && soil.potassium < 0) {
    errors.push(`Soil potassium cannot be negative (got ${soil.potassium})`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates uploaded image file size and MIME type
 * @param {object} params
 * @param {number} params.sizeBytes - File size in bytes
 * @param {string} params.mimeType - MIME type
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateImageUpload({ sizeBytes, mimeType }) {
  const MAX_SIZE = 15 * 1024 * 1024; // 15MB
  const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

  if (sizeBytes && sizeBytes > MAX_SIZE) {
    return { isValid: false, error: `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum permitted limit of 15MB.` };
  }
  if (mimeType && !ALLOWED_MIMES.includes(mimeType.toLowerCase())) {
    return { isValid: false, error: `Invalid image type: ${mimeType}. Allowed formats: JPG, PNG, WEBP.` };
  }

  return { isValid: true };
}

/**
 * Sanitizes user input string against XSS injection
 * @param {string} input
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, tag => ({ '<': '&lt;', '>': '&gt;' }[tag] || tag));
}

// In-memory sliding window rate limiter
const rateLimitStore = new Map();

/**
 * Rate limiter utility
 * @param {string} key - Identifier (IP, userId, farmId)
 * @param {number} limit - Maximum allowed requests in window
 * @param {number} [windowMs=60000] - Window duration in milliseconds (default 1 min)
 * @returns {{ allowed: boolean, remaining: number, resetTimeMs: number }}
 */
export function checkRateLimit(key, limit = 120, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Remove timestamps outside window
  const activeTimestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: windowMs - (now - oldest)
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  return {
    allowed: true,
    remaining: limit - activeTimestamps.length,
    resetTimeMs: windowMs
  };
}
