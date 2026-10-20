import type { VerificationCode } from '../../../types/certificates';

interface Props {
  code: VerificationCode;
  timestamp?: string;
  payloadHash?: string;
}

const CONFIG: Record<VerificationCode, { title: string; desc: string; bg: string; border: string; text: string; badge: string; icon: string }> = {
  VERIFIED: {
    title: 'Cryptographically Verified Authentic',
    desc: 'The Ed25519 asymmetric signature matches the canonical ledger data with zero tampering.',
    bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white', icon: 'M5 13l4 4L19 7',
  },
  CERTIFICATE_REVOKED: {
    title: 'Certificate Formally Revoked',
    desc: 'This document was issued authentically in the past, but has been invalidated by the issuing authority.',
    bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-900', badge: 'bg-amber-600 text-white', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  CERTIFICATE_EXPIRED: {
    title: 'Certificate Expired',
    desc: 'This credential was genuine at issuance but has lapsed beyond its stated period of validity.',
    bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-900', badge: 'bg-amber-600 text-white', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  DATA_TAMPERED: {
    title: 'CRITICAL ALERT: Data Tampering Detected',
    desc: 'Cryptographic hash mismatch. The record content in the ledger diverges from the signed digest.',
    bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-900', badge: 'bg-red-600 text-white', icon: 'M6 18L18 6M6 6l12 12',
  },
  INVALID_SIGNATURE: {
    title: 'Invalid Cryptographic Signature',
    desc: 'The provided signature is malformed or was not signed by the authoritative Ed25519 key.',
    bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-900', badge: 'bg-red-600 text-white', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  RECORD_NOT_FOUND: {
    title: 'Certificate Record Not Found',
    desc: 'No matching certificate identifier was located in the official registry ledger.',
    bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-900', badge: 'bg-slate-700 text-white', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  MISSING_PARAMS: {
    title: 'Incomplete Verification Request',
    desc: 'Both Certificate ID (?id=) and cryptographic signature (?sig=) are required to verify authenticity.',
    bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', badge: 'bg-blue-600 text-white', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export default function StatusBanner(props: Props) {
  const c = CONFIG[props.code] || CONFIG.MISSING_PARAMS;
  return (
    <div class={`border-2 p-5 ${c.bg} ${c.border} shadow-sm`}>
      <div class="flex items-start gap-4">
        <div class={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center ${c.badge}`}>
          <svg class="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d={c.icon} />
          </svg>
        </div>
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class={`text-lg font-bold ${c.text}`}>{c.title}</h3>
            <span class={`px-2 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider ${c.badge}`}>
              {props.code}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-700 leading-relaxed">{c.desc}</p>
        </div>
      </div>
    </div>
  );
}
