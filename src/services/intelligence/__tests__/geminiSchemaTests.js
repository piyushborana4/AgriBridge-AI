/**
 * AGRIBRIDGE AI — Gemini Schema & Post-Validation Test Suite (Phase 4.5)
 *
 * Verifies that all Gemini API schemas are strictly validated and that
 * any ill-formed output, invalid enums, or hallucinated evidence citations
 * are trapped and sanitized before reaching the user.
 */

import assert from 'node:assert';
import { 
  cropDoctorSchema, 
  validateCropDoctorResponse,
  advisorySchema,
  validateAdvisoryResponse,
  farmIntelligenceSchema,
  validateFarmIntelligenceResponse
} from '../../ai/schemas/index.js';

console.log('================================================================');
console.log('  AGRIBRIDGE AI — GEMINI SCHEMA ENFORCEMENT TEST SUITE          ');
console.log('================================================================\n');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(`  ${err.message}`);
  }
}

// -------------------------------------------------------------
// 1. Crop Doctor Schema & Post-Validation Tests
// -------------------------------------------------------------
test('Crop Doctor: Valid response passes validation cleanly', () => {
  const validResponse = {
    crop: 'Onion',
    plant_part: 'leaf',
    diagnosis: 'Purple Blotch (Alternaria porri)',
    diagnosis_category: 'disease',
    confidence: 88,
    severity: 'moderate',
    symptoms: ['Small, water-soaked lesions on leaves', 'Purplish centers on older foliage'],
    possible_causes: ['Foliar wetness > 8 hours', 'Moderate temperature 24-28°C'],
    recommended_actions: ['Apply Mancozeb 75% WP @ 2.5g/L', 'Improve inter-row airflow'],
    prevention: ['Crop rotation with non-allium crops', 'Avoid excess overhead sprinkler irrigation'],
    needs_expert_review: false,
    uncertainty_reason: ''
  };

  const result = validateCropDoctorResponse(validResponse);
  assert.strictEqual(result.isValid, true, 'Valid response must pass');
  assert.strictEqual(result.errors.length, 0);
});

test('Crop Doctor: Missing required fields and invalid enums are caught', () => {
  const invalidResponse = {
    crop: 'Onion',
    // Missing diagnosis
    diagnosis_category: 'alien_infection', // Invalid enum
    confidence: 50,
    severity: 'critical_emergency', // Invalid enum
    symptoms: ['Yellow spots'],
    recommended_actions: [],
    needs_expert_review: false
  };

  const result = validateCropDoctorResponse(invalidResponse);
  assert.strictEqual(result.isValid, false, 'Invalid response must fail');
  assert.ok(result.errors.some(e => e.includes('diagnosis')));
  assert.ok(result.errors.some(e => e.includes('diagnosis_category')));
  assert.ok(result.errors.some(e => e.includes('severity')));
});

// -------------------------------------------------------------
// 2. AI Advisory Schema & Post-Validation Tests
// -------------------------------------------------------------
test('AI Advisory: Valid response passes validation cleanly', () => {
  const validAdvisory = {
    summary: 'Irrigation scheduled for tomorrow morning due to elevated evapotranspiration rate.',
    priority: 'high',
    actions: [
      {
        title: 'Run drip zone A for 45 minutes',
        reason: 'Soil moisture depleted to 22% field capacity',
        urgency: 'today'
      },
      {
        title: 'Scout western border for thrips nymphs',
        reason: 'Temperature spike creates breeding microclimate',
        urgency: 'this_week'
      }
    ],
    risks: ['Water stress within 48h'],
    supporting_factors: ['ET0: 4.8 mm/day', 'NDVI: 0.68'],
    uncertainty: 'Weather forecast uncertainty after 4 days'
  };

  const result = validateAdvisoryResponse(validAdvisory);
  assert.strictEqual(result.isValid, true, 'Valid advisory must pass');
  assert.strictEqual(result.errors.length, 0);
});

test('AI Advisory: Invalid priority and missing action reasons are rejected', () => {
  const invalidAdvisory = {
    summary: 'Weather looks ok',
    priority: 'extreme_danger', // Invalid priority enum
    actions: [
      {
        title: 'Do something',
        // Missing reason
        urgency: 'next_month' // Invalid urgency enum
      }
    ]
  };

  const result = validateAdvisoryResponse(invalidAdvisory);
  assert.strictEqual(result.isValid, false, 'Invalid advisory must fail');
  assert.ok(result.errors.some(e => e.includes('priority')));
  assert.ok(result.errors.some(e => e.includes('Action #1')));
});

