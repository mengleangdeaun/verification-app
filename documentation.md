# documentation.md — Full-Stack Certificate Ledger & Verification System

> **AGENT INSTRUCTION MANDATE:**  
> You are an autonomous Staff Engineer building `verification-app`. Read this specification in full before writing or modifying any files. You must strictly adhere to the file tree, Line-of-Code (LOC) budgets, Zero-JS public rendering constraints, and Ed25519 Web Crypto security protocols defined below. This is a unified full-stack TypeScript application built with **Astro 5 + SolidJS + Neon Serverless Postgres** deployed on **Vercel**. **Never** introduce a separate backend microservice (e.g. Render/Express), and **never** introduce React dependencies into this SolidJS + Astro project.

---

## 1. Product Requirements Document (PRD)

### 1.1 Product Vision & Purpose
The **Certificate Ledger & Verification System** is a high-trust, cryptographically verifiable document issuance, revocation, and verification platform. It enables authorized administrators to issue tamper-proof digital and physical certificates (with embedded Ed25519-signed QR codes) backed by an enterprise-grade **Neon Serverless PostgreSQL** database. Third-party auditors, employers, and the general public can verify document authenticity in **under 100ms** on mobile networks with **0 KB client JavaScript**.

### 1.2 Target Personas
1. **Public Verifier (Auditor / Employer / Recipient):** Scans a physical QR code on a printed certificate or opens a verification link on a mobile device. Expects instant visual confirmation of authenticity—complete with static vector signatures and official seals—without app downloads, login walls, or client-side JavaScript.
2. **Issuing Administrator (Registrar / Operations Staff):** Authenticates into the `/admin` workspace on a desktop browser to issue new certificates, search historical records, revoke compromised documents directly from the data table, and trigger physical print runs (or PDF saves) across **A4** or **US Letter** paper in **Landscape** or **Portrait** orientation, with an instant toggle to include or hide digital SVG signatures (allowing for physical wet-ink signing after printing).

### 1.3 Success Metrics (KPIs)
| Metric | Target | Enforcement Mechanism |
|---|---|---|
| **Public Verification TTI** | `< 100ms` on 4G mobile | 0 KB client-side JS on `/check`; Vercel Edge SSR + Neon indexed query (`< 15ms`) |
| **Cryptographic Forgery Rate** | `0%` | Asymmetric Ed25519 signature verification prior to/alongside ledger lookup |
| **Ledger Tamper Detection** | `100%` | Canonical payload re-computation & signature verification on every read |
| **Database Query Latency** | `< 20ms` | B-Tree index on `certificates(id)` via `@neondatabase/serverless` connection pool |
| **Print Fidelity** | `100%` vector accuracy | Dynamic `@page` size/orientation CSS injection + inline SVG QR generation |
| **Code Modularity** | Strict LOC ceilings | Routing pages `< 50 LOC`, Layout `< 30 LOC`, Form/Store `< 150 LOC` |

### 1.4 Scope Boundaries
* **In-Scope:**
  * Certificate issuance, live search matrix, and one-click revocation/restoration in `/admin`.
  * Asymmetric Ed25519 signing (`POST /api/create`), revocation (`PATCH /api/create`), and verification (`GET /api/verify`).
  * Public QR verification page (`check.astro`) with static SVG signatures (`public/assets/sig-1.svg`, `sig-2.svg`) and manual ID lookup (`index.astro`).
  * Native browser print pipeline (`certificate-printer`) supporting **A4** & **US Letter**, **Landscape** & **Portrait**, and an **Include/Exclude Digital Signatures** toggle for wet-ink signing vs. digital PDF saving.
  * Serverless **Neon PostgreSQL** persistence layer (`@neondatabase/serverless`) with ACID transactions, indexing, and automatic local JSON mock fallback for offline development.
  * Optional export to CSV/Excel for non-technical administrators.
