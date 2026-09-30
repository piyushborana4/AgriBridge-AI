/**
 * AgriBridge AI — Privacy-Preserving Transformation & Anonymization Engine (Phase 7)
 * Implements privacy-preserving transformations on AgriculturalDataEnvelopes prior to
 * cross-border research, organizational benchmarking, or network aggregation.
 * 
 * CORE PRINCIPLE:
 * We do not claim "perfect zero-knowledge anonymity".
 * We perform verified "privacy-preserving transformations" that strip personal identifiers
 * and coarsen spatial precision while preserving necessary agronomic utility.
 */

import { DATA_VISIBILITY } from './dataContracts.js';
import { getFarmConsent } from './consentService.js';

/**
 * Coarsens spatial coordinates to reduce spatial identification risk
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} precisionLevel - 'exact' | 'district_approximate' | 'regional_centroid'
 * @returns {{ lat: number, lng: number, precisionNote: string }}
 */
export function coarsenCoordinates(lat, lng, precisionLevel = 'district_approximate') {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { lat: null, lng: null, precisionNote: 'Coordinates omitted' };
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    return { lat: null, lng: null, precisionNote: 'Invalid coordinates omitted' };
  }

  if (precisionLevel === 'exact') {
    return { lat: numLat, lng: numLng, precisionNote: 'Exact coordinate retained (Requires specific consent)' };
  }

  if (precisionLevel === 'regional_centroid') {
    // 1 decimal place (~11.1 km precision)
    return {
      lat: Math.round(numLat * 10) / 10,
      lng: Math.round(numLng * 10) / 10,
      precisionNote: 'Coarsened to 10km regional centroid'
    };
  }

  // Default: district_approximate (2 decimal places ~1.1 km precision)
  return {
    lat: Math.round(numLat * 100) / 100,
    lng: Math.round(numLng * 100) / 100,
    precisionNote: 'Coarsened to ~1km district grid'
  };
}

/**
 * Applies privacy-preserving transformation to an AgriculturalDataEnvelope
 * @param {object} envelope - Standard AgriculturalDataEnvelope
 * @param {object} [options]
 * @param {string} [options.targetScope='research'] - 'research' | 'shared_network' | 'organization'
 * @param {string} [options.precisionLevel] - 'district_approximate' | 'regional_centroid'
 * @returns {{ success: boolean, anonymizedEnvelope: object|null, reason?: string }}
 */
export function applyPrivacyPreservingTransform(envelope, options = {}) {
  if (!envelope || typeof envelope !== 'object') {
    return { success: false, anonymizedEnvelope: null, reason: 'Invalid data envelope' };
  }

  const farmId = envelope.farmId;

  // 1. Verify consent permission if farmId is present
  if (farmId) {
    const consent = getFarmConsent(farmId);
    if (consent.visibility === DATA_VISIBILITY.PRIVATE || consent.consentStatus === 'revoked') {
      return {
        success: false,
        anonymizedEnvelope: null,
        reason: 'Sharing blocked: Farmer consent is set to PRIVATE or REVOKED'
      };
    }

    // Check specific scope
    const targetScope = options.targetScope || 'research';
    if (targetScope === 'research' && !consent.sharingScope.allowAnonymizedResearch && !consent.sharingScope.allowBricsKnowledgeHub) {
      return {
        success: false,
        anonymizedEnvelope: null,
        reason: 'Sharing blocked: Farmer has not granted consent for research/knowledge exchange scope'
      };
    }
  }

  // 2. Clone payload safely
  const originalPayload = envelope.payload ? JSON.parse(JSON.stringify(envelope.payload)) : {};

  // 3. Strip Direct Identifiers from Payload
  delete originalPayload.farmerName;
  delete originalPayload.farmerPhone;
  delete originalPayload.farmerEmail;
  delete originalPayload.contactInfo;
  delete originalPayload.nationalFarmerId;
  delete originalPayload.parcelName;
  delete originalPayload.ownerName;
  delete originalPayload.aadharNumber;
  delete originalPayload.taxId;

  // 4. Coarsen Geometry / Spatial Coordinates
  let anonymizedGeometry = null;
  const precision = options.precisionLevel || 'district_approximate';

  if (envelope.geometry && envelope.geometry.coordinates) {
    const [rawLng, rawLat] = envelope.geometry.coordinates;
    const coarsened = coarsenCoordinates(rawLat, rawLng, precision);
    anonymizedGeometry = {
      type: 'Point',
      coordinates: [coarsened.lng, coarsened.lat],
      spatialAccuracyMeters: precision === 'regional_centroid' ? 11000 : 1100,
      precisionNote: coarsened.precisionNote
    };
  }

  // 5. Construct Anonymized AgriculturalDataEnvelope
  const anonymizedEnvelope = {
    schemaVersion: envelope.schemaVersion || '1.2.0',
    recordType: envelope.recordType,
    recordId: `ANON-${envelope.recordId.substring(0, 16)}`,
    country: envelope.country || 'India',
    region: envelope.region || 'Regional Agrometeorological Zone',
    farmId: null, // Stripped for research/network sharing
    geometry: anonymizedGeometry,
    timestamp: envelope.timestamp || new Date().toISOString(),
    payload: originalPayload,
    provenance: {
      source: envelope.provenance?.source || 'AgriBridge AI Transform',
      provider: 'Privacy-Preserving Interchange Pipeline',
      sourceType: 'DERIVED',
      retrievedAt: new Date().toISOString(),
      observedAt: envelope.provenance?.observedAt || envelope.timestamp,
      method: 'Privacy-Preserving Anonymization & Coordinate Coarsening',
      confidence: envelope.provenance?.confidence || 0.85,
      isLive: false,
      privacyTransformationApplied: true,
      coarsenedPrecision: precision
    },
    quality: {
      completeness: envelope.quality?.completeness || 0.95,
      freshness: envelope.quality?.freshness || 1.0,
      spatialAccuracy: precision === 'regional_centroid' ? 11000 : 1100,
      temporalAccuracy: 86400,
      confidence: 0.90,
      issues: ['Direct personal identifiers removed', 'Spatial coordinates coarsened']
    },
    permissions: {
      visibility: DATA_VISIBILITY.RESEARCH,
      consentRequired: true,
      consentStatus: 'granted',
      purpose: options.targetScope || 'Anonymized Research & Regional Intelligence'
    }
  };

  return {
    success: true,
    anonymizedEnvelope,
    reason: 'Privacy-preserving transformation successfully completed'
  };
}
