import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import { appendCertToLedger, getCertFromLedger, updateCertInLedger, deleteCertFromLedger } from '../src/utils/ledger.ts';
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

async function runUpdateDeleteTest() {
  console.log('\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m Testing Certificate Update, Re-sign & Delete Ops   \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is missing in .env');

  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const testId = `CERT-TEST-${hex}`;
  const privKey = process.env.ED25519_PRIVATE_KEY_B64;
  const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:4321').replace(/\/+$/, '');

  // Step 1: Create initial certificate
  console.log(`\n1. Creating test certificate ${testId}...`);
  const initialCanonical = buildCanonicalPayload({
    id: testId,
    recipientName: 'Initial Student Name',
    programTitle: 'Web Security Fundamentals',
    description: 'Initial citation description.',
    level: 'Level 1',
    issueDate: '2026-10-20',
    expiryDate: null,
    signatory1Name: 'Dr. Virak Both',
    signatory1Title: 'Executive Director',
    signatory2Name: null,
    signatory2Title: null,
  });

  const sig1 = await signCanonicalPayload(initialCanonical, privKey);
  const initialRecord = {
    id: testId,
    recipientName: 'Initial Student Name',
    programTitle: 'Web Security Fundamentals',
    description: 'Initial citation description.',
    level: 'Level 1',
    issueDate: '2026-10-20',
    expiryDate: null,
    signatory1Name: 'Dr. Virak Both',
    signatory1Title: 'Executive Director',
    signatory2Name: null,
    signatory2Title: null,
    templateId: 'classic-diploma',
    paperSize: 'A4',
    orientation: 'landscape',
    status: 'ACTIVE',
    payloadHash: sig1.payloadHash,
    signature: sig1.signature,
    verificationUrl: `${appUrl}/check?id=${testId}&sig=${sig1.signature}`,
  };

  await appendCertToLedger(initialRecord, { DATABASE_URL: dbUrl });
  console.log(`  \x1b[32m✔\x1b[0m Created and verified initial certificate`);

  // Step 2: Update certificate with new recipient name and program
  console.log(`\n2. Updating certificate details and re-signing...`);
  const updatedCanonical = buildCanonicalPayload({
    id: testId,
    recipientName: 'Updated Student Name (Edited)',
    programTitle: 'Advanced Cryptography & Distributed Ledgers',
    description: 'Updated citation with highest honors.',
    level: 'Mastery Level 10',
    issueDate: '2026-10-20',
    expiryDate: '2028-10-20',
    signatory1Name: 'Dr. Virak Both',
    signatory1Title: 'Chancellor',
    signatory2Name: 'Sophea Kem',
    signatory2Title: 'Dean of Technology',
  });

  const sig2 = await signCanonicalPayload(updatedCanonical, privKey);
  const updatedRecord = {
    id: testId,
    recipientName: 'Updated Student Name (Edited)',
    programTitle: 'Advanced Cryptography & Distributed Ledgers',
    description: 'Updated citation with highest honors.',
    level: 'Mastery Level 10',
    issueDate: '2026-10-20',
    expiryDate: '2028-10-20',
    signatory1Name: 'Dr. Virak Both',
    signatory1Title: 'Chancellor',
    signatory2Name: 'Sophea Kem',
    signatory2Title: 'Dean of Technology',
    templateId: 'modern-tech',
    paperSize: 'A4',
    orientation: 'landscape',
    status: 'ACTIVE',
    payloadHash: sig2.payloadHash,
    signature: sig2.signature,
    verificationUrl: `${appUrl}/check?id=${testId}&sig=${sig2.signature}`,
  };

  const returnedFromUpdate = await updateCertInLedger(updatedRecord, { DATABASE_URL: dbUrl });
  console.log(`  \x1b[32m✔\x1b[0m Successfully updated in Neon PostgreSQL:`);
  console.log(`    Recipient: "${returnedFromUpdate.recipientName}"`);
  console.log(`    Program:   "${returnedFromUpdate.programTitle}"`);
  console.log(`    Level:     "${returnedFromUpdate.level}"`);

  // Step 3: Verify cryptographic validity of updated record
  console.log(`\n3. Verifying updated record signature with public verifier...`);
  const verifyUpdated = await verifyCertificate(testId, sig2.signature);
  console.log(`  \x1b[32m✔\x1b[0m Verification outcome: ${verifyUpdated.code} (Valid: ${verifyUpdated.valid})`);
  if (!verifyUpdated.valid) {
    throw new Error('Verification of updated certificate failed!');
  }

  // Step 4: Verify that old signature fails on updated data (tamper check)
  console.log(`\n4. Tamper check: verifying that obsolete signature is rejected...`);
  const verifyObsolete = await verifyCertificate(testId, sig1.signature);
  console.log(`  \x1b[32m✔\x1b[0m Obsolete signature rejected with code: ${verifyObsolete.code} (Valid: ${verifyObsolete.valid})`);
  if (verifyObsolete.valid) {
    throw new Error('Old signature should not be valid for updated certificate!');
  }

  // Step 5: Delete certificate
  console.log(`\n5. Testing certificate deletion from ledger...`);
  await deleteCertFromLedger(testId, { DATABASE_URL: dbUrl });
  console.log(`  \x1b[32m✔\x1b[0m Executed deleteCertFromLedger for ${testId}`);

  // Step 6: Verify certificate no longer exists in ledger
  const afterDelete = await getCertFromLedger(testId, { DATABASE_URL: dbUrl });
  if (afterDelete !== null) {
    throw new Error(`Certificate still exists in database after deletion!`);
  }
  console.log(`  \x1b[32m✔\x1b[0m getCertFromLedger confirmed certificate is gone (null)`);

  // Step 7: Verify public verifier returns RECORD_NOT_FOUND
  const verifyDeleted = await verifyCertificate(testId, sig2.signature);
  console.log(`  \x1b[32m✔\x1b[0m Public verifier response: ${verifyDeleted.code} (Valid: ${verifyDeleted.valid})`);
  if (verifyDeleted.code !== 'RECORD_NOT_FOUND') {
    throw new Error(`Expected RECORD_NOT_FOUND but got ${verifyDeleted.code}`);
  }

  console.log('\n\x1b[32m🎉 ALL UPDATE & DELETE TESTS PASSED WITH 100% SUCCESS!\x1b[0m\n');
}

runUpdateDeleteTest().catch((err) => {
  console.error('\x1b[31m[TEST ERROR]\x1b[0m', err);
  process.exit(1);
});
