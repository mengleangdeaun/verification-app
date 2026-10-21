import { createSignal } from 'solid-js';
import type { CertificateRecord } from '../../../types/certificates';
import PrintablePaper from '../../certificate-printer/components/PrintablePaper';
import { triggerCertificatePrint } from '../../certificate-printer/utils/printTrigger';
import { formatDisplayDate } from '../../certificate-printer/utils/formatUtils';
import { appPath } from '../../../utils/paths';

interface Props {
  record: CertificateRecord;
  initialTab?: 'summary' | 'paper';
}

export default function RecordDetails(props: Props) {
  const getInitialTab = () => {
    if (props.initialTab) return props.initialTab;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'summary') return 'summary';
      if (urlParams.get('tab') === 'paper') return 'paper';
    }
    return 'paper';
  };
  const [activeTab, setActiveTab] = createSignal<'summary' | 'paper'>(getInitialTab());
  const [copiedLink, setCopiedLink] = createSignal(false);
  const [copiedId, setCopiedId] = createSignal(false);

  const r = () => props.record;

  const handlePrint = () => {
    triggerCertificatePrint(r().paperSize || 'A4', r().orientation || 'landscape');
  };

  const handleCopyLink = () => {
    const url = r().verificationUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(r().id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShare = async () => {
    const url = r().verificationUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Verified Certificate: ${r().recipientName}`,
          text: `Official verifiable credential for ${r().recipientName} — ${r().programTitle}`,
          url,
        });
      } catch (e) {
        // User cancelled share or failed, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const docTypeLabel = () => {
    if (r().docType === 'PROMOTION') return 'Letter of Promotion';
    if (r().docType === 'QUALIFICATION') return 'Certificate of Qualification';
    if (r().docType === 'APPRECIATION') return 'Letter of Appreciation';
    return 'Certificate of Completion';
  };

  const docTypeBadgeColor = () => {
    if (r().docType === 'PROMOTION') return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    if (r().docType === 'QUALIFICATION') return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30';
    if (r().docType === 'APPRECIATION') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  };

  return (
    <div class="space-y-4 sm:space-y-5">
      {/* View Switcher & Action Toolbar */}
      <div class="no-print bg-card border border-border p-1.5 sm:p-2.5 flex items-center justify-between gap-1.5">
        {/* View Mode Segmented Controls */}
        <div class="inline-flex items-center bg-muted/60 p-0.5 border border-border/60 shrink-0">
          <a
            href={appPath(`/check?id=${r().id}&sig=${encodeURIComponent(r().signature || '')}&tab=paper`)}
            id="tab-paper-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('paper');
            }}
            class={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer no-underline ${
              activeTab() === 'paper'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="hidden sm:inline">Certificate Paper</span>
            <span class="sm:hidden text-[11px]">Paper</span>
          </a>

          <a
            href={appPath(`/check?id=${r().id}&sig=${encodeURIComponent(r().signature || '')}&tab=summary`)}
            id="tab-summary-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('summary');
            }}
            class={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer no-underline ${
              activeTab() === 'summary'
                 ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="hidden sm:inline">Overview Card</span>
            <span class="sm:hidden text-[11px]">Overview</span>
          </a>
        </div>

        {/* Action Buttons */}
        <div class="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
          {/* Share / Copy Link Button */}
          <button
            type="button"
            onClick={handleShare}
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold bg-background hover:bg-muted text-foreground border border-input rounded-md transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            title="Share or copy public verification link"
          >
            {copiedLink() ? (
              <>
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-emerald-700 dark:text-emerald-400 text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <svg class="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span class="text-[11px] sm:text-xs">Share</span>
              </>
            )}
          </button>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            class="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-transform active:scale-[0.98] cursor-pointer shadow-xs"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span class="text-[11px] sm:text-xs">PDF</span>
          </button>
        </div>
      </div>

      {/* View Mode 1: Mobile-First Structured Credential Overview */}
      {activeTab() === 'summary' && (
        <div class="no-print space-y-4">
          {/* Main Credential Card */}
          <div class="bg-card border border-border shadow-xs overflow-hidden">
            {/* Card Header Banner */}
            <div class="bg-muted/40 border-b border-border/80 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 shrink-0">
                <span class={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] sm:text-xs font-mono font-medium border ${docTypeBadgeColor()}`}>
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {docTypeLabel()}
                </span>
                {r().level && (
                  <span class="hidden sm:inline-block text-xs font-medium text-muted-foreground">
                    • {r().level}
                  </span>
                )}
              </div>

              <div class="flex items-center gap-1 text-xs text-muted-foreground font-mono ml-auto shrink-0">
                <span class="text-[10px] uppercase text-muted-foreground">ID:</span>
                <span class="font-bold text-foreground text-[11px] sm:text-xs">{r().id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  class="p-1 hover:text-foreground transition-colors cursor-pointer shrink-0"
                  title="Copy Certificate ID"
                >
                  {copiedId() ? (
                    <span class="text-[10px] text-emerald-600 font-semibold font-sans">Copied!</span>
                  ) : (
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Recipient & Program Hero */}
            <div class="p-4 sm:p-7">
              <p class="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Official Credential Awarded To
              </p>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mt-1 mb-2 tracking-tight">
                {r().recipientName}
              </h2>
              <div class="text-base sm:text-lg font-semibold text-primary/90 flex flex-wrap items-center gap-2">
                <span>{r().programTitle}</span>
                {r().level && (
                  <span class="sm:hidden text-xs font-mono px-2 py-0.5 bg-muted rounded border border-border">
                    {r().level}
                  </span>
                )}
              </div>

              <p class="mt-4 text-xs sm:text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3.5 py-0.5 bg-muted/20">
                {r().description}
              </p>

              {/* Structured Key Attributes Grid */}
              <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-border pt-5">
                <div class="space-y-0.5">
                  <span class="text-[10px] sm:text-xs uppercase font-medium text-muted-foreground block">
                    Issue Date
                  </span>
                  <span class="text-xs sm:text-sm font-semibold text-foreground">
                    {formatDisplayDate(r().issueDate) || r().issueDate}
                  </span>
                </div>

                <div class="space-y-0.5">
                  <span class="text-[10px] sm:text-xs uppercase font-medium text-muted-foreground block">
                    Expiry Status
                  </span>
                  <span class="text-xs sm:text-sm font-semibold text-foreground">
                    {r().expiryDate ? formatDisplayDate(r().expiryDate) : 'Lifetime / No Expiry'}
                  </span>
                </div>

                <div class="space-y-0.5">
                  <span class="text-[10px] sm:text-xs uppercase font-medium text-muted-foreground block">
                    Lifecycle Status
                  </span>
                  <span class={`inline-flex items-center gap-1 text-xs font-semibold ${
                    r().status === 'ACTIVE'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {r().status || 'ACTIVE'}
                  </span>
                </div>

                <div class="space-y-0.5">
                  <span class="text-[10px] sm:text-xs uppercase font-medium text-muted-foreground block">
                    Verification
                  </span>
                  <span class="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Verified Authentic
                  </span>
                </div>
              </div>
            </div>

            {/* Signatory Endorsement Block */}
            <div class="bg-muted/30 border-t border-border p-4 sm:p-6">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Authoritative Signatories
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Signatory 1 */}
                <div class="flex items-center gap-3.5 bg-background p-3.5 rounded-lg border border-border/80 shadow-2xs">
                  <div class="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs sm:text-sm font-bold text-foreground truncate">{r().signatory1Name}</p>
                    <p class="text-[11px] text-muted-foreground truncate">{r().signatory1Title}</p>
                    <span class="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      Authorized Signatory
                    </span>
                  </div>
                </div>

                {/* Signatory 2 */}
                {r().signatory2Name && (
                  <div class="flex items-center gap-3.5 bg-background p-3.5 rounded-lg border border-border/80 shadow-2xs">
                    <div class="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs sm:text-sm font-bold text-foreground truncate">{r().signatory2Name}</p>
                      <p class="text-[11px] text-muted-foreground truncate">{r().signatory2Title}</p>
                      <span class="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        Authorized Signatory
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 2: Responsive Official Certificate Paper Preview */}
      {activeTab() === 'paper' && (
        <div class="no-print space-y-2.5">
          <div class="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Authorized Signatory
              </span>
              <span class="text-muted-foreground/50 hidden xs:inline">•</span>
              <span class="font-medium text-[11px] sm:text-xs text-foreground/75 truncate hidden xs:inline">Official Document Representation</span>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              class="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer text-[11px] sm:text-xs"
            >
              <span>Download PDF</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Scaled Responsive Paper Container */}
          <div class="w-full p-1.5 sm:p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-center overflow-x-auto">
            <div class="w-full max-w-[820px]">
              <PrintablePaper
                data={r()}
                themeId={r().templateId || 'classic-diploma'}
                paperSize={r().paperSize || 'A4'}
                orientation={r().orientation || 'landscape'}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Window.print() Target Overlay (Always rendered for physical printing) */}
      <div class="hidden print:block">
        <PrintablePaper
          data={r()}
          themeId={r().templateId || 'classic-diploma'}
          paperSize={r().paperSize || 'A4'}
          orientation={r().orientation || 'landscape'}
          isPreview={false}
        />
      </div>
    </div>
  );
}
