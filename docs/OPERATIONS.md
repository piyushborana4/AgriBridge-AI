# AgriBridge AI — Production Operations & Runbook (Phase 9)

## 1. Application Startup & Environment Setup

### Prerequisites
- Node.js `v20.0.0` or higher
- npm `v10.0.0` or higher

### Environment Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set configuration parameters:
   - `PORT=3001` (Backend server port)
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=your_actual_key` (Optional: application safely falls back to deterministic prototype mode if absent)
   - `OPEN_METEO_API_URL=https://api.open-meteo.com/v1/forecast`
   - `COPERNICUS_STAC_URL=https://stac.dataspace.copernicus.eu/v1`
   - `SOILGRIDS_API_URL=https://rest.isric.org/soilgrids/v2.0/properties/query`

### Startup Command
```bash
# Start backend API server
npm run server

# In production container:
node server/index.js
```

---

## 2. Health Check & Observability Endpoints

| Endpoint | Type | Purpose | Expected Status Code |
|---|---|---|---|
| `GET /api/health/live` | Liveness | Verifies process is alive | `200 OK` |
| `GET /api/health/ready` | Readiness | Verifies application is ready to accept traffic | `200 OK` |
| `GET /api/health` | Subsystem Health | Detailed status of Weather, Satellite, Soil, Gemini | `200 OK` |
| `GET /api/observability/telemetry` | Metrics | Operational metrics (requests, errors, cache hits) | `200 OK` |
| `GET /api/audit/logs` | Audit | Immutable security and operational audit ledger | `200 OK` |

---

## 3. Incident Response & Provider Failure Runbooks

### Incident A: Gemini AI API Outage or Rate Limit Exceeded
1. **Symptoms:** Crop Doctor or AI Advisory returns prototype response or `AI_UNAVAILABLE`.
2. **System Behavior:** Circuit breaker fast-fails without hanging requests. Deterministic farm intelligence and risk engines continue operating normally.
3. **Action:**
   - Verify Gemini API status.
   - If quota exceeded, verify rate-limiting headers (`X-Request-Id`).
   - Check fallback logs via `GET /api/evaluation/failures`.

### Incident B: Copernicus Sentinel-2 Satellite STAC Degradation
1. **Symptoms:** Satellite overpass returns `UNAVAILABLE`.
2. **System Behavior:** Anti-fabrication engine strictly reports `UNAVAILABLE` or `MODELED` with uncertainty flags; zero fake NDVI values are generated.
3. **Action:**
   - Check `COPERNICUS_STAC_URL` reachability.
   - Farm Context Engine automatically relies on ground-truth farmer journal observations until satellite connectivity is restored.

### Incident C: Open-Meteo Weather API Outage
1. **Symptoms:** Weather returns `MODELED ESTIMATE` fallback baseline.
2. **System Behavior:** Observation cache serves unexpired observations ($<15\text{min}$) with `isCached: true`. Expired observations fall back to historical agro-climatic normals with explicit `isLive: false` badges.

---

## 4. Backup & Disaster Recovery Architecture

### Data Categories & Recovery Objectives
- **Sovereign Farm State & Consents:** `RPO = 1 hour`, `RTO = 15 minutes`.
- **Foliar Images & Crop Doctor Records:** Stored with SHA-256 deduplication and daily snapshot rotation.
- **Audit Ledger:** Append-only ledger replicated across redundant database read-replicas.
- **Restore Command:**
  ```bash
  # Verification of restored database state
  node src/services/intelligence/__tests__/runAllTests.js
  ```
