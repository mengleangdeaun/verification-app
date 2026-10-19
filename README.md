# Full-Stack Certificate Ledger & Verification System

A high-trust, cryptographically verifiable document issuance, revocation, and verification platform built with **Astro 5**, **SolidJS**, **Native Web Crypto (Ed25519)**, and **Neon Serverless PostgreSQL**, deployed seamlessly on **Vercel**.

The system issues tamper-proof digital and physical certificates backed by an Ed25519 cryptographic signature and a high-concurrency Neon Postgres ledger, allowing third-party auditors and the general public to verify document authenticity in **under 100ms** on mobile networks with **0 KB client JavaScript**.

---

## Key Features

- **0 KB Client-Side JS Verification (`/check`)**: Public verification is completely server-rendered without hydration JavaScript for maximum speed and security.
- **Asymmetric Ed25519 Security**: Certificates are signed using PKCS#8 private keys (`crypto.subtle`) and verified via public SPKI keys. Any tampering with certificate fields results in an immediate cryptographic verification failure (`DATA_TAMPERED`).
- **Unified Full-Stack Architecture**: Uses Astro's built-in TypeScript API backend (`/api/create`, `/api/verify`) and SSR runtime on Vercel—eliminating the need for separate backend microservices or server infrastructure.
- **Neon Serverless PostgreSQL Persistence**: High-speed, ACID-compliant relational persistence with B-Tree indexed queries (`< 15ms`), connection pooling, and an automatic local mock JSON fallback for offline development.
- **Fine-Grained Reactive Admin Island (`/admin`)**: Interactive registrar workspace built with **SolidJS** (`client:only="solid-js"`) featuring **Zero React dependencies**.
- **Real-Time Live Canvas Preview**: Certificate draft updates dynamically as administrators type.
- **Native Browser Print Engine**: Dynamic `@page` CSS injection supporting **A4** and **US Letter** across **Landscape** and **Portrait** orientations.
- **Dual-Mode Signature Rendering**: Toggle switch in the print controls allows switching between digital vector signatures (for PDF archiving) and blank reserved spacing (`h-14`) for physical wet-ink pen signing after printing.
- **Strict Code Modularity**: Hard ceilings on file complexity (e.g. routing pages `< 50 LOC`, base layout `< 30 LOC`).

---

## Technology Stack