* **Out-of-Scope:**
  * External backend server (Render, Express, Fastify, Django, etc.) — Astro 5 provides a unified, built-in TypeScript API backend.
  * Server-side headless Chromium PDF generation (Puppeteer/Playwright are strictly banned).
  * Direct Google Sheets persistence as the primary database (legacy Apps Script proxy is replaced by Neon Postgres).

---

## 2. User Flows

### 2.1 Flow A: Public QR Scan & Verification (`0 KB Client JS`)
```text
[Physical/PDF Certificate QR Code]
       │ (Scans URL: /check?id=CERT-2026-X9A1&sig=86_CHAR_ED25519_SIG)
       ▼
[Astro Edge Route: src/pages/check.astro (Vercel Serverless)]
       │
       ├─► 1. Extract `id` and `sig` from URL SearchParams on Server
       ├─► 2. Execute verification pipeline:
       │      ├── Gate 1: Validate parameter presence & `sig` byte length (64 bytes / 86 chars)
       │      ├── Gate 2: Fetch record from Neon Postgres (`SELECT * FROM certificates WHERE id = $1`)
       │      └── Gate 3: Recompute canonical payload & run `crypto.subtle.verify('Ed25519', ...)`
       │
       ├─► [Outcome 1: VERIFIED]
       │      └── Render Emerald Green `StatusBanner` + `RecordDetails` (with static SVG signatures)
       ├─► [Outcome 2: REVOKED / EXPIRED]
       │      └── Render Amber/Crimson `StatusBanner` + lifecycle invalidation notice
       └─► [Outcome 3: TAMPERED / INVALID SIG / 404]
              └── Render High-Contrast Red Counterfeit Alert
```

### 2.2 Flow B: Certificate Issuance, Printing & Revocation (`Admin Island`)
```text
[Admin User opens /admin]
       │
       ▼
[Hydrated SolidJS Island: AdminDashboardShell.tsx]
       │
       ├─► 1. Auth Gate: Prompt for `ADMIN_API_SECRET` if absent in `sessionStorage`
       ├─► 2. Print & Layout Configuration (`TemplatePicker.tsx`):
       │      ├── Select Theme (`classic-diploma` | `modern-tech` | `iso-compliance`)
       │      ├── Select Paper Size (`A4` | `LETTER`) & Orientation (`landscape` | `portrait`)
       │      └── Toggle "Include Digital Signatures" (`true` for PDF/Auto-sign, `false` for physical wet-sign)
       ├─► 3. Issuance (`CreateCertForm.tsx`):
       │      ├── Admin inputs Recipient Name, Program Title, Description, Level, Dates, Signatories
       │      └── `useCreateCert.ts` sends `POST /api/create` -> Signs with Ed25519 -> Inserts into Neon Postgres
       ├─► 4. Print / Save PDF:
       │      └── Admin clicks "Print / Save PDF" -> `printTrigger.ts` injects `@page` rule & calls `window.print()`
       └─► 5. Revocation (`DataGridTable.tsx`):
              └── Admin clicks "Revoke" on any row -> Sends `PATCH /api/create` -> Updates Neon status to `REVOKED`
```

---

## 3. Design Principles

### 3.1 Engineering Principles
1. **Unified Full-Stack Architecture (Zero Separate Backend):** Astro 5 operates in `output: 'server'` mode. All backend business logic, cryptographic signing, API endpoints (`src/pages/api/`), and server-rendered pages execute in a single unified TypeScript environment on Vercel.
2. **Zero-JS by Default, Islands by Exception:** Public pages (`index.astro`, `check.astro`) must emit **0 bytes** of client-side hydration JavaScript. Interactive client code is strictly quarantined inside `src/pages/admin.astro` via SolidJS (`client:only="solid-js"`).
3. **Fine-Grained Reactivity (No Virtual DOM):** All interactive administrative UI must use **SolidJS**. Never import React hooks, React DOM, or VDOM-bound libraries.
4. **Strict LOC Budgets:** Every file has a hard complexity ceiling:
   * `Layout.astro`: `< 30 LOC`
   * `src/pages/**/*.astro`: `< 50 LOC`
   * `src/types/*.ts`: `< 40 LOC` per interface group
   * `dashboardStore.ts`: `< 100 LOC`
   * `StatusBanner.tsx`: `< 100 LOC`
   * `CreateCertForm.tsx`: `< 150 LOC`
   * `PrintablePaper.tsx`: `< 200 LOC`
