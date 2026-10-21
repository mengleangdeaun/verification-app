import type { VerificationCode } from '../../../types/certificates';

interface Props {
  code: VerificationCode;
  timestamp?: string;
  payloadHash?: string;
}

const CONFIG: Record<VerificationCode, {
  title: string;
  desc: string;
  containerClass: string;
  badgeClass: string;
  iconBgClass: string;
  titleClass: string;
  iconSvg: string;
  statusBadge: string;
}> = {
  VERIFIED: {
    title: 'Verified Authentic Credential',
    desc: 'This credential has been officially verified against the central registry and confirmed authentic.',
    containerClass: 'bg-emerald-500/[0.04] border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-sm',
    badgeClass: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    iconBgClass: 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-500/15',
    titleClass: 'text-emerald-950 dark:text-emerald-50',
    iconSvg: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
    statusBadge: 'Verified Authentic',
  },
  CERTIFICATE_REVOKED: {
    title: 'Certificate Formally Revoked',
    desc: 'This document was issued in the past, but has been officially revoked by the issuing authority.',
    containerClass: 'bg-amber-500/[0.05] border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-sm',
    badgeClass: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    iconBgClass: 'bg-amber-600 text-white shadow-xs ring-4 ring-amber-500/15',
    titleClass: 'text-amber-950 dark:text-amber-50',
    iconSvg: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    statusBadge: 'Revoked by Authority',
  },
  CERTIFICATE_EXPIRED: {
    title: 'Certificate Validity Expired',
    desc: 'This credential was genuine at issuance, but has lapsed beyond its stated period of validity.',
    containerClass: 'bg-amber-500/[0.05] border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-sm',
    badgeClass: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    iconBgClass: 'bg-amber-600 text-white shadow-xs ring-4 ring-amber-500/15',
    titleClass: 'text-amber-950 dark:text-amber-50',
    iconSvg: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    statusBadge: 'Validity Lapsed',
  },
  DATA_TAMPERED: {
    title: 'Verification Failed: Record Mismatch',
    desc: 'The certificate details do not match the official record in the central registry.',
    containerClass: 'bg-rose-500/[0.06] border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-sm',
    badgeClass: 'bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    iconBgClass: 'bg-rose-600 text-white shadow-xs ring-4 ring-rose-500/15',
    titleClass: 'text-rose-950 dark:text-rose-50',
    iconSvg: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    statusBadge: 'Integrity Failed',
  },
  INVALID_SIGNATURE: {
    title: 'Invalid Verification Signature',
    desc: 'The provided signature is invalid or could not be verified by the issuing authority.',
    containerClass: 'bg-rose-500/[0.06] border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-sm',
    badgeClass: 'bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    iconBgClass: 'bg-rose-600 text-white shadow-xs ring-4 ring-rose-500/15',
    titleClass: 'text-rose-950 dark:text-rose-50',
    iconSvg: 'M6 18L18 6M6 6l12 12',
    statusBadge: 'Signature Invalid',
  },
  RECORD_NOT_FOUND: {
    title: 'Certificate Record Not Located',
    desc: 'No matching certificate identifier was located in the official registry.',
    containerClass: 'bg-slate-500/[0.05] border-slate-400/40 text-slate-900 dark:text-slate-100 shadow-sm',
    badgeClass: 'bg-slate-600/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
    iconBgClass: 'bg-slate-700 text-white shadow-xs ring-4 ring-slate-500/15',
    titleClass: 'text-slate-900 dark:text-slate-50',
    iconSvg: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    statusBadge: 'Not In Registry',
  },
  MISSING_PARAMS: {
    title: 'Incomplete Verification Query',
    desc: 'Both Certificate ID and verification signature are required to verify authenticity.',
    containerClass: 'bg-blue-500/[0.05] border-blue-500/30 text-blue-950 dark:text-blue-100 shadow-sm',
    badgeClass: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    iconBgClass: 'bg-blue-600 text-white shadow-xs ring-4 ring-blue-500/15',
    titleClass: 'text-blue-950 dark:text-blue-50',
    iconSvg: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
    statusBadge: 'Query Missing',
  },
  RATE_LIMITED: {
    title: 'Verification Request Limit Exceeded',
    desc: 'Too many verification attempts were made in a short time. Please wait a moment before trying again.',
    containerClass: 'bg-amber-500/[0.05] border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-sm',
    badgeClass: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    iconBgClass: 'bg-amber-600 text-white shadow-xs ring-4 ring-amber-500/15',
    titleClass: 'text-amber-950 dark:text-amber-50',
    iconSvg: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
    statusBadge: 'Rate Limit (5/min)',
  },
};

export default function StatusBanner(props: Props) {
  const c = CONFIG[props.code] || CONFIG.MISSING_PARAMS;

  const formattedTimestamp = () => {
    if (!props.timestamp) return null;
    try {
      const date = new Date(props.timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' · ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return props.timestamp;
    }
  };

  return (
    <section aria-label="Verification Status" class={`border p-3 sm:p-5 transition-all duration-200 ${c.containerClass}`}>
      {/* Header Row */}
      <div class="flex items-start gap-2.5 sm:gap-4">
        <div class={`flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center p-2 sm:p-2.5 justify-center ${c.iconBgClass}`}>
          <svg class="h-4.5 w-4.5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d={c.iconSvg} />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <h1 class={`text-sm sm:text-lg font-bold tracking-tight leading-snug ${c.titleClass}`}>
              {c.title}
            </h1>
            <span class={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider border ${c.badgeClass}`}>
              <span class="w-1.5 h-1.5 bg-current"></span>
              {c.statusBadge}
            </span>
          </div>

          <p class="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            {c.desc}
          </p>

          {/* Clean Verification Timestamp */}
          {formattedTimestamp() && (
            <div class="mt-2.5 pt-2 border-t border-current/10 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground font-medium">
              <span class="text-foreground/60">Verified:</span>
              <span class="text-foreground/80">{formattedTimestamp()}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
