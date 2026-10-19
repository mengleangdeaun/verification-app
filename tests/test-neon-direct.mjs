import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import { appendCertToLedger, getCertFromLedger, updateCertStatusInLedger, listCertsFromLedger } from '../src/utils/ledger.ts';
import { buildCanonicalPayload } from '../src/types/certificates.ts';
import { signCanonicalPayload } from '../src/utils/crypto.ts';
import { verifyCertificate } from '../src/utils/verifier.ts';

// Load .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

async function runDirectNeonTest() {
  console.log('\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m Testing Direct Neon PostgreSQL Certificate Ledger \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is missing in .env');
  }

  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const testId = `CERT-2026-${hex}`;
  const privKey = process.env.ED25519_PRIVATE_KEY_B64;
  const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:4321').replace(/\/+$/, '');

  console.log(`\n1. Creating certificate ${testId}...`);
  const canonical = buildCanonicalPayload({
    id: testId,
    recipientName: 'Vannak Heng',
    programTitle: 'Advanced Cloud Architecture',
    description: 'Exemplary achievement in Serverless Database and Ed25519 Engineering.',
    level: 'Mastery Level 5',
    issueDate: '2026-10-19',
    expiryDate: null,
    signatory1Name: 'Dr. Virak Both',
    signatory1Title: 'Executive Director',
    signatory2Name: 'Sophea Kem',
    signatory2Title: 'Dean of Technology',
  });

  const { signature, payloadHash } = await signCanonicalPayload(canonical, privKey);
  const verificationUrl = `${appUrl}/check?id=${encodeURIComponent(testId)}&sig=${encodeURIComponent(signature)}`;

  const certRecord = {
    id: testId,
    recipientName: 'Vannak Heng',
    programTitle: 'Advanced Cloud Architecture',
    description: 'Exemplary achievement in Serverless Database and Ed25519 Engineering.',
    level: 'Mastery Level 5',
    issueDate: '2026-10-19',
    expiryDate: null,
    signatory1Name: 'Dr. Virak Both',
    signatory1Title: 'Executive Director',
    signatory2Name: 'Sophea Kem',
    signatory2Title: 'Dean of Technology',
    templateId: 'modern-tech',
    paperSize: 'A4',
    orientation: 'landscape',
    status: 'ACTIVE',
    payloadHash,
    signature,
    verificationUrl,
  };

  // 1. Insert into Neon
  const t0 = performance.now();
  await appendCertToLedger(certRecord, { DATABASE_URL: dbUrl });
  const tInsert = (performance.now() - t0).toFixed(1);
  console.log(`  \x1b[32m✔\x1b[0m Appended to Neon PostgreSQL in ${tInsert}ms`);

  // 2. Query back from Neon
  const t1 = performance.now();
  const fetched = await getCertFromLedger(testId, { DATABASE_URL: dbUrl });
  const tFetch = (performance.now() - t1).toFixed(1);
  console.log(`  \x1b[32m✔\x1b[0m Fetched record back in ${tFetch}ms:`, fetched?.recipientName, `[Status: ${fetched?.status}]`);

  // 3. Cryptographic Verification
  const t2 = performance.now();
  const verifyResult = await verifyCertificate(testId, signature);
  const tVerify = (performance.now() - t2).toFixed(1);
  console.log(`  \x1b[32m✔\x1b[0m Cryptographic Verification completed in ${tVerify}ms:`, verifyResult.code, `(Valid: ${verifyResult.valid})`);

  if (!verifyResult.valid) {
    throw new Error('Verification failed unexpectedly: ' + verifyResult.code);
  }

  // 4. Test Revocation
  console.log('\n2. Testing Revocation status update...');
  await updateCertStatusInLedger(testId, 'REVOKED', { DATABASE_URL: dbUrl });
  const afterRevoke = await verifyCertificate(testId, signature);
  console.log(`  \x1b[32m✔\x1b[0m Post-revocation check outcome:`, afterRevoke.code, `(Valid: ${afterRevoke.valid})`);

  if (afterRevoke.code !== 'CERTIFICATE_REVOKED') {
    throw new Error('Expected status CERTIFICATE_REVOKED but got ' + afterRevoke.code);
  }

  // 5. Test Batch Listing
  console.log('\n3. Testing Batch Listing from Neon...');
  const all = await listCertsFromLedger({ DATABASE_URL: dbUrl });
  const count = all.total ?? all.records?.length ?? all.length;
  console.log(`  \x1b[32m✔\x1b[0m Total certificates retrieved: ${count}`);

  console.log('\n\x1b[32m🎉 ALL NEON DATABASE TESTS PASSED WITH 100% SUCCESS!\x1b[0m\n');
}

runDirectNeonTest().catch((err) => {
  console.error('\x1b[31m[TEST ERROR]\x1b[0m', err);
  process.exit(1);
});
