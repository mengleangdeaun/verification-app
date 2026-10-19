import { buildCanonicalPayload, type VerificationResult } from '../types/certificates';
import { base64UrlToUint8Array, verifyCanonicalPayload } from './crypto';
import { getCertFromLedger } from './ledger';

export async function verifyCertificate(
  id: string | null | undefined,
  sig: string | null | undefined
): Promise<VerificationResult> {
  const timestamp = new Date().toISOString();

  if (!id || !sig) {
    return { valid: false, code: 'MISSING_PARAMS', timestamp };
  }

  const cleanSig = sig.trim();
  try {
    const sigBytes = base64UrlToUint8Array(cleanSig);
    if (sigBytes.length !== 64) {
      return { valid: false, code: 'INVALID_SIGNATURE', timestamp };
    }
  } catch {
    return { valid: false, code: 'INVALID_SIGNATURE', timestamp };
  }

  const record = await getCertFromLedger(id.trim(), {
    DATABASE_URL: process.env.DATABASE_URL || (typeof import.meta !== 'undefined' ? import.meta.env?.DATABASE_URL : undefined),
    SHEETS_PROXY_URL: process.env.SHEETS_PROXY_URL || (typeof import.meta !== 'undefined' ? import.meta.env?.SHEETS_PROXY_URL : undefined),
    SHEETS_BEARER_TOKEN: process.env.SHEETS_BEARER_TOKEN || (typeof import.meta !== 'undefined' ? import.meta.env?.SHEETS_BEARER_TOKEN : undefined),
  });

  if (!record) {
    return { valid: false, code: 'RECORD_NOT_FOUND', timestamp };
  }

  const pubKey = process.env.ED25519_PUBLIC_KEY_B64 || (typeof import.meta !== 'undefined' ? import.meta.env?.ED25519_PUBLIC_KEY_B64 : undefined);
  if (!pubKey) {
    return { valid: false, code: 'INVALID_SIGNATURE', timestamp, record };
  }

  const canonical = buildCanonicalPayload({
    id: record.id,
    recipientName: record.recipientName,
    programTitle: record.programTitle,
    description: record.description,
    level: record.level,
    issueDate: record.issueDate,
    expiryDate: record.expiryDate || null,
    signatory1Name: record.signatory1Name,
    signatory1Title: record.signatory1Title,
    signatory2Name: record.signatory2Name || null,
    signatory2Title: record.signatory2Title || null,
  });

  const isSigValid = await verifyCanonicalPayload(canonical, cleanSig, pubKey);
  if (!isSigValid) {
    return { valid: false, code: 'DATA_TAMPERED', timestamp, record };
  }

  if (record.status === 'REVOKED') {
    return { valid: false, code: 'CERTIFICATE_REVOKED', timestamp, record };
  }

  if (record.expiryDate) {
    const expiry = new Date(record.expiryDate);
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      return { valid: false, code: 'CERTIFICATE_EXPIRED', timestamp, record };
    }
  }

  return { valid: true, code: 'VERIFIED', timestamp, record };
}
