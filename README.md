# Evolyn Backend Testing Interface (`evolyn-test-ui`)

A lightweight, dedicated frontend test client built to submit documents (PDF brand guidelines and marketing copy) to the existing **Evolyn Brand Governance Platform** backend and inspect its real responses.

> **Important Design Principle:**
> This application is strictly a **test client / harness**, NOT another testing platform and NOT another brand governance application. All parsing, semantic audits, rule extraction, and conflict detection execute inside the real Evolyn backend.

---

## 1. Features & Architecture

- **PDF Validation & Dropzone:** Accepts genuine PDF documents with client-side MIME/extension verification, configurable maximum file size limit (default 10 MB), preview metadata, and clear remove/replace options.
- **Real-Time Backend Connection Status:** Visual status badge querying the documented `GET /health` endpoint, surfacing connection state (`Connected`, `Disconnected`, `Degraded (DB Offline)`, `Checking`), response latency, uptime, database status, and Gemini model configuration.
- **Verified Evolyn API Workflows:**
  - **Brand Governance Audit:** Ingests document text via `POST /api/submissions` and triggers the synchronous multi-layer audit via `POST /api/submissions/:id/analyze`.
  - **Guideline Rule Extraction & Conflict Detection:** Ingests guideline documents via `POST /api/guidelines`, extracts atomic rules via `POST /api/guidelines/:id/extract-rules`, and runs conflict detection via `POST /api/guidelines/:id/detect-conflicts`.
  - **Direct Multipart Upload Probe:** Sends raw binary file using `multipart/form-data` to test whether binary upload handlers are mounted on the backend.
- **Analysis Results Viewer:** Renders compliance scores, summary counts (passed/failed), verbatim detected issues with source quotes and confidence scores, extracted rules, and conflict pairs. Non-existent modules display *"Not available"* rather than fabricated mock data.
- **Interactive Collapsible Raw JSON Viewer:** Formatted syntax preview with search filter, character count, instant copy-to-clipboard, and JSON file export.
- **Execution History:** Backed by verified `GET /api/submissions` with direct one-click inspection of historical review runs (`GET /api/submissions/:id/review`).

---

## 2. Technology Stack

- **Framework:** React 18 (TypeScript)
- **Tooling:** Vite 6
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v3
- **HTTP Client:** Axios
- **PDF Extraction:** PDF.js (`pdfjs-dist`)
- **Icons:** Lucide React

---

## 3. Getting Started

### Prerequisites

- Node.js `v18+` or `v20+` (tested on Node `v24.18.0`)
- npm or pnpm
- Running Evolyn API backend (default `http://localhost:5001`)

### Installation

```bash
cd evonly-test-ui
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```env
# Evolyn API Base URL (Default port is 5001)
VITE_EVOLYN_API_URL=http://localhost:5001

# Configurable Maximum File Size in Megabytes
VITE_MAX_FILE_SIZE_MB=10

# Multipart Upload Field Name (for probing upload handlers)
VITE_MULTIPART_FIELD_NAME=file
```

You can also dynamically change the backend URL directly from the UI by clicking the gear icon on the backend connection badge.

### Development Server

```bash
npm run dev
```

The application will launch at `http://localhost:5174`.

### Production Build & Typecheck

```bash
# Verify TypeScript strict type-checking
npm run typecheck

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 4. List of Verified Evolyn Endpoints

The following endpoints were verified by direct inspection of the Evolyn codebase (`d:\evolyn\apps\api` and `@evolyn/shared`):

| Endpoint | Method | Status | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | **Verified** | System health, database connection state, uptime, and Gemini AI status. |
| `/api/health` | `GET` | **Verified** | Alias to health check. |
| `/api/submissions` | `POST` | **Verified** | Ingests content submission (accepts JSON `{ title, channel, rawText, submittedBy }`). |
| `/api/submissions/:id/analyze` | `POST` | **Verified** | Synchronous multi-layer semantic audit against rules & facts. |
| `/api/submissions/:id/review` | `GET` | **Verified** | Retrieves submission review run, detected issues, and decision. |
| `/api/submissions` | `GET` | **Verified** | Lists historical submissions with optional status filter. |
| `/api/submissions/:id` | `GET` | **Verified** | Retrieves single submission details. |
| `/api/review-runs/:id/findings` | `GET` | **Verified** | Lists verified findings for a review run. |
| `/api/guidelines` | `POST` | **Verified** | Ingests guideline (accepts JSON `{ title, category, version, rawContent }`). |
| `/api/guidelines` | `GET` | **Verified** | Lists active guidelines. |
| `/api/guidelines/:id` | `GET` | **Verified** | Retrieves guideline details with rules and conflicts. |
| `/api/guidelines/:id/extract-rules` | `POST` | **Verified** | Extracts atomic rules from stored canonical guideline content. |
| `/api/guidelines/:id/detect-conflicts` | `POST` | **Verified** | Runs deterministic conflict detection across guideline rules. |
| `/api/knowledge/facts` | `POST` | **Verified** | Ingests verified facts and citations. |
| `/api/knowledge/facts` | `GET` | **Verified** | Lists approved factual statements. |

---

## 5. List of Unavailable Integration Requirements

Based on code-level inspection of the Evolyn backend repository (`d:\evolyn\apps\api`):

1. **Direct `multipart/form-data` PDF Upload Route:**
   - While documented as an architectural roadmap in `apps/api/src/modules/guidelines/README.md`, no `multer` or multipart parsing middleware is mounted in `apps/api/src/app.ts`. The backend currently only accepts `application/json` with raw textual strings.
   - **How our interface handles this:** The interface includes a client-side text extractor using `pdfjs-dist` to deliver document contents to the verified `POST /api/submissions` and `POST /api/guidelines` endpoints. It also includes a **Multipart Upload Probe** option that sends a genuine `multipart/form-data` payload and reports the exact HTTP status (e.g. 404 Route not found) without simulation.
2. **Asynchronous Job Polling:**
   - Evolyn's review execution (`POST /api/submissions/:id/analyze`) and rule extraction (`POST /api/guidelines/:id/extract-rules`) execute **synchronously** in the current backend. There is no job queue (e.g. BullMQ/Celery) or polling endpoint (`GET /api/jobs/:id`). The frontend awaits the synchronous HTTP response.
3. **Authentication Mechanism:**
   - The current Evolyn API routes have no authentication middleware (JWT, Bearer token, or API key headers) configured on `/api/submissions` or `/api/guidelines`. All endpoints accept open requests.

---

## 6. Verification and Build Test Results

- **TypeScript Compilation:** `npm run typecheck` passed with 0 errors (`strict: true`, `noUnusedLocals: true`).
- **Production Bundle:** `npm run build` generated `dist/` in 4.86s (`index.html`, `index.js`, `index.css`, `pdf.worker.mjs`).
- **Live Health Endpoint Verification:** Verified against live Evolyn API instance running on port 5001:
  ```json
  {
    "status": "ok",
    "service": "evolyn-api",
    "timestamp": "2026-11-06T08:48:04.089Z",
    "uptime": 6,
    "database": "disconnected",
    "gemini": {
      "model": "gemini-2.0-flash",
      "embeddingModel": "text-embedding-004",
      "configured": false
    }
  }
  ```
