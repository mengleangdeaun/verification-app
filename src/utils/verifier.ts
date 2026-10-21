import { buildCanonicalPayload, buildCanonicalPayloadLegacy, type VerificationResult } from '../types/certificates';
import { base64UrlToUint8Array, verifyCanonicalPayload } from './crypto';
import { getCertFromLedger } from './ledger';
import { getCachedVerification, setCachedVerification } from './security';

export async function verifyCertificate(
  id: string | null | undefined,
  sig: string | null | undefined
): Promise<VerificationResult> {
  const timestamp = new Date().toISOString();

  if (!id || !sig) {
    return { valid: false, code: 'MISSING_PARAMS', timestamp };
  }

  const cleanId = id.trim();
  const cleanSig = sig.trim();

  // Proactive Layer: Fast in-memory cache lookup
  const cached = getCachedVerification(cleanId, cleanSig);
  if (cached) {
    return cached;
  }

  try {
    const sigBytes = base64UrlToUint8Array(cleanSig);
    if (sigBytes.length !== 64) {
      return { valid: false, code: 'INVALID_SIGNATURE', timestamp };
    }
  } catch {
    return { valid: false, code: 'INVALID_SIGNATURE', timestamp };
  }

  const record = await getCertFromLedger(cleanId, {
    DATABASE_URL: process.env.DATABASE_URL || (typeof import.meta !== 'undefined' ? import.meta.env?.DATABASE_URL : undefined),
    SHEETS_PROXY_URL: process.env.SHEETS_PROXY_URL || (typeof import.meta !== 'undefined' ? import.meta.env?.SHEETS_PROXY_URL : undefined),
    SHEETS_BEARER_TOKEN: process.env.SHEETS_BEARER_TOKEN || (typeof import.meta !== 'undefined' ? import.meta.env?.SHEETS_BEARER_TOKEN : undefined),
  });

  if (!record) {
    const notFoundRes: VerificationResult = { valid: false, code: 'RECORD_NOT_FOUND', timestamp };
    setCachedVerification(cleanId, cleanSig, notFoundRes);
    return notFoundRes;
  }

  const pubKey = process.env.ED25519_PUBLIC_KEY_B64 || (typeof import.meta !== 'undefined' ? import.meta.env?.ED25519_PUBLIC_KEY_B64 : undefined);
  if (!pubKey) {
    return { valid: false, code: 'INVALID_SIGNATURE', timestamp, record };
  }

  const canonicalWithDocType = buildCanonicalPayload({
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
    docType: record.docType,
  });

  let isSigValid = await verifyCanonicalPayload(canonicalWithDocType, cleanSig, pubKey);

  // If validation fails, check if this is an older legacy certificate created before docType was added
  if (!isSigValid) {
    const canonicalLegacy = buildCanonicalPayloadLegacy({
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
    isSigValid = await verifyCanonicalPayload(canonicalLegacy, cleanSig, pubKey);
  }

  if (!isSigValid) {
    const tamperedRes: VerificationResult = { valid: false, code: 'DATA_TAMPERED', timestamp, record };
    setCachedVerification(cleanId, cleanSig, tamperedRes);
    return tamperedRes;
  }

  if (record.status === 'REVOKED') {
    const revokedRes: VerificationResult = { valid: false, code: 'CERTIFICATE_REVOKED', timestamp, record };
    setCachedVerification(cleanId, cleanSig, revokedRes);
    return revokedRes;
  }

  if (record.expiryDate) {
    const expiry = new Date(record.expiryDate);
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      const expiredRes: VerificationResult = { valid: false, code: 'CERTIFICATE_EXPIRED', timestamp, record };
      setCachedVerification(cleanId, cleanSig, expiredRes);
      return expiredRes;
    }
  }

  const verifiedRes: VerificationResult = { valid: true, code: 'VERIFIED', timestamp, record };
  setCachedVerification(cleanId, cleanSig, verifiedRes);
  return verifiedRes;
}
