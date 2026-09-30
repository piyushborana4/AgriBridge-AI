# AgriBridge AI — Production Security & Data Governance Charter (Phase 9)

## 1. Secret Management Policy

1. **Zero Client-Side Secrets:** `GEMINI_API_KEY`, provider OAuth secrets, and database credentials are strictly prohibited from client-side JavaScript bundles.
2. **Automated Secret Scanner:** The platform executes automated regular expression scanning (`scanForSecretExposure`) on payloads to prevent accidental credential leakage in API logs or client responses.
3. **No Hardcoded Tokens:** All credentials must be injected via runtime environment variables.

---

## 2. Role-Based Access Control (RBAC) & Ownership

### Supported User Roles:
- `FARMER`: Primary owner of farm assets, journals, crop health records, and consent policies.
- `EXPERT`: Agricultural extension specialists authorized to review low-confidence AI cases, crop doctor submissions, and peer-reviewed knowledge.
- `FIELD_OFFICER`: Regional cooperative / FPO officers supporting farmer onboarding and telemetry synchronization.
- `RESEARCHER`: Academic researchers accessing anonymized, district-coarsened datasets ($k \ge 3$).
- `ADMIN`: System administrators managing platform health and deployment quality gates.
- `SYSTEM`: Automated background schedulers and regression engines.

### Farm Ownership Boundary:
- Every farm mutation enforces `verifyFarmOwnership(user, farm)`. Users cannot view or modify another farmer's private data merely by changing request parameters.

---

## 3. Input Validation & Upload Security

- **Geographic Coordinates:** Strict bounding validation ($\text{lat} \in [-90, 90]$, $\text{lng} \in [-180, 180]$).
- **Soil Chemistry:** Range checks on $\text{pH} \in [0, 14]$, organic matter $\in [0, 100\%]$, non-negative NPK values.
- **Image Uploads:**
  - Maximum file size: `15MB`.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
  - Metadata sanitization to strip private EXIF GPS location tags where requested.
- **XSS Sanitization:** User-submitted journal and feedback notes are stripped of `<script>` tags and HTML entities.

---

## 4. Rate Limiting & AI Cost Controls

- **General API Limiter:** Sliding-window throttle of `200 req/min` per IP / client token.
- **AI Request Throttling:** Strict ceiling on LLM queries to prevent quota exhaustion and runaway costs.
- **Idempotency Protection:** Mutations accept `idempotencyKey` headers to ensure network retries do not create duplicate actions or records.

---

## 5. Security Headers Standard

The backend enforces standard defensive HTTP headers:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```