5. **Zero-Trust Edge Security:** Secret keys (`ED25519_PRIVATE_KEY_B64`, `DATABASE_URL`, `ADMIN_API_SECRET`) must only be referenced inside server-side API routes and server utilities (`src/pages/api/*.ts`, `src/utils/*.ts`).

### 3.2 UI/UX & Signature Display Principles
1. **Dual-Mode Signature Rendering:**
   * **On Public Verification (`RecordDetails.tsx`):** Always display the static SVG signatures (`/assets/sig-1.svg` and `/assets/sig-2.svg`) above Signatory 1 and Signatory 2 so public verifiers see a complete, authoritative record.
   * **On Admin Print Canvas (`PrintablePaper.tsx`):** Controlled by `dashboardStore.includeSignaturesOnPrint`. When `false` (default for physical printing), the space above the signatory line remains blank so executives can physically sign the paper with a pen after printing. When `true` (for digital PDF saving or pre-signed batch printing), `/assets/sig-1.svg` and `/assets/sig-2.svg` are rendered above the signatory lines.
2. **Forensic Clarity on Verification Views:**
   * **Verified (`VERIFIED`):** Emerald Green (`#059669`), cryptographic hash badge, static SVG signatures, and official vector seal.
   * **Revoked / Expired (`CERTIFICATE_REVOKED` / `CERTIFICATE_EXPIRED`):** Amber/Orange warning banner clearly stating the certificate was genuinely issued in the past but is no longer valid.
   * **Counterfeit / Tampered (`INVALID_SIGNATURE` / `DATA_TAMPERED`):** High-contrast Red (`#DC2626`) alert banner warning the auditor of forgery or unauthorized database modification.

---

## 4. Information Architecture

