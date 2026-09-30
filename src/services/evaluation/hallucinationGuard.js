/**
 * AgriBridge AI — Hallucination Guard & Unsupported Claim Detector (Phase 8)
 * Verifies AI-generated outputs against actual farm context and telemetry envelopes.
 * Builds claim-to-evidence traceability graphs and enforces strict AI Quality Gate decisions.
 */

import { CLAIM_TYPES, GROUNDING_LEVELS, QUALITY_GATE_STATUS, createClaimTrace } from './evaluationContracts.js';
import { calculateEvidenceCoverage } from './evaluationMetrics.js';

/**
 * Extracts individual factual and advisory claims from AI generated text or structured responses
 * @param {object|string} aiOutput
 * @returns {Array<string>} List of individual statements/claims
 */
export function extractClaims(aiOutput) {
  if (!aiOutput) return [];
  
  const claims = [];

  if (typeof aiOutput === 'string') {
    // Split by sentence terminators
    const sentences = aiOutput.split(/(?<=[.!?])\s+/);
    sentences.forEach(s => {
      const trimmed = s.trim();
      if (trimmed.length > 8) claims.push(trimmed);
    });
    return claims;
  }

  // Handle structured Crop Doctor / Advisory output
  if (aiOutput.diagnosis) claims.push(`Diagnosis: ${aiOutput.diagnosis}`);
  if (aiOutput.probableCause) claims.push(`Probable cause: ${aiOutput.probableCause}`);
  if (aiOutput.immediateAction) claims.push(`Immediate action: ${aiOutput.immediateAction}`);
  if (aiOutput.action && typeof aiOutput.action === 'string') claims.push(aiOutput.action);
  if (aiOutput.title && typeof aiOutput.title === 'string') claims.push(aiOutput.title);
  if (aiOutput.recommendation && typeof aiOutput.recommendation === 'string') claims.push(aiOutput.recommendation);
  if (Array.isArray(aiOutput.preventiveMeasures)) {
    aiOutput.preventiveMeasures.forEach(m => claims.push(`Preventive measure: ${m}`));
  }
  if (Array.isArray(aiOutput.recommendations)) {
    aiOutput.recommendations.forEach(r => {
      const text = typeof r === 'string' ? r : r.action || r.recommendation || r.title;
      if (text) claims.push(text);
    });
  }
  if (aiOutput.explanation) claims.push(aiOutput.explanation);

  return claims;
}

/**
 * Classifies a claim based on context availability and semantic markers
 * @param {string} claimText
 * @param {object} context - Unified Farm Context
 * @returns {string} Claim type from CLAIM_TYPES
 */
export function classifyClaim(claimText, context = {}) {
  const lower = claimText.toLowerCase();

  // Chemical dosage check
  if (/\b(\d+(\.\d+)?\s*(ml\/l|gm\/l|kg\/ha|litres?\/acre))\b/i.test(lower)) {
    return CLAIM_TYPES.UNSUPPORTED; // Direct dosage violation
  }

  if (lower.includes('recommend') || lower.includes('should') || lower.includes('apply') || lower.includes('advise')) {
    return CLAIM_TYPES.RECOMMENDATION;
  }
  if (lower.includes('forecast') || lower.includes('expected') || lower.includes('upcoming rainfall')) {
    return CLAIM_TYPES.FORECAST;
  }
  if (lower.includes('uncertain') || lower.includes('insufficient') || lower.includes('ambiguous') || lower.includes('cannot confirm')) {
    return CLAIM_TYPES.UNCERTAIN;
  }
  if (lower.includes('soil moisture') || lower.includes('temperature') || lower.includes('rainfall') || lower.includes('ndvi')) {
    return CLAIM_TYPES.OBSERVED;
  }
  if (lower.includes('risk') || lower.includes('stress') || lower.includes('gdd')) {
    return CLAIM_TYPES.DERIVED;
  }
  if (lower.includes('icar') || lower.includes('embrapa') || lower.includes('standard agronomic practice')) {
    return CLAIM_TYPES.KNOWLEDGE_BASED;
  }

  return CLAIM_TYPES.HYPOTHESIS;
}

/**
 * Builds a traceable Claim-to-Evidence graph
 * @param {object} params
 * @param {Array<string>} params.claims
 * @param {object} params.context - Farm Context Engine output
 * @param {Array<string>} [params.citedEvidenceIds]
 * @returns {Array<object>} List of ClaimTrace records
 */
export function buildClaimToEvidenceGraph({ claims = [], context = {}, citedEvidenceIds = [] }) {
  const availableEvidence = context.evidence || [];
  const availableIds = new Set(availableEvidence.map(e => e.id));

  return claims.map(claimText => {
    const claimType = classifyClaim(claimText, context);
    
    // Find relevant evidence matches
    const matchedEvidence = availableEvidence.filter(e => {
      const eDesc = (e.description || e.name || '').toLowerCase();
      const cLower = claimText.toLowerCase();
      return eDesc.split(' ').some(w => w.length > 4 && cLower.includes(w));
    });

    const matchedIds = matchedEvidence.map(e => e.id);
    const sources = [...new Set(matchedEvidence.map(e => e.source || 'AgriBridge Context'))];

    let groundingStatus = GROUNDING_LEVELS.MOSTLY_GROUNDED;
    if (claimType === CLAIM_TYPES.UNSUPPORTED) {
      groundingStatus = GROUNDING_LEVELS.UNSUPPORTED;
    } else if (matchedIds.length === 0 && claimType === CLAIM_TYPES.OBSERVED) {
      groundingStatus = GROUNDING_LEVELS.PARTIALLY_GROUNDED;
    }

    return createClaimTrace({
      claimText,
      claimType,
      groundingStatus,
      evidenceIds: matchedIds.length > 0 ? matchedIds : citedEvidenceIds.filter(id => availableIds.has(id)),
      sources: sources.length > 0 ? sources : ['Unified Farm Context Engine'],
      confidence: 0.90
    });
  });
}

