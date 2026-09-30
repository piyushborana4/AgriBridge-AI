/**
 * AGRIBRIDGE AI — Master Test Suite Runner (Phase 4.5)
 * Runs all deterministic intelligence, data provenance, anti-fabrication,
 * and Gemini schema enforcement test suites in a single unified execution.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testSuites = [
  { name: '1. Phase 4 Deterministic Golden Tests', file: 'goldenTestRunner.js' },
  { name: '2. Phase 4.5 Central Data Provenance & Contracts', file: 'provenanceTests.js' },
  { name: '3. Phase 4.5 Anti-Fabrication & Truth-in-Data', file: 'antiFabricationTests.js' },
  { name: '4. Phase 4.5 Gemini Schema Enforcement & Validation', file: 'geminiSchemaTests.js' },
  { name: '5. Phase 5 Operations, Action Center & Assistant', file: 'phase5OperationsTests.js' },
  { name: '6. Phase 6 Advanced Agronomic & Climate Intelligence', file: 'phase6AgronomyTests.js' },
  { name: '7. Phase 7 Production Interoperability & BRICS Knowledge Exchange', file: 'phase7InteroperabilityTests.js' },
  { name: '8. Phase 8 AI Evaluation, Model Quality & Continuous Improvement', file: 'phase8EvaluationTests.js' },
  { name: '9. Phase 9 Production Hardening, Security & Resilience', file: 'phase9ProductionTests.js' },
  { name: '10. Phase 10 Multi-Stakeholder Intelligence & BRICS Digital Public Good', file: 'phase10StakeholderTests.js' },
  { name: '11. Phase 11 Geospatial Intelligence & Farm Digital Twin 2.0', file: 'phase11GeospatialTests.js' }
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║        AGRIBRIDGE AI — FULL INTELLIGENCE & PROVENANCE TEST RUN       ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

let allPassed = true;

for (const suite of testSuites) {
  const filePath = path.join(__dirname, suite.file);
  console.log(`\n▶ RUNNING: ${suite.name} (${suite.file})`);
  console.log('─'.repeat(70));
  
  try {
    const output = execSync(`node "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(output.trim());
  } catch (err) {
    allPassed = false;
    console.error(`\n❌ FAILED SUITE: ${suite.name}`);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
  }
}

console.log('\n' + '═'.repeat(70));
if (allPassed) {
  console.log('🌟 ALL TEST SUITES PASSED PERFECTLY (100% SUCCESS)');
  console.log('═'.repeat(70) + '\n');
  process.exit(0);
} else {
  console.error('💥 SOME TEST SUITES FAILED');
  console.log('═'.repeat(70) + '\n');
  process.exit(1);
}
