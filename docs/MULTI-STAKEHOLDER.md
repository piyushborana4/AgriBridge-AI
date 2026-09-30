# AgriBridge AI — Multi-Stakeholder Agricultural Intelligence Architecture (Phase 10)

## Overview

AgriBridge AI is designed as a unified, multi-stakeholder agricultural digital platform. It connects key actors in the agricultural ecosystem through role-tailored workflows, strong data sovereignty boundaries, and collaborative decision support.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGRIBRIDGE AI MULTI-STAKEHOLDER CORE                     │
├─────────────────┬──────────────────┬───────────────────┬────────────────────┤
│     FARMER      │      EXPERT      │   FIELD OFFICER   │     RESEARCHER     │
│  ─────────────  │  ──────────────  │  ───────────────  │  ────────────────  │
│  • My Farms     │  • Review Queue  │  • Priority Queue │  • Research Trials │
│  • Digital Twin │  • Discrepancies │  • Field Visits   │  • Data Export     │
│  • Action Center│  • Ground Truth  │  • Farmer Support │    (JSON/CSV/Geo)  │
│  • Crop Doctor  │  • AI Validation │  • Geo-inspections│  • Provenance      │
└─────────────────┴──────────────────┴───────────────────┴────────────────────┘
                                   ▲
                                   │
              ┌────────────────────┴────────────────────┐
              │   COOPERATIVES & AGRICULTURAL TENANTS   │
              │   ───────────────────────────────────   │
              │   • Multi-Tenancy Isolation             │
              │   • Sovereign Data Policies             │
              │   • Cross-Org Exchange Audit Trail      │
              └─────────────────────────────────────────┘
```

---

## 1. Stakeholder Roles & Access Controls

### 1.1 Farmer (`FARMER`)
- **Focus**: Actionable, distraction-free farm management.
- **Capabilities**: View farm digital twin, monitor satellite NDVI / weather / soil telemetry, manage daily agronomic actions, create journal entries, request extension support.
- **Privacy Standard**: Farm data defaults to `PRIVATE`.

### 1.2 Agricultural Expert / Agronomist (`EXPERT`)
- **Focus**: Clinical diagnostic review and human-in-the-loop oversight.
- **Capabilities**: Review AI diagnostic candidate cases, validate or override AI treatment recommendations, resolve conflicting agronomic guidance, provide authenticated advisory notes.

### 1.3 Field Extension Officer (`FIELD_OFFICER`)
- **Focus**: Ground operational visits and priority farm allocation.
- **Capabilities**:
  - **Deterministic Priority Queue**: Ranks assigned farms based on composite environmental stress (heat index, root-zone moisture deficits, NDVI canopy vigor loss, pending actions).
  - **Field Visit Lifecycle**: `PLANNED` ➔ `STARTED` ➔ `COMPLETED`.
  - **Support Request Escalation**: Resolve farmer-submitted queries directly with verified recommendations.

### 1.4 Academic & Agronomic Researcher (`RESEARCHER`)
- **Focus**: Scientific trial validation and anonymized regional data analysis.
- **Capabilities**:
  - **Research Trials Registry**: Structured tracking of agronomic treatments (e.g., deficit drip + mulch) vs. controls.
  - **Multi-Format Data Export**: Export telemetry in RFC 7946 GeoJSON, standardized CSV, and structured JSON.
  - **Differential Privacy**: Coordinates coarsened to 2 decimal places (~1.1 km precision) and restricted by $k \ge 3$ aggregation thresholds.

---

## 2. Cooperative Multi-Tenancy & Tenant Boundaries

To serve Farmer Producer Organizations (FPOs) and agricultural departments without compromising individual privacy:

- **Tenant Isolation**: Non-admin users can only view farms and records within their assigned organization boundary.
- **Data Sovereignty Policies**:
  - `PRIVATE`: Strictly local to owner.
  - `INSTITUTIONAL`: Accessible only within the member cooperative.
  - `SHARED`: Opt-in aggregated telemetry pool ($k \ge 3$ threshold).
  - `PUBLIC`: Open Digital Public Good knowledge and benchmark data.
- **Cross-Organization Sharing Audit**: All cross-tenant data requests are logged with immutable actor timestamps and verified sovereignty policies.