### 4.1 Canonical File Tree & Static Assets
```text
verification-app/
├── .env.development                   # Local development secrets & dev keypair
├── .env.production                    # Production environment routes (Vercel)
├── astro.config.mjs                   # Hybrid output & SolidJS integration config
├── package.json
├── tailwind.config.cjs                # Print-media responsive configuration
├── tsconfig.json                      # `"jsx": "preserve"`, `"jsxImportSource": "solid-js"`
├── public/
│   ├── favicon.svg
│   └── assets/                        # Static logos, legal vector stamps, & SVG signatures
│       ├── logo.svg                   # Organization primary emblem
│       ├── seal.svg                   # Official vector verification stamp
│       ├── sig-1.svg                  # Static vector signature for Signatory 1
│       └── sig-2.svg                  # Static vector signature for Signatory 2
└── src/
    ├── layouts/
    │   └── Layout.astro               # Base HTML boilerplate container (<30 LOC)
    ├── env.d.ts                       # Strictly typed environment variables
    │
    ├── pages/                         # ROUTING & API LAYER (All files <50 LOC)
    │   ├── index.astro                # Landing page with manual lookup form
    │   ├── check.astro                # Public QR lookup view (0kb Hydration JS)
    │   ├── admin.astro                # Dashboard parent mounting the Admin island
    │   └── api/
    │       ├── verify.ts              # GET: Edge worker resolving single or batch cert lookups
    │       └── create.ts              # POST (Issue) & PATCH (Revoke): Edge worker mutations
    │
    ├── types/                         # ENTERPRISE DOMAIN INTERFACES
    │   ├── certificates.ts            # Core Certificate data payloads (<40 LOC)
    │   └── templates.ts               # Theme, PaperSize, and Orientation schema definitions
    │
    ├── utils/                         # CORE BACKEND UTILITIES (Server-Only)
    │   ├── crypto.ts                  # Ed25519 Web Crypto sign & verify
    │   ├── verifier.ts                # Shared certificate verification pipeline
    │   └── ledger.ts                  # Neon Postgres client & local mock JSON fallback
    │
    └── modules/                       # ENCAPSULATED CORE WORKSPACES
        │
        ├── admin-dashboard/           # FEATURE MODULE: ADMINISTRATIVE PANELS
        │   ├── stores/
        │   │   └── dashboardStore.ts  # Reactive global workspace controller (<100 LOC)
        │   ├── queries/
        │   │   ├── useCreateCert.ts   # TanStack Solid mutations (Issue POST & Revoke PATCH)
        │   │   └── useFetchCerts.ts   # TanStack Solid retrieval query with auto-refresh
        │   ├── components/
        │   │   ├── CreateCertForm.tsx # Isolated data input controller form (<150 LOC)
        │   │   ├── DataGridTable.tsx  # TanStack Solid Table with Search, Preview, & Revoke button
        │   │   └── TemplatePicker.tsx # Theme, PaperSize, Orientation, & Signature Print Toggle
        │   └── AdminDashboardShell.tsx# Aggregator component + Admin Key Auth Gate
        │
        ├── verification-scanner/      # FEATURE MODULE: LIGHTWEIGHT PUBLIC LOOKUP
        │   ├── hooks/
        │   │   └── useQueryParam.ts   # Pure helper extracting '?id=' & '?sig=' from URL
        │   └── components/
        │       ├── StatusBanner.tsx   # Verified vs Revoked vs Counterfeit states (<100 LOC)
        │       └── RecordDetails.tsx  # Displays verified fields + static SVG signatures
        │
        └── certificate-printer/       # FEATURE MODULE: NATIVE CANVAS & MEDIA PRINTER
            ├── utils/
            │   └── printTrigger.ts    # Injects dynamic @page CSS & triggers window.print()
            ├── constants/
            │   └── themes.ts          # Stylesheet dictionary & paper dimension presets
            └── components/
                ├── PrintablePaper.tsx # Dedicated print CSS breakout overlay (<200 LOC)
                └── VectorQrCode.tsx   # Inline SVG dynamic QR matrix renderer
```

---

### 4.2 Neon PostgreSQL Database Schema & Indexing

The ledger schema maps 1-to-1 with the 17 canonical certificate fields, enforced with strict relational constraints and B-Tree indexes:

```sql
-- 1. Create Enumerated Types
CREATE TYPE cert_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE paper_size AS ENUM ('A4', 'LETTER');
CREATE TYPE paper_orientation AS ENUM ('landscape', 'portrait');

-- 2. Create Certificates Ledger Table
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'CERT-2026-8F92A1'
    recipient_name VARCHAR(255) NOT NULL,
    program_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    level VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    signatory1_name VARCHAR(255) NOT NULL,
    signatory1_title VARCHAR(255) NOT NULL,
    signatory2_name VARCHAR(255),
    signatory2_title VARCHAR(255),
    template_id VARCHAR(50) NOT NULL DEFAULT 'classic-diploma',
    paper_size paper_size NOT NULL DEFAULT 'A4',
    orientation paper_orientation NOT NULL DEFAULT 'landscape',
    status cert_status NOT NULL DEFAULT 'ACTIVE',
    payload_hash VARCHAR(64) NOT NULL,           -- SHA-256 canonical hash
    signature TEXT NOT NULL,                     -- Ed25519 Base64URL signature (86 chars)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High-Performance Indexing Strategy
CREATE INDEX IF NOT EXISTS idx_certs_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certs_recipient ON certificates(recipient_name);
CREATE INDEX IF NOT EXISTS idx_certs_created_at ON certificates(created_at DESC);
```

#### Field to Column Mapping

