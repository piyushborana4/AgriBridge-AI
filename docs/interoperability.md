# AgriBridge AI — Interoperability Architecture & BRICS Data Exchange

## 1. Overview & Core Philosophy

AgriBridge AI is built around a multilateral, sovereign agricultural interoperability architecture designed for the BRICS nations (Brazil, Russia, India, China, South Africa).

The system addresses the fundamental challenges of cross-border agricultural collaboration:
- **Zero Data Fabrication**: We strictly report truthful connection states (`CONNECTED`, `CONFIGURED`, `AVAILABLE`, `IMPORTED`, `PROTOTYPE`, `UNAVAILABLE`) rather than simulating fake live infrastructure.
- **Farmer Data Sovereignty**: All telemetry and farm records default to `PRIVATE`. External sharing requires explicit, granular, and revocable consent.
- **Privacy-Preserving Agronomy**: GPS coordinates are coarsened to district grids (~1.1km) and all PII is scrubbed before any telemetry is allowed into multilateral research pools.
- **Rigorous Peer Review**: Knowledge entries from foreign agronomic institutes (e.g., Embrapa, ICAR, CAAS, ARC) require formal peer-review before incorporation into AI decision engines.
- **Transparent AI Model Governance**: Model evaluation metrics specify exact benchmark dataset sizes and verified splits.

---

## 2. Agricultural Data Envelope Standard (`v1.2.0`)

All exchanged payloads conform to the canonical `AgriculturalDataEnvelope<T>` specification:

```typescript
interface AgriculturalDataEnvelope<T> {
  schemaVersion: "1.2.0";
  envelopeId: string;         // UUID v4
  timestamp: string;          // ISO 8601 UTC
  producer: {
    systemId: string;         // e.g. "agribridge-in-node-01"
    countryCode: "IN" | "BR" | "RU" | "CN" | "ZA";
    organization: string;     // e.g. "ICAR / Farmer Cooperative"
  };
  provenance: {
    sourceType: "satellite" | "weather" | "soil" | "agronomic_model" | "farmer_input";
    provider: string;         // e.g. "Copernicus Sentinel-2", "Open-Meteo"
    instrument?: string;      // e.g. "MSI (MultiSpectral Instrument)"
    resolution?: string;      // e.g. "10m", "0.05 deg"
    recordedAt: string;       // ISO 8601 UTC
    freshnessMinutes: number;
    verificationStatus: "verified" | "modeled" | "provisional" | "unverified";
  };
  quality: {
    confidence: number;       // [0.0 - 1.0]
    completeness: number;     // [0.0 - 1.0]
    qcFlags: string[];        // e.g. ["QC_PASSED_QA60_CLEAR"]
  };
  permission: {
    visibility: "private" | "organization" | "research" | "shared_network";
    farmerConsentGranted: boolean;
    anonymized: boolean;
    allowedUses: Array<"advisory" | "research" | "regional_stats" | "benchmark">;
    retentionDays: number;
  };
  payload: T;
}
```

---

## 3. Privacy & Anonymization Engine

When data leaves local storage or organization boundaries, `privacyService.js` enforces:
1. **PII Scrubbing**: Strips `farmerName`, `farmerPhone`, `farmerEmail`, and `parcelName`.
2. **Coordinate Coarsening**:
   - `district_approximate`: Truncates GPS coordinates to 2 decimal places (~1.1 km bounding box) and injects pseudo-random jitter.
   - `regional_centroid`: Replaces GPS coordinates with the centroid of the agro-climatic sub-basin (~11 km).
3. **Consent Verification**: Any payload marked `farmerConsentGranted: false` is blocked with an explicit `CONSENT_VIOLATION` exception.

---

## 4. Peer-Reviewed Knowledge Exchange Pipeline

Agricultural practices and pest advisories follow a formal scientific lifecycle:

```
[DRAFT] ──> [PENDING_REVIEW] ──> [APPROVED] ──> [ACTIVE PIPELINE]
                                  │
                                  ├──> [REJECTED]
                                  └──> [ARCHIVED]
```

- **Safety Invariant**: Unapproved or draft knowledge entries are prohibited from triggering automated alerts in the AI Advisory system.
- **Multi-Source Conflict Detection**: When two national bodies offer divergent recommendations (e.g., nitrogen top-dressing thresholds or fungicide active ingredients), the system generates an explicit conflict dossier rather than silently overriding either source.

---

## 5. Offline-First Synchronization Architecture

- **Local-First Storage**: Farm operations, diagnoses, and logs are immediately committed to local persistent state.
- **Sync Queue**: Outgoing transactions are enqueued in `syncService.js` with exponential backoff and retry counters.
- **Conflict Strategy**: `LAST_WRITE_WINS` with cryptographic checksum verification and audit ledger retention.
