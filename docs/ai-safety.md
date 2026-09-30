# AgriBridge AI — AI Safety & Hallucination Guard Architecture (Phase 8)

## 1. Safety Gate Decision Pipeline

Every AI interaction passes through a multi-tier safety validation gate before presentation to farmers:

```
[AI Output] ──► [Schema Validation] ──► [Claim Extraction] ──► [Evidence Trace Verification] ──► [Safety Gate]
                                                                                                      │
                                              ┌───────────────────────────────────────────────────────┴───────────────┐
                                              ▼                                                                       ▼
                                      [PASS / PASS_WITH_WARNING]                                                   [REJECT]
                                              │                                                                       │
                                      [Deliver to UI]                                                      [Sanitize / Fallback]
```

---

## 2. Hallucination Detection Rules

The `hallucinationGuard` enforces strict rejection on:
1. **Invented Evidence IDs:** Output cites evidence IDs that do not exist in the active Farm Context envelope.
2. **Invented Measurements:** Output manufactures specific numbers (e.g. *"Soil moisture is 31%"*) when sensors or soil models report missing telemetry.
3. **Chemical Dosage Violations:** Output specifies chemical concentrations (e.g. *"Apply 2.5 ml/L of Chemical X"*).
4. **False Causal Claims:** Output claims satellite NDVI proves fungal infection (satellite only detects canopy stress, not micro-pathology).

---

## 3. Human-in-the-Loop Expert Review Queue

Cases with uncertainty, conflicting evidence, or low model confidence are routed to the **Expert Review Queue**:

- **Reviewer Roles:** ICAR plant pathologists, state agricultural extension officers, KVK agronomists.
- **Privacy Standard:** Farmer PII (names, phone numbers, exact GPS coordinates) is stripped prior to entering the review queue.
- **Continuous Improvement:** Expert corrections are recorded as empirical evaluation evidence and fed into future benchmark datasets.

---

## 4. AI Deployment Regression Gate

Production model, prompt, or schema updates cannot be deployed unless all deterministic golden regression invariants pass:

- **Pass Decision:** `QUALITY_GATE_STATUS.PASS`
- **Failure Decision:** `QUALITY_GATE_STATUS.BLOCKED` (Deployment prevented immediately).