| Column | Type | Nullable | In Canonical Signature? | Description |
|---|---|---|---|---|
| `id` | `VARCHAR(64)` | No (PK) | **Yes** | Unique Certificate ID (`CERT-YYYY-HEX`) |
| `recipient_name` | `VARCHAR(255)` | No | **Yes** | Full Name of recipient |
| `program_title` | `VARCHAR(255)` | No | **Yes** | Program or Degree title |
| `description` | `TEXT` | No | **Yes** | Citation / award achievement text |
| `level` | `VARCHAR(100)` | No | **Yes** | Free-text level (`Advanced`, `Distinction`) |
| `issue_date` | `DATE` | No | **Yes** | Date issued (`YYYY-MM-DD`) |
| `expiry_date` | `DATE` | Yes | **Yes** | Expiration date (`YYYY-MM-DD` or NULL) |
| `signatory1_name` | `VARCHAR(255)` | No | **Yes** | Full name of 1st Signatory |
| `signatory1_title` | `VARCHAR(255)` | No | **Yes** | Title of 1st Signatory |
| `signatory2_name` | `VARCHAR(255)` | Yes | **Yes** | Full name of 2nd Signatory |
| `signatory2_title` | `VARCHAR(255)` | Yes | **Yes** | Title of 2nd Signatory |
| `template_id` | `VARCHAR(50)` | No | No | Visual layout template |
| `paper_size` | `paper_size` | No | No | `'A4'` or `'LETTER'` |
| `orientation` | `paper_orientation` | No | No | `'landscape'` or `'portrait'` |
| `status` | `cert_status` | No | No | `'ACTIVE'`, `'REVOKED'`, or `'EXPIRED'` |
| `payload_hash` | `VARCHAR(64)` | No | No | SHA-256 hex digest of canonical string |
| `signature` | `TEXT` | No | — | Ed25519 Base64URL signature (86 chars) |
| `created_at` | `TIMESTAMPTZ` | No | No | Audit timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | No | Status update timestamp |

---

## 5. Technical Architecture

### 5.1 Environment Schema (`src/env.d.ts`)
```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ED25519_PRIVATE_KEY_B64: string; // PKCS#8 Base64URL (Used ONLY in POST /api/create)
  readonly ED25519_PUBLIC_KEY_B64: string;  // SPKI Base64URL (Used in /api/verify & check.astro)
  readonly DATABASE_URL: string;            // Neon Postgres Serverless Connection URI
  readonly ADMIN_API_SECRET: string;        // Master access key authenticating Admin UI -> Astro API
  readonly PUBLIC_APP_URL: string;          // e.g. "https://verify.yourdomain.com"
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 5.2 TypeScript Domain Schemas

#### `src/types/certificates.ts` (< 40 LOC)
```typescript
import type { PaperOrientation, PaperSize, TemplateId } from './templates';

export type CertificateStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface CreateCertificateInput {
  recipientName: string;
  programTitle: string;
  description: string;
  level: string; // Free-text input
  issueDate: string; // YYYY-MM-DD
  expiryDate?: string | null; // YYYY-MM-DD or null
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name?: string | null;
  signatory2Title?: string | null;
  templateId: TemplateId;
  paperSize: PaperSize;
  orientation: PaperOrientation;
}

export interface CertificateRecord extends CreateCertificateInput {
  id: string;
  status: CertificateStatus;
  payloadHash: string;
  signature: string;
  verificationUrl: string;
}

export type VerificationCode =
  | 'VERIFIED'
  | 'MISSING_PARAMS'
  | 'INVALID_SIGNATURE'
  | 'RECORD_NOT_FOUND'
  | 'DATA_TAMPERED'
  | 'CERTIFICATE_REVOKED'
  | 'CERTIFICATE_EXPIRED';

export interface VerificationResult {
  valid: boolean;
  code: VerificationCode;
  timestamp: string;
  record?: CertificateRecord;
}

