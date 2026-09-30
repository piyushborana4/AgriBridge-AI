# AgriBridge AI — Geospatial Intelligence & Farm Digital Twin 2.0 (Phase 11)

## Overview

Phase 11 transforms AgriBridge AI from point-based farm monitoring into a multi-layered, spatially and temporally coherent **Farm Digital Twin 2.0**.

```
                       FARM
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          BOUNDARY              FIELDS
                                  │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
                   CROP         SOIL       IRRIGATION
                     │            │            │
                     └────────────┼────────────┘
                                  ▼
                             OBSERVATIONS
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
            SATELLITE          WEATHER          JOURNAL
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  ▼
                               SIGNALS
                                  │
                                  ▼
                             INTELLIGENCE
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
                 RISK          CHANGES          EVENTS
                  │               │               │
                  └───────────────┼───────────────┘
                                  ▼
                             RECOMMENDATION
                                  │
                                  ▼
                                ACTION
                                  │
                                  ▼
                               OUTCOME
                                  │
                                  ▼
                              TIMELINE
```

---

## 1. Key Spatial Architecture Principles

1. **Anti-Fabrication & Location Quality**:
   - Every parcel is tagged with an explicit `locationQuality` (`EXACT_BOUNDARY`, `APPROXIMATE_BOUNDARY`, `POINT_LOCATION`, `REGION_ONLY`, `UNKNOWN`).
   - If polygon boundary is absent, analysis defaults to `POINT_LOCATION` rather than fabricating artificial parcel borders.
2. **GeoJSON Validation & Standards**:
   - Full compliance with RFC 7946 GeoJSON and WGS84 (`EPSG:4326`).
   - Rigorous polygon topology checking (closed rings, winding order, coordinate bounding boxes).
3. **Field-Level Agronomic Intelligence**:
   - Individual fields maintain independent crop types, planting dates, days after sowing (DAS), and localized risk profiles.
   - Prevents uniform farm-level averaging when internal field conditions diverge.
4. **Temporal Satellite Timeline & Cloud Masking**:
   - Multi-temporal Sentinel-2 / Landsat overpasses with cloud contamination filtering (`cloudCoveragePercent < 50%` for vegetation metrics).
   - Multi-date comparison engine computes $\Delta\text{NDVI}$ and $\Delta\text{NDWI}$ with phenological trajectory classification.
5. **Topography, Drainage & Erosion Risk**:
   - Digital elevation profile integration with slope-driven hydrological stress modeling.
   - Refrains from generating fake elevation maps when DEM is unavailable (`INSUFFICIENT_DATA`).
6. **Spatial Privacy Preservation**:
   - Coarsens coordinates to 2 decimal places (~1.1 km resolution) for public or cross-tenant exports, while preserving high-precision boundaries for authenticated farm owners.
7. **AI Assistant Spatial Tools & Safety Guard**:
   - Deterministic spatial query tools (`getFarmGeometry`, `getFields`, `getFieldIntelligence`, `getFieldRisk`, `getFieldSatelliteTrend`, `getFieldActions`).
   - Spatial Safety Validator prevents AI from asserting definitive disease diagnoses from satellite vegetation decline alone.

---

## 2. API Endpoints

- `GET /api/v1/farms/:farmId/geometry` — Active boundary and location quality.
- `POST /api/v1/farms/:farmId/geometry` — Save or update parcel boundary with version history.
- `GET /api/v1/farms/:farmId/fields` — List managed fields.
- `POST /api/v1/farms/:farmId/fields` — Register new field parcel.
- `POST /api/v1/farms/:farmId/fields/:fieldId/intelligence` — Compute field-level intelligence.
- `GET /api/v1/farms/:farmId/satellite/timeline` — Filtered temporal satellite observations.
- `POST /api/v1/farms/:farmId/satellite/compare` — Compare two overpass dates.
- `GET /api/v1/farms/:farmId/topography` — Terrain elevation and slope profile.
- `POST /api/v1/farms/:farmId/drainage-risk` — Drainage and runoff risk evaluation.
- `POST /api/v1/farms/:farmId/digital-twin/snapshot` — Unified Digital Twin 2.0 Snapshot.
- `POST /api/v1/farms/:farmId/scenario/simulate` — Deterministic What-If scenario (tagged `SIMULATED`).