// -------------------------------------------------------------
// 3. Farm Intelligence Schema & Hallucinated ID Stripping Tests
// -------------------------------------------------------------
test('Farm Intelligence: Valid intelligence evaluation passes schema validation', () => {
  const validGroundTruthEvidenceIds = [
    'SIG-WX-TEMP-001',
    'SIG-SAT-NDVI-001',
    'SIG-SOIL-MOIST-001',
    'ANOM-HEAT-001'
  ];

  const intelligenceOutput = {
    headline: 'Heat Stress Pre-Emptive Advisory for Onion Vegetative Stage',
    situationSummary: 'Rising maximum temperatures (36°C) coinciding with steady NDVI.',
    agronomicReasoning: 'Vapor Pressure Deficit is elevated, increasing transpiration demand.',
    recommendations: [
      {
        id: 'REC-IRR-01',
        urgency: 'immediate',
        category: 'irrigation',
        title: 'Apply 35mm pulse irrigation before 10:00 AM',
        action: 'Activate micro-sprinklers in block B',
        rationale: 'Mitigate leaf canopy heating and replenish root zone moisture.',
        evidenceIds: ['SIG-WX-TEMP-001', 'SIG-SOIL-MOIST-001'],
        impact: 'Prevents vegetative tip scorching'
      }
    ],
    supporting_evidence_ids: ['SIG-WX-TEMP-001', 'SIG-SAT-NDVI-001'],
    confidenceAssessment: {
      score: 88,
      rating: 'high',
      notes: 'Ground station telemetry and Sentinel-2 overpass synchronized.'
    },
    uncertainty: 'Low'
  };

  const result = validateFarmIntelligenceResponse(intelligenceOutput, validGroundTruthEvidenceIds);
  assert.strictEqual(result.isValid, true, 'Valid intelligence payload must pass');
  assert.strictEqual(result.errors.length, 0);
});

test('Farm Intelligence: Hallucinated evidence IDs are trapped and stripped from recommendations', () => {
  const validGroundTruthEvidenceIds = [
    'SIG-WX-TEMP-001',
    'SIG-SAT-NDVI-001'
  ];

  const payloadWithHallucinatedIds = {
    headline: 'Nitrogen Deficit Suspected',
    situationSummary: 'NDVI drop observed in eastern quadrant.',
    agronomicReasoning: 'Leaf chlorosis pattern corresponds with subsoil moisture.',
    recommendations: [
      {
        id: 'REC-NUT-01',
        urgency: 'this_week',
        category: 'soil_management',
        title: 'Apply Urea top-dressing',
        action: 'Apply 25kg/acre Urea',
        rationale: 'Replenish nitrogen reserves.',
        evidenceIds: [
          'SIG-SAT-NDVI-001',        // Valid
          'SIG-HALLUCINATED-AI-999', // Hallucinated by LLM
          'ANOM-FAKE-007'            // Hallucinated by LLM
        ],
        impact: 'Boost vegetative vigor'
      }
    ],
    confidenceAssessment: {
      score: 75,
      rating: 'moderate'
    }
  };

  const result = validateFarmIntelligenceResponse(payloadWithHallucinatedIds, validGroundTruthEvidenceIds);
  
  // Validation should flag the non-existent evidence IDs
  assert.strictEqual(result.isValid, false, 'Should flag hallucinated evidence IDs');
  assert.ok(result.errors.some(e => e.includes('SIG-HALLUCINATED-AI-999')));
  
  // Sanitized output must only retain genuine evidence IDs
  assert.deepStrictEqual(
    result.sanitized.recommendations[0].evidenceIds, 
    ['SIG-SAT-NDVI-001'],
    'Sanitizer must retain only validated ground truth evidence IDs'
  );
});

// -------------------------------------------------------------
// 4. Schema Contract Definitions Structure Tests
// -------------------------------------------------------------
test('Schema Definitions: JSON Schema specs declare type, properties, and required arrays', () => {
  assert.strictEqual(cropDoctorSchema.type, 'object');
  assert.ok(Array.isArray(cropDoctorSchema.required));
  assert.ok(cropDoctorSchema.properties.crop);

  assert.strictEqual(advisorySchema.type, 'object');
  assert.ok(Array.isArray(advisorySchema.required));
  assert.ok(advisorySchema.properties.summary);

  assert.strictEqual(farmIntelligenceSchema.type, 'object');
  assert.ok(Array.isArray(farmIntelligenceSchema.required));
  assert.ok(farmIntelligenceSchema.properties.recommendations);
});

console.log(`\nGemini Schema Enforcement Tests Passed: ${passCount}/${totalCount}\n`);

if (passCount !== totalCount) {
  process.exit(1);
}