export const buildCanonicalPayload = (d: {
  id: string;
  recipientName: string;
  programTitle: string;
  description: string;
  level: string;
  issueDate: string;
  expiryDate?: string | null;
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name?: string | null;
  signatory2Title?: string | null;
}): string =>
  [
    'v1',
    d.id.trim(),
    d.recipientName.trim(),
    d.programTitle.trim(),
    d.description.trim(),
    d.level.trim(),
    d.issueDate.trim(),
    d.expiryDate?.trim() || 'NEVER',
    d.signatory1Name.trim(),
    d.signatory1Title.trim(),
    d.signatory2Name?.trim() || 'NONE',
    d.signatory2Title?.trim() || 'NONE',
  ].join('|');
```

#### `src/types/templates.ts` (< 40 LOC)
```typescript
export type TemplateId = 'classic-diploma' | 'modern-tech' | 'iso-compliance';
export type PaperSize = 'A4' | 'LETTER';
export type PaperOrientation = 'landscape' | 'portrait';

export interface PrintGeometry {
  size: PaperSize;
  orientation: PaperOrientation;
  widthMm: number;
  heightMm: number;
  cssPageRule: string;
}

export interface TemplateThemeConfig {
  id: TemplateId;
  label: string;
  defaultOrientation: PaperOrientation;
  borderClass: string;
  bgClass: string;
  accentColorHex: string;
  fontFamilyHeading: string;
  sealAssetPath: string;
}
```

### 5.3 Dynamic Print Geometry & Signature Toggle (`PrintablePaper.tsx` & `printTrigger.ts`)
1. **Paper Dimension Matrix (`src/modules/certificate-printer/constants/themes.ts`):**
   * `A4`: `210mm × 297mm` (`landscape`: `297mm × 210mm`, `portrait`: `210mm × 297mm`)
   * `LETTER`: `215.9mm × 279.4mm` (`landscape`: `279.4mm × 215.9mm`, `portrait`: `215.9mm × 279.4mm`)
2. **Signature Visibility Toggle (`includeSignaturesOnPrint`):**
   * Inside `PrintablePaper.tsx`, each signatory block renders:
     * The SVG image (`/assets/sig-1.svg` or `/assets/sig-2.svg`) inside a fixed-height container (`h-14`).
     * When `dashboardStore.includeSignaturesOnPrint` is `true`, the SVG is visible (`opacity-100`).
     * When `dashboardStore.includeSignaturesOnPrint` is `false`, the SVG is hidden (`opacity-0 pointer-events-none`), preserving the exact vertical spacing (`h-14`) above the horizontal signature line so the physical paper has room for wet-ink signing.
3. **Dynamic `@page` Injection (`src/modules/certificate-printer/utils/printTrigger.ts`):**
   Injects `@page { size: ${size} ${orientation}; margin: 0mm !important; }` into `<head>` immediately prior to calling `window.print()`.

---

## 6. Functional Requirements Specification (FRS)

### 6.1 Routing & Page Layer (`src/pages/`)
* **FRS-PAGE-01 (`Layout.astro`):** `< 30 LOC`. Renders HTML5 boilerplate, global Tailwind styles, and `<slot />`.
* **FRS-PAGE-02 (`index.astro`):** `< 50 LOC`. Renders public verification landing page with a pure HTML `<form action="/check" method="GET">` for manual Certificate `id` and `sig` lookup.
* **FRS-PAGE-03 (`check.astro`):** `< 50 LOC`. Sets `export const prerender = false;`. Extracts `?id=` and `?sig=` on the server, executes verification pipeline via Neon Postgres, and renders `<StatusBanner />` and `<RecordDetails />` with **0 KB** of client JS.
* **FRS-PAGE-04 (`admin.astro`):** `< 50 LOC`. Mounts `<AdminDashboardShell client:only="solid-js" />`.

### 6.2 Edge API Workers (`src/pages/api/`)
* **FRS-API-01 (`POST /api/create` — Issue Certificate):**
  1. Verify `Authorization: Bearer <ADMIN_API_SECRET>`. Return `401` if invalid.
  2. Validate required fields: `recipientName`, `programTitle`, `description`, `level`, `issueDate`, `signatory1Name`, `signatory1Title`, `templateId`, `paperSize`, `orientation`.
  3. Generate `id` (`CERT-${YYYY}-${8_HEX_CHARS}`).
  4. Build canonical string via `buildCanonicalPayload()`, compute SHA-256 `payloadHash`, and sign canonical string with `ED25519_PRIVATE_KEY_B64`.
  5. Construct `verificationUrl` (`${PUBLIC_APP_URL}/check?id=${id}&sig=${signature}`).
  6. Execute parameterized SQL `INSERT INTO certificates (...) VALUES (...)` in Neon Postgres (or append to mock ledger if `DATABASE_URL` is unconfigured).
  7. Return `201 Created` with the signed `CertificateRecord`.
* **FRS-API-02 (`PATCH /api/create` — Revoke / Restore Certificate):**
  1. Verify `Authorization: Bearer <ADMIN_API_SECRET>`. Return `401` if invalid.
  2. Parse JSON body `{ id: string, status: 'REVOKED' | 'ACTIVE' }`.
  3. Execute SQL `UPDATE certificates SET status = $1, updated_at = NOW() WHERE id = $2` in Neon Postgres.
  4. Return `200 OK` with `{ id, status }`.
* **FRS-API-03 (`GET /api/verify` — Public Lookup & Admin Paginated List):**
  1. **Batch Mode (`?list=true`):** Verify `Authorization: Bearer <ADMIN_API_SECRET>`. Accepts `page`, `pageSize` (default 10), `search`, and `status`. Executes parameterized SQL with `LIMIT` & `OFFSET` and computes total metrics in Neon Postgres, returning `PaginatedCertificatesResult`.
  2. **Single Lookup Mode (`?id=...&sig=...`):**
     * Reject missing params or `sig` length !== 64 decoded bytes (`400 Bad Request`).
     * Execute `SELECT * FROM certificates WHERE id = $1` in Neon Postgres (`404` if not found).
     * Recompute canonical string from all 11 signed fields and run `crypto.subtle.verify('Ed25519', ...)`. Return `403` (`DATA_TAMPERED`) if verification fails.
     * Check `record.status === 'REVOKED'` (`CERTIFICATE_REVOKED`) and `record.expiryDate && new Date(record.expiryDate) < new Date()` (`CERTIFICATE_EXPIRED`).
     * Return `200 OK` (`VERIFIED`) with `record`.

### 6.3 Admin Dashboard Module (`src/modules/admin-dashboard/`)
* **FRS-ADM-01 (`dashboardStore.ts`):** `< 100 LOC`. Uses SolidJS signals/store to manage:
  * `adminToken: string` (synced with `sessionStorage`)
  * `selectedCert: CertificateRecord | null`
  * `activeTemplateId: TemplateId` (default: `'classic-diploma'`)
  * `paperSize: PaperSize` (default: `'A4'`)
  * `orientation: PaperOrientation` (default: `'landscape'`)
  * `includeSignaturesOnPrint: boolean` (default: `false` for physical wet-signing; `true` renders static SVGs on print/PDF)
  * `searchFilter: string`
* **FRS-ADM-02 (`CreateCertForm.tsx`):** `< 150 LOC`. Resilient state machine with double-submit prevention:
  * Features `isSubmitting` idempotency guard that freezes `<fieldset disabled>` and shows an animated loading spinner.
  * Transitions cleanly into `<IssuanceSuccessCard />` upon creation with 1-click ID copy, direct Print, Public Verifier link, and "Issue Another" button.
  * Uses `<SignatoryFields />` subcomponent to maintain strict LOC budget.
* **FRS-ADM-03 (`DataGridTable.tsx`):** Features server-side pagination and 300ms debounced search:
  * Integrates `<TablePaginationBar />` supporting 10, 25, 50 rows per page with page jump buttons.
  * Leverages TanStack Query `placeholderData: keepPreviousData` for flicker-free transitions.
  * **"Preview / Print"** button: Loads row into `selectedCert` and updates layout properties.
  * **"Revoke" / "Restore"** button: Toggles status between `REVOKED` and `ACTIVE`.
* **FRS-ADM-04 (`TemplatePicker.tsx`):** Provides controls for:
  1. Theme (`classic-diploma`, `modern-tech`, `iso-compliance`)
  2. Paper Size (`A4`, `LETTER`)
  3. Orientation (`landscape`, `portrait`)
  4. Toggle: **"Include SVG Signatures on Print/PDF"** (`includeSignaturesOnPrint`)

### 6.4 Verification Scanner Module (`src/modules/verification-scanner/`)
* **FRS-SCN-01 (`StatusBanner.tsx`):** `< 100 LOC`. Renders distinct semantic status banner for all verification codes (`VERIFIED`, `CERTIFICATE_REVOKED`, `CERTIFICATE_EXPIRED`, `DATA_TAMPERED`, `INVALID_SIGNATURE`, `RECORD_NOT_FOUND`, `MISSING_PARAMS`).
* **FRS-SCN-02 (`RecordDetails.tsx`):** Renders verified certificate fields. **Always** renders static `/assets/sig-1.svg` above Signatory 1 (and `/assets/sig-2.svg` above Signatory 2 if `signatory2Name` is present), alongside `/assets/seal.svg`.

---

## 7. Implementation Sequence for AI Coding Agent

1. **Step 1 (Config, Assets & Types):** Create `package.json`, `astro.config.mjs`, `tailwind.config.cjs`, `tsconfig.json`, placeholder SVGs in `public/assets/`, `src/env.d.ts`, `src/types/templates.ts`, and `src/types/certificates.ts`.
2. **Step 2 (Database & Edge Cryptography):** Configure Neon Postgres connection client in `src/utils/ledger.ts`, run database migrations, and implement `src/pages/api/create.ts` (`POST` & `PATCH`) and `src/pages/api/verify.ts` (`GET`).
3. **Step 3 (Zero-JS Public Scanner):** Implement `useQueryParam.ts`, `StatusBanner.tsx`, `RecordDetails.tsx`, `Layout.astro`, `index.astro`, and `check.astro`.
4. **Step 4 (Multi-Format Printer Module):** Implement `themes.ts`, `printTrigger.ts`, `VectorQrCode.tsx`, and `PrintablePaper.tsx`.
5. **Step 5 (SolidJS Admin Island):** Implement `dashboardStore.ts`, `useFetchCerts.ts`, `useCreateCert.ts`, `TemplatePicker.tsx`, `CreateCertForm.tsx`, `DataGridTable.tsx`, `AdminDashboardShell.tsx`, and `src/pages/admin.astro`.

---

## 8. Neon PostgreSQL Setup & Vercel Deployment Guide

### 8.1 Setup Neon Database
1. Go to [Neon Console](https://console.neon.tech) and create a project (e.g. `certificate-ledger`).
2. In the **SQL Editor**, execute the migration script from [Section 4.2](#42-neon-postgresql-database-schema--indexing).
3. Copy the pooled connection string:
   ```text
   postgres://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```
4. Set `DATABASE_URL` in your `.env` and Vercel Project Environment Variables.

### 8.2 Local Development with Mock Ledger Fallback
When developing offline or without an active internet connection:
* If `DATABASE_URL` is omitted, `src/utils/ledger.ts` automatically falls back to `data/mock-ledger.json`.
* All operations (Issue, Revoke, Verify) work out of the box locally without external dependencies.

### 8.3 Non-Technical Staff Spreadsheet Access
For administrative teams that need spreadsheet view access:
1. **Admin CSV Export:** The Admin Dashboard includes a 1-click "Export Ledger to CSV" feature to view in Excel or Google Sheets.
2. **Optional Async Mirror:** A background webhook in `src/pages/api/create.ts` can asynchronously broadcast newly inserted certificates to Google Sheets without impacting core database performance or verification response times.