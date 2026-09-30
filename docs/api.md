# AgriBridge AI — REST API Reference (Phase 7 Interoperability)

## 1. Base URL & Common Headers

```http
Base URL: http://localhost:5000/api
Content-Type: application/json
```

All responses follow the canonical envelope structure:
```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "Optional status message",
  "timestamp": "2026-09-30T10:00:00.000Z"
}
```

---

## 2. Interoperability & Network Endpoints

### `GET /api/interoperability/status`
Returns the operational health and readiness state of the interoperability network.

**Response**:
```json
{
  "status": "success",
  "data": {
    "networkStatus": "INTEROPERABILITY_READY",
    "supportedCountries": ["IN", "BR", "RU", "CN", "ZA"],
    "connectedNodes": 1,
    "configuredNodes": 4,
    "activeDataEnvelopes": 142,
    "lastSyncTimestamp": "2026-09-30T09:45:00.000Z"
  }
}
```

---

### `GET /api/interoperability/countries`
Lists all member nation profiles, sovereign agronomic institutes, and data exchange readiness.

**Query Parameters**:
- `code` *(optional)*: Filter by ISO-2 country code (`IN`, `BR`, `RU`, `CN`, `ZA`).

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "code": "IN",
      "name": "India",
      "status": "CONNECTED",
      "organization": "ICAR / Digital Agriculture Mission",
      "availableDatasets": ["ICAR-DOGR Onion Baseline", "IMD Agromet"],
      "lastVerified": "2026-09-30"
    },
    {
      "code": "BR",
      "name": "Brazil",
      "status": "CONFIGURED",
      "organization": "Embrapa (Empresa Brasileira de Pesquisa Agropecuária)",
      "availableDatasets": ["Embrapa Cerrado Soil & Pasture Baseline"],
      "lastVerified": "2026-09-28"
    }
  ]
}
```

---

### `GET /api/interoperability/sources`
Lists real agricultural data providers and their operational status.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "open-meteo",
      "name": "Open-Meteo Agrometeorology",
      "category": "weather",
      "status": "CONNECTED",
      "sla": "99.9%"
    },
    {
      "id": "copernicus-sentinel-2",
      "name": "Copernicus Sentinel-2 MSI",
      "category": "satellite",
      "status": "CONNECTED",
      "sla": "99.5%"
    },
    {
      "id": "isric-soilgrids",
      "name": "ISRIC SoilGrids 250m",
      "category": "soil",
      "status": "CONNECTED",
      "sla": "99.8%"
    }
  ]
}
```

---

### `GET /api/interoperability/knowledge`
Returns peer-reviewed agricultural practices and advisories from member nations.

**Query Parameters**:
- `country` *(optional)*: Country code filter.
- `crop` *(optional)*: Crop name filter (e.g., `Cotton`, `Soybean`).
- `status` *(optional)*: `approved` (default), `all`, `pending_review`.

---

### `GET /api/interoperability/models`
Returns the model governance inventory with evaluation benchmarks.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "modelId": "vit-crop-pathology-v2",
      "name": "Crop Doctor Vision Transformer",
      "status": "production",
      "task": "Foliar Disease Classification",
      "benchmarkDataset": "PlantVillage + Field-Verified Multilateral Subset (4,200 samples)",
      "metrics": {
        "macroF1": 0.903,
        "precision": 0.897,
        "recall": 0.912
      },
      "lastAudited": "2026-09-15"
    }
  ]
}
```

---

### `GET /api/interoperability/consent/:farmId` & `POST /api/interoperability/consent/:farmId`
Retrieves or updates the sovereign farmer consent policy.

**Request Body (`POST`)**:
```json
{
  "visibility": "shared_network",
  "allowWeatherSharing": true,
  "allowSoilSharing": true,
  "allowCropSharing": false,
  "allowSatelliteTelemetry": true,
  "actor": "Piyush (Farm Owner)"
}
```
