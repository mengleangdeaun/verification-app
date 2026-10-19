import type { CertificateRecord } from '../../../types/certificates';
import PrintablePaper from '../../certificate-printer/components/PrintablePaper';
import { triggerCertificatePrint } from '../../certificate-printer/utils/printTrigger';

interface Props {
  record: CertificateRecord;
}

export default function RecordDetails(props: Props) {
  const r = props.record;

  const handlePrint = () => {
    triggerCertificatePrint(r.paperSize || 'A4', r.orientation || 'landscape');
  };

  return (
    <div class="mt-8 space-y-6">
      {/* Top Action Bar */}
      <div class="flex items-center justify-between bg-card border border-border p-3.5 shadow-xs">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Verified Document View
          </span>
          <span class="text-xs text-muted-foreground hidden sm:inline">•</span>
          <span class="text-xs text-muted-foreground hidden sm:inline">
            Template: <strong class="text-foreground capitalize">{r.templateId?.replace('-', ' ') || 'Classic Diploma'}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.97] cursor-pointer shadow-xs"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Official Certificate Paper Preview - Exact match with Admin Dashboard */}
      <div class="overflow-x-auto pb-4">
        <PrintablePaper
          data={r}
          themeId={r.templateId || 'classic-diploma'}
          paperSize={r.paperSize || 'A4'}
          orientation={r.orientation || 'landscape'}
          includeSignatures={true}
          isPreview={true}
        />
      </div>

      {/* Cryptographic Proof & Ledger Audit Card */}
      <div class="bg-card border border-border p-6 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 class="text-sm font-bold text-foreground">Cryptographic Audit Trail</h3>
          </div>
          <span class="text-[11px] font-mono text-muted-foreground uppercase">
            SHA-256 / Ed25519
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-muted-foreground block text-[11px] font-medium mb-1">Document Recipient</span>
            <span class="font-semibold text-foreground text-sm">{r.recipientName}</span>
          </div>
          <div>
            <span class="text-muted-foreground block text-[11px] font-medium mb-1">Program / Degree Title</span>
            <span class="font-semibold text-foreground text-sm">{r.programTitle}</span>
          </div>
          <div>
            <span class="text-muted-foreground block text-[11px] font-medium mb-1">Issue Date & Validity</span>
            <span class="font-mono tabular-nums text-foreground">{r.issueDate} • {r.expiryDate || 'Lifetime Credential'}</span>
          </div>
          <div>
            <span class="text-muted-foreground block text-[11px] font-medium mb-1">Ledger Identifier</span>
            <span class="font-mono tabular-nums font-semibold text-foreground">{r.id}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-border/80 space-y-2">
          <div>
            <span class="text-muted-foreground block text-[10px] uppercase font-mono tracking-wider">
              Cryptographic Payload Hash
            </span>
            <p class="font-mono text-[11px] text-foreground/80 break-all bg-muted/50 p-2 border border-border mt-1 select-all">
              {r.payloadHash}
            </p>
          </div>
          <div>
            <span class="text-muted-foreground block text-[10px] uppercase font-mono tracking-wider">
              Ed25519 Authority Signature
            </span>
            <p class="font-mono text-[11px] text-foreground/80 break-all bg-muted/50 p-2 border border-border mt-1 select-all">
              {r.signature}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
