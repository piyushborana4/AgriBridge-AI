# AgriBridge AI — Production Architecture (Phases 1–9)

## 1. End-to-End System Topology

```text
                                   FARM TELEMETRY & USER INPUT
                                                │
                     ┌──────────────────────────┼──────────────────────────┐
                     ▼                          ▼                          ▼
               OPEN-METEO WMO             COPERNICUS STAC             ISRIC SOILGRIDS
               Agrometeorology            Sentinel-2 MSI              250m Pedology
                     │                          │                          │
                     └──────────────────────────┼──────────────────────────┘
                                                ▼
                                    PROVENANCE & FRESHNESS
                                    (Truth-in-Data Engine)
                                                │
                                                ▼
                                   CENTRAL FARM CONTEXT ENGINE
                                                │
                                                ▼
                                    DETERMINISTIC INTELLIGENCE
                                 • GDD Phenology • Water Balance
                                 • Cross-Signal • Heat/Cold Stress
                                                │
                                                ▼
                                    GOOGLE GEMINI AI SERVICES
                                 • Crop Doctor • Agronomic Advisory
                                                │
                                                ▼
                                    HALLUCINATION & SAFETY GATE
                                                │
                                                ▼
                                    FARMER ACTION CENTER
                                                │
                                                ▼
                                    OUTCOME & EXPERT FEEDBACK
                                                │
                                                ▼
                                    AI EVALUATION & BENCHMARKS
                                                │
                                                ▼
                                    PRODUCTION OPERATIONS & RBAC
```

---

## 2. Architectural Pillars

1. **Deterministic-First Agronomy:** Core physiological computations (GDD, evapotranspiration $\text{ET}_c$, soil depletion, frost risk) are computed deterministically before engaging AI models.
2. **Strict Data Provenance & Anti-Fabrication:** Data points are tagged with verifiable sources (`LIVE`, `FORECAST`, `MODELED`, `USER_PROVIDED`, `UNAVAILABLE`).
3. **Sovereign Farmer Governance:** Farm telemetry defaults to `private`; coarsened sharing ($\sim 1.1\text{km}$) requires explicit, revocable consent.
4. **Empirical AI Evaluation:** Benchmark metrics (Crop Doctor ViT: Macro-F1 `90.3%`, Safe Abstention `92.0%`) are backed by real datasets.
5. **Production Hardening & Resilience:** Circuit breakers, exponential retries, request IDs, rate limiting, and immutable audit logging guarantee operational reliability.
