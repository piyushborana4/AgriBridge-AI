# AgriBridge AI — Model Cards & AI Inventory Specification (Phase 8)

All production models in the AgriBridge AI registry must maintain a standardized Model Card disclosing operational boundaries, evaluation benchmarks, and known limitations.

---

## 1. Crop Doctor Vision Transformer (`vit-crop-pathology-v2`)

- **Version:** `2.4.1`
- **Architecture:** Vision Transformer (ViT-Base / Patch-16) fine-tuned on sub-tropical foliar pathology
- **Task:** Multiclass foliar disease, pest, and abiotic symptom classification
- **Supported Crops:** Onion (*Allium cepa*), Cotton (*Gossypium hirsutum*), Soybean (*Glycine max*), Tomato (*Solanum lycopersicum*)
- **Supported Regions:** India (Western, Central, Northern Agromet Zones), Brazil (Cerrado)
- **Evaluation Benchmark:** `crop-doctor-benchmark-v1` (4,200 field-verified samples)
- **Macro F1 Score:** `90.3%` (Precision: `89.7%`, Recall: `91.2%`)
- **Operational Limitations:**
  - Requires minimum 720p image resolution and unobstructed daylight leaf illumination.
  - Cannot diagnose subsurface root-knot nematodes or systemic vascular wilts from leaf photos alone.
  - Abstains when leaf symptoms are covered in soil splash or severe chemical residue.

---

## 2. Gemini Multimodal Agronomic Reasoner (`gemini-2.5-flash-advisory`)

- **Version:** `2.5.0`
- **Architecture:** Foundation Large Multimodal Model with Structured JSON Schema Enforcement
- **Task:** Explainable farm context synthesis, cultural advisory, and regenerative transition planning
- **Supported Crops:** Multi-crop agronomy (All registered crops)
- **Supported Regions:** Universal (BRICS-interoperable)
- **Evaluation Dataset:** `agronomic-advisory-expert-v1` (320 expert-reviewed cases)
- **Grounding Score:** `88.5% Fully Grounded`, `100% Safety Compliance`
- **Operational Limitations:**
  - Strictly forbidden from prescribing specific chemical concentrations or dosages.
  - Operates as cultural and preventive decision-support; requires local extension (KVK) referral for chemical pesticide applications.

---

## 3. Deterministic Agro-Climatic Intelligence Engine (`agribridge-deterministic-v1`)

- **Version:** `1.4.0`
- **Architecture:** Rule-based agronomic expert system & FAO-56 Penman-Monteith ET₀ solver
- **Task:** Daily water balance, heat/cold degree days (GDD), soil moisture depletion, and risk indexation
- **Supported Crops:** Onion, Cotton, Wheat, Rice, Soybean, Sugarcane, Maize, Tomato, Mustard, Chickpea
- **Evaluation Dataset:** `deterministic-golden-suite-v1` (53 mathematical invariant fixtures)
- **Pass Rate:** `100% (53 / 53 Invariants Passed)`
- **Operational Limitations:**
  - Relies on Open-Meteo and Sentinel-2 telemetry freshness ($<24\text{h}$ latency required for optimal precision).
