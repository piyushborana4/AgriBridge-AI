# AgriBridge AI — Sovereign Data Governance & Farmer Privacy Charter

## 1. Principles of Sovereign Farmer Data

1. **Farmer Ownership**: All primary agricultural telemetry, crop imagery, and management records remain the sole intellectual property of the farmer.
2. **Default Privacy**: All new farm records are created with `visibility: 'private'`. Zero data is transmitted to external servers or multilateral networks without explicit opt-in.
3. **Revocability**: Consent can be revoked unilaterally at any moment via the Platform Settings interface or API, executing immediate data severance.
4. **Transparent Lineage**: Every data transaction is signed with an immutable audit hash (`auditId`) and logged with timestamp, actor, and reason.

---

## 2. Privacy-Preserving Transformation Specifications

When data visibility is set to `research` or `shared_network`, the platform applies irreversible sanitization:

| Field | Raw Value (Private) | Transformed Value (Research / Shared) |
|---|---|---|
| `farmerName` | "Ramesh Patil" | `[REDACTED]` |
| `farmerPhone` | "+91 98765 43210" | `[REDACTED]` |
| `coordinates.latitude` | `19.876543` | `19.88` (Coarsened ~1.1km grid) |
| `coordinates.longitude` | `75.345678` | `75.35` (Coarsened ~1.1km grid) |
| `parcelName` | "Plot 4 - West Canal" | "Anonymized Parcel A-14" |
| `soilNutrients` | `{"N": 180, "P": 14}` | `{"N": 180, "P": 14}` (Preserved for agronomic science) |

---

## 3. Knowledge Peer-Review & Integrity Standards

- **ICAR / Embrapa / CAAS / ARC Harmonization**: Knowledge submissions must cite primary research papers or certified extension guidelines.
- **Conflict Management**: If localized pest practices conflict across borders (e.g. bio-control vs chemical spray thresholds), both viewpoints are rendered in the Knowledge Hub with an explicit "Divergent National Practice" banner.

---

## 4. Immutable Audit Ledger

All consent changes, revocations, and data exports generate audit records conforming to:

```typescript
interface ConsentAuditLog {
  auditId: string;       // Unique UUID v4
  timestamp: string;     // ISO 8601 UTC
  farmId: string;
  actor: string;         // User or system process
  action: "UPDATE_CONSENT" | "REVOKE_ALL_CONSENT" | "EXPORT_DOSSIER";
  changes: Record<string, any>;
  reason?: string;
}
```