- **Framework:** [Astro 5](https://astro.build) (Server Output Mode with Vercel/Node adapter)
- **UI Island:** [SolidJS](https://www.solidjs.com/) with `@astrojs/solid-js`
- **Database:** [Neon](https://neon.tech) (Serverless PostgreSQL with connection pooling)
- **State & Queries:** Solid Store (`createStore`), [@tanstack/solid-query](https://tanstack.com/query), [@tanstack/solid-table](https://tanstack.com/table)
- **Styling:** [TailwindCSS](https://tailwindcss.com) with `@media print` print styling
- **Cryptography:** Native Web Crypto API (`crypto.subtle` with Ed25519 & SHA-256)
- **QR Engine:** [uqr](https://github.com/unjs/uqr) (Zero-dependency inline SVG vector generator)

---

## File Structure

```text
verification-app/
├── .env.development                   # Local development secrets & dev keypair
├── .env.production                    # Production environment routes (Vercel)
├── astro.config.mjs                   # Astro SSR & SolidJS integration
├── package.json                       # Dependencies & scripts
├── tailwind.config.cjs                # Print media & theme configuration
├── tsconfig.json                      # SolidJS JSX preserved configuration
├── public/
│   ├── favicon.svg                    # SVG icon
│   └── assets/                        # Static logos, seals & signatures
│       ├── logo.svg                   # Organization emblem
│       ├── seal.svg                   # Vector verification stamp
│       ├── sig-1.svg                  # Static vector signature 1
│       └── sig-2.svg                  # Static vector signature 2
└── src/
    ├── layouts/
    │   └── Layout.astro               # Base HTML container (< 30 LOC)
    ├── env.d.ts                       # Environment variable typings
    │
    ├── pages/                         # Routing & API boundary (< 50 LOC per file)
    │   ├── index.astro                # Public manual lookup landing page
    │   ├── check.astro                # Public Zero-JS verification view (< 100ms TTI)
    │   ├── admin.astro                # Mounts SolidJS admin island
    │   └── api/
    │       ├── create.ts              # POST (Issue) & PATCH (Revoke)
    │       └── verify.ts              # GET (Single lookup & Admin list)
    │
    ├── types/
    │   ├── certificates.ts            # Domain schemas & canonical payload (< 40 LOC)
    │   └── templates.ts               # Theme & paper geometry schemas (< 40 LOC)
    │
    ├── utils/
    │   ├── crypto.ts                  # Ed25519 Web Crypto sign & verify
    │   ├── verifier.ts                # Shared verification pipeline
    │   └── ledger.ts                  # Neon Postgres client & local mock fallback
    │
    └── modules/
        ├── admin-dashboard/           # Admin workspace feature module
        │   ├── stores/dashboardStore.ts
        │   ├── queries/useCreateCert.ts & useFetchCerts.ts
        │   ├── components/CreateCertForm.tsx & DataGridTable.tsx & TemplatePicker.tsx
        │   └── AdminDashboardShell.tsx
        ├── verification-scanner/      # Zero-JS verification components
        │   ├── hooks/useQueryParam.ts
        │   └── components/StatusBanner.tsx & RecordDetails.tsx
        └── certificate-printer/       # Native canvas & print engine
            ├── constants/themes.ts
            ├── utils/printTrigger.ts
            └── components/PrintablePaper.tsx & VectorQrCode.tsx
```

---

## Environment Variables

Create or configure `.env` (or `.env.development`):

```bash
# Cryptographic Ed25519 Keypair (Base64URL)
ED25519_PRIVATE_KEY_B64=MC4CAQAwBQYDK2VwBCIEICTwTXLdyn-MBiFV7RWccuS5ojv-EIeXV4wkODtcyEkY
ED25519_PUBLIC_KEY_B64=MCowBQYDK2VwAyEA0gsoY__wDXsGCCOdxh3s8Fr2sW-MzSByRg4VgHFBIjE

# Neon Serverless PostgreSQL Database URL (Leave empty to use local mock ledger)
DATABASE_URL=postgres://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require

# Admin Secret (Used to authenticate into /admin and POST / PATCH /api/create)
ADMIN_API_SECRET=admin_secret_key_2026_ledger

# Public Base URL
PUBLIC_APP_URL=http://localhost:4321
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser:
- Public verification portal: [http://localhost:4321/](http://localhost:4321/)
- Admin workspace: [http://localhost:4321/admin](http://localhost:4321/admin) (Enter `admin_secret_key_2026_ledger` to unlock)

### 3. Run Automated End-to-End Tests
```bash
npm run test
```
Tests certificate issuance, Ed25519 cryptographic validation, tamper rejection, revocation status updates, and Zero-JS SSR assertions.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Neon PostgreSQL Database Setup

1. Create a project at [Neon Console](https://console.neon.tech).
2. Open the **SQL Editor** in Neon and execute:
   ```sql
   CREATE TYPE cert_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
   CREATE TYPE paper_size AS ENUM ('A4', 'LETTER');
   CREATE TYPE paper_orientation AS ENUM ('landscape', 'portrait');

   CREATE TABLE IF NOT EXISTS certificates (
       id VARCHAR(64) PRIMARY KEY,
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
       payload_hash VARCHAR(64) NOT NULL,
       signature TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_certs_status ON certificates(status);
   CREATE INDEX IF NOT EXISTS idx_certs_recipient ON certificates(recipient_name);
   CREATE INDEX IF NOT EXISTS idx_certs_created_at ON certificates(created_at DESC);
   ```
3. Copy your pooled connection URI into `DATABASE_URL` in your `.env` and Vercel dashboard.

*(Note: If `DATABASE_URL` is omitted, the app automatically runs against the local JSON ledger `data/mock-ledger.json` for zero-friction offline development).*

---

## Strict LOC Budgets

| Target File | Ceiling | Actual | Status |
|---|---|---|---|
| `src/layouts/Layout.astro` | `< 30 LOC` | 24 | PASS |
| `src/pages/index.astro` | `< 50 LOC` | 34 | PASS |
| `src/pages/check.astro` | `< 50 LOC` | 26 | PASS |
| `src/pages/admin.astro` | `< 50 LOC` | 9 | PASS |
| `src/types/certificates.ts` | `< 40 LOC` | 35 | PASS |
| `src/types/templates.ts` | `< 40 LOC` | 22 | PASS |
| `src/modules/admin-dashboard/stores/dashboardStore.ts` | `< 100 LOC` | 64 | PASS |
| `src/modules/verification-scanner/components/StatusBanner.tsx` | `< 100 LOC` | 75 | PASS |
| `src/modules/admin-dashboard/components/CreateCertForm.tsx` | `< 150 LOC` | 134 | PASS |
| `src/modules/admin-dashboard/components/IssuanceSuccessCard.tsx` | `< 110 LOC` | 104 | PASS |
| `src/modules/admin-dashboard/components/TablePaginationBar.tsx` | `< 110 LOC` | 108 | PASS |
| `src/modules/certificate-printer/components/PrintablePaper.tsx` | `< 200 LOC` | 142 | PASS |

---

## License

MIT
