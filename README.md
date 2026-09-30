# AgriBridge AI — Intelligent Agricultural Technology Platform

AgriBridge AI is an AI-powered agricultural monitoring, crop pathology diagnosis, and agronomic advisory platform designed for Indian smallholder and commercial farming estates.

---

## 🏗 Architecture

```
React 19 Frontend (Vite + Tailwind CSS v4)
         ↓ (Clean Service Layer)
AgriBridge AI Service Layer (src/services/ai/)
         ↓ (/api proxy)
Express Backend API Layer (server/index.js)
         ↓ (Official Google Gen AI SDK)
Gemini 2.5 Flash Service (server/geminiService.js)
         ↓
Google Gemini API (Multimodal Vision & Structured Reasoning)
```

### Security Principle
The **Gemini API Key is strictly stored in backend environment variables (`.env`)** and is never exposed to client-side browser code or committed to source control.

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and provide your Google Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
```

### 3. Run in Development Mode
To start both the Backend AI API Server and the Vite Frontend concurrently:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend App:** `http://localhost:5173/`
- **Backend API:** `http://localhost:3001/api/health`

---

## 🤖 AI Modes & Fallback Strategy

### Live AI Mode (Configured)
When a valid `GEMINI_API_KEY` is provided in `.env`:
1. **Crop Doctor:** Uses Gemini Multimodal Vision to inspect uploaded plant foliage images, identifying symptoms, disease category, confidence score, and non-chemical cultural remedies.
2. **AI Agronomic Advisor:** Feeds structured farm context (soil pH, NPK, weather, crop health, organic matter) into Gemini to generate actionable, explainable agronomic guidance.
3. **Conversational Assistant:** Provides natural conversational answers grounded in the currently selected farm.
4. **Regenerative Transition Plan:** Tailors 12-month transition practices to the specific farm soil type and planted crops.

### Prototype Mode (Fallback)
If `GEMINI_API_KEY` is missing or the external API is unreachable:
- The system **never crashes**.
- Returns calibrated agronomic prototype responses with explicit notices: `"Prototype AI mode — connect Gemini API for live analysis."`

---

## 🌿 Agricultural Safety Rules

AgriBridge AI strictly enforces safety guardrails:
1. **No Chemical Dosages:** The AI will never prescribe specific chemical concentrations or application rates (e.g. "Apply 2ml/L of chemical X").
2. **Cultural & Preventive First:** Recommends non-chemical actions (pruning, irrigation timing, aeration, sanitation).
3. **Uncertainty & Low Confidence Handling:** If visual confidence is below 70%, the system flags "Diagnosis Uncertain" and suggests multiple image angles and expert review.
4. **Local Extension Referrals:** Advises consulting Krishi Vigyan Kendra (KVK) or district agricultural officers for verified chemical treatments.

---

## 📊 Current Data Provenance & Limitations

| Module | Data Source / Mode | Status |
| :--- | :--- | :--- |
| **Crop Doctor AI** | Google Gemini Multimodal Vision API | **Live AI** (with Prototype Fallback) |
| **AI Farm Advisory** | Google Gemini Structured Reasoning API | **Live AI** (with Prototype Fallback) |
| **AI Farm Chat** | Google Gemini Context-Grounded Conversational API | **Live AI** (with Prototype Fallback) |
| **Regenerative Plan** | Google Gemini Agro-Ecological Transition Model | **Live AI** (with Prototype Fallback) |
| **Farm Telemetry** | Single Source of Truth (`src/data/mockData.js`) | Prototype Model Data |
| **Weather Forecast** | Micro-climate simulation (`weatherService.js`) | Prototype Meteorological Model |
| **Satellite Indices** | Multispectral canopy modeling (`satelliteService.js`) | Prototype Earth Observation Model |
| **Soil Chemistry** | Soil Health Card lab profile (`soilService.js`) | Prototype Pedological Lab Data |

---

## 🛠 Project Structure
├── server/
│   ├── index.js                     # Express API with Gemini SDK, Interoperability & Evaluation endpoints
│   └── geminiService.js             # Central Google Gen AI SDK integration
├── src/
│   ├── components/                  # Layout, UI primitives, and Source badges
│   ├── context/AppContext.jsx       # Global application & farm state
│   ├── pages/                       # 13 Application views (AIModels, Dashboard, BRICSNetwork, etc.)
│   └── services/
│       ├── ai/                      # Gemini integration & Crop Doctor
│       ├── context/                 # Farm Context Engine (deterministic data unification)
│       ├── intelligence/            # Phase 4–6 Intelligence Engines & Golden Test suites
│       ├── operations/              # Phase 5 Farmer Operations, Activity Logger & Action Center
│       ├── agronomy/                # Phase 6 Advanced Agronomy, Crop Phenology & GDD
│       ├── climate/                 # Phase 6 Climate Resiliency, Risk Matrix & Drought Stress
│       ├── interoperability/        # Phase 7 BRICS Data Exchange, Sovereign Consent & Governance
│       ├── evaluation/              # Phase 8 AI Evaluation, Model Quality & Continuous Improvement
│       ├── config/                  # Phase 9 Centralized Environment Configuration & Feature Flags
│       ├── security/                # Phase 9 RBAC, Ownership, Input Validation & Rate Limiting
│       ├── observability/           # Phase 9 Request Correlation IDs, Structured Logs & Audit Ledger
│       ├── resilience/              # Phase 9 Circuit Breakers, Retries, Provider Health & Idempotency
│       └── cache/                   # Phase 9 Freshness-Aware Observation Cache
├── docs/
│   ├── OPERATIONS.md                # Production Runbook, Incident Response & Recovery
│   ├── SECURITY.md                  # Security Charter, RBAC, Upload Limits & Headers
│   ├── ARCHITECTURE.md              # End-to-End System Topology (Phases 1–9)
│   ├── ai-evaluation.md             # Empirical Ground-Truth Evaluation Methodology
│   ├── model-cards.md               # Standardized AI Model Cards & Inventory
│   ├── ai-safety.md                 # Hallucination Guard & Safety Gate Architecture
│   ├── interoperability.md          # Complete BRICS Interoperability Architecture
│   ├── api.md                       # Full REST API specifications (Phases 1–9)
│   └── data-governance.md           # Sovereign Consent & Privacy Charter
├── Dockerfile                       # Multi-stage production container build
├── docker-compose.yml               # Containerized production runtime
└── vite.config.js                   # Vite frontend configuration

---

## 🧪 Automated Testing Baseline

AgriBridge AI features a comprehensive 9-suite test harness with 100% test pass rate:

```bash
# Run all 9 test suites (73/73 tests)
node src/services/intelligence/__tests__/runAllTests.js
```

### Test Suites:
1. **Deterministic Farm Intelligence** (Phase 4 Golden Tests — 12/12)
2. **Central Data Provenance & Freshness Engine** (Phase 4.5 — 3/3)
3. **Anti-Fabrication & Truth-in-Data Engine** (Phase 4.5 — 6/6)
4. **Gemini Schema Enforcement & Fallback Engine** (Phase 4.5 — 7/7)
5. **Farmer Operations & Action Center** (Phase 5 — 7/7)
6. **Advanced Agronomy & Climate Resilience** (Phase 6 — 8/8)
7. **Production Interoperability & BRICS Knowledge Exchange** (Phase 7 — 10/10)
8. **AI Evaluation, Model Quality & Continuous Improvement** (Phase 8 — 10/10)
9. **Production Hardening, Security & Resilience** (Phase 9 — 10/10)

