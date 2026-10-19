/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ED25519_PRIVATE_KEY_B64: string; // PKCS#8 Base64URL (Used ONLY in POST /api/create)
  readonly ED25519_PUBLIC_KEY_B64: string;  // SPKI Base64URL (Used in /api/verify & check.astro)
  readonly DATABASE_URL?: string;           // Neon Serverless PostgreSQL Connection URI
  readonly SHEETS_PROXY_URL?: string;       // Legacy Google Apps Script Web App URL (optional)
  readonly SHEETS_BEARER_TOKEN?: string;    // Legacy Secret token (optional)
  readonly ADMIN_API_SECRET: string;        // Master access key authenticating Admin UI -> Astro API
  readonly PUBLIC_APP_URL: string;          // e.g., "http://localhost:4321"
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