/**
 * Detects hallucinations, fabricated evidence IDs, and unsupported claims
 * @param {object} params
 * @param {object|string} params.aiOutput
 * @param {object} params.context - Unified Farm Context
 * @returns {object} Hallucination analysis report
 */
export function detectHallucinations({ aiOutput, context = {} }) {
  const violations = [];
  const availableEvidenceIds = (context.evidence || []).map(e => e.id);

  // 1. Check cited evidence IDs in output
  let citedEvidenceIds = [];
  if (typeof aiOutput === 'object' && aiOutput !== null) {
    if (Array.isArray(aiOutput.evidenceIds)) {
      citedEvidenceIds = aiOutput.evidenceIds;
    } else if (Array.isArray(aiOutput.recommendations)) {
      aiOutput.recommendations.forEach(r => {
        if (Array.isArray(r.evidenceIds)) citedEvidenceIds.push(...r.evidenceIds);
      });
    }
  }

  const coverage = calculateEvidenceCoverage({
    citedEvidenceIds,
    availableEvidenceIds
  });

  if (coverage.hasFabricatedIds) {
    violations.push({
      type: 'INVENTED_EVIDENCE_IDS',
      severity: 'critical',
      message: `Output cites fabricated evidence IDs: ${coverage.invalidCited.join(', ')}`
    });
  }

  // 2. Extract and inspect claims
  const claims = extractClaims(aiOutput);
  claims.forEach(claim => {
    const lower = claim.toLowerCase();

    // Check for invented specific measurements when telemetry is absent
    if (lower.includes('soil moisture') && (context.soil?.moisture === undefined && !context.weather?.soilMoisture)) {
      if (/\b\d+(\.\d+)?%\b/.test(claim)) {
        violations.push({
          type: 'INVENTED_MEASUREMENT',
          severity: 'high',
          message: `Invented quantitative soil moisture value when soil moisture sensor/telemetry is unavailable: "${claim}"`
        });
      }
    }

    // Check for satellite disease certainty hallucination (satellite only measures vegetation indices, not pathology)
    if (lower.includes('satellite') && (lower.includes('confirms disease') || lower.includes('confirms fungal infection'))) {
      violations.push({
        type: 'UNSUPPORTED_CAUSAL_CLAIM',
        severity: 'high',
        message: `Satellite remote sensing cannot confirm foliar fungal pathology directly (it only detects canopy vigor/stress): "${claim}"`
      });
    }

    // Check for chemical dosage violation
    if (/\b(\d+(\.\d+)?\s*(ml\/l|gm\/l|kg\/ha|litres?\/acre))\b/i.test(claim)) {
      violations.push({
        type: 'UNSAFE_CHEMICAL_DOSAGE',
        severity: 'critical',
        message: `Prescribed specific chemical concentration/dosage: "${claim}"`
      });
    }
  });

  const isClean = violations.length === 0;

  return {
    isClean,
    violations,
    coverage,
    claimCount: claims.length
  };
}

/**
 * Master AI Quality Gate: Evaluates whether AI output may be released to farmers or agronomists
 * @param {object} params
 * @param {object|string} params.aiOutput
 * @param {object} params.context - Farm context
 * @param {object} [params.schemaValidation] - Output of JSON schema validation
 * @returns {object} Quality Gate Result { status, criticalFailures, warnings, decisionReason }
 */
export function evaluateAIQualityGate({ aiOutput, context = {}, schemaValidation = { isValid: true } }) {
  const criticalFailures = [];
  const warnings = [];

  // 1. Schema Validation
  if (!schemaValidation.isValid) {
    criticalFailures.push(`Schema validation failed: ${(schemaValidation.errors || []).join('; ')}`);
  }

  // 2. Hallucination & Unsupported Claim Analysis
  const hallucinationReport = detectHallucinations({ aiOutput, context });
  hallucinationReport.violations.forEach(v => {
    if (v.severity === 'critical' || v.severity === 'high') {
      criticalFailures.push(v.message);
    } else {
      warnings.push(v.message);
    }
  });

  // 3. Confidence & Context Completeness
  if (typeof aiOutput === 'object' && aiOutput !== null) {
    if (aiOutput.confidence !== undefined && aiOutput.confidence < 0.60 && !aiOutput.isUncertain && aiOutput.diagnosis !== 'uncertain') {
      warnings.push('Low confidence output (<60%) without explicit uncertainty flag');
    }
  }

  let status = QUALITY_GATE_STATUS.PASS;
  if (criticalFailures.length > 0) {
    status = QUALITY_GATE_STATUS.REJECT;
  } else if (warnings.length > 0) {
    status = QUALITY_GATE_STATUS.PASS_WITH_WARNING;
  }

  return {
    status,
    criticalFailures: criticalFailures.length,
    warnings: warnings.length,
    failureDetails: criticalFailures,
    warningDetails: warnings,
    timestamp: new Date().toISOString()
  };
}
