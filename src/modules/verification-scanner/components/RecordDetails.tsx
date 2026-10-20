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

  const docTypeLabel = () => {
    if (r.docType === 'PROMOTION') return 'Letter of Promotion';
    if (r.docType === 'QUALIFICATION') return 'Certificate of Qualification';
    if (r.docType === 'APPRECIATION') return 'Letter of Appreciation';
    return 'Certificate of Completion';
  };

  return (
    <div class="mt-8 space-y-6">
      {/* Top Action Bar */}
      <div class="no-print flex items-center justify-between bg-card border border-border p-3.5 shadow-xs">
        <div class="flex items-center gap-2">
          <span class={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-medium border ${
            r.docType === 'PROMOTION'
              ? 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
              : r.docType === 'QUALIFICATION'
              ? 'bg-teal-500/10 text-teal-700 border-teal-500/20'
              : r.docType === 'APPRECIATION'
              ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
            Verified {docTypeLabel()}
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.97] cursor-pointer shadow-xs"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Official Certificate Paper Preview - Screen Display */}
      <div class="no-print overflow-x-auto pb-4">
        <PrintablePaper
          data={r}
          themeId={r.templateId || 'classic-diploma'}
          paperSize={r.paperSize || 'A4'}
          orientation={r.orientation || 'landscape'}
          includeSignatures={true}
          isPreview={true}
        />
      </div>


      {/* Dedicated Window.print() Target Overlay */}
      <div class="hidden print:block">
        <PrintablePaper
          data={r}
          themeId={r.templateId || 'classic-diploma'}
          paperSize={r.paperSize || 'A4'}
          orientation={r.orientation || 'landscape'}
          includeSignatures={true}
          isPreview={false}
        />
      </div>
    </div>
  );
}
