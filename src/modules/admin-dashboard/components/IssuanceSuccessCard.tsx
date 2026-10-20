import { createSignal } from 'solid-js';
import type { CertificateRecord } from '../../../types/certificates';
import { Button } from '@/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/card';
import { Badge } from '@/components/badge';

interface Props {
  cert: CertificateRecord;
  isUpdate?: boolean;
  onPrint: () => void;
  onIssueAnother: () => void;
}

export default function IssuanceSuccessCard(props: Props) {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(props.cert.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card class="shadow-sm border-emerald-500/30 bg-emerald-500/5">
      <CardHeader class="pb-3 border-b border-emerald-500/20">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <CardTitle class="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                {props.isUpdate
                  ? 'Certificate Updated & Cryptographically Re-signed'
                  : 'Certificate Issued & Cryptographically Signed'}
              </CardTitle>
              <CardDescription class="text-xs text-muted-foreground mt-0.5">
                {props.isUpdate
                  ? 'Permanently updated in the ledger with verified digital signature'
                  : 'Permanently written to the Neon ledger and ready for distribution'}
              </CardDescription>
            </div>
          </div>
          <Badge variant="default" class="bg-emerald-600 text-white font-mono text-xs">
            {props.cert.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="p-6 space-y-5">
        <div class="bg-background rounded-lg p-4 border border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-muted-foreground block text-[11px] uppercase tracking-wider font-medium">Certificate ID</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="font-mono font-bold text-foreground text-sm">{props.cert.id}</span>
              <button
                type="button"
                onClick={handleCopy}
                class="px-2 py-0.5 text-[11px] rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {copied() ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
          </div>

          <div>
            <span class="text-muted-foreground block text-[11px] uppercase tracking-wider font-medium">Recipient</span>
            <span class="font-semibold text-foreground text-sm block mt-1">{props.cert.recipientName}</span>
          </div>

          <div class="sm:col-span-2">
            <span class="text-muted-foreground block text-[11px] uppercase tracking-wider font-medium">Program / Course</span>
            <span class="text-foreground text-xs block mt-0.5">{props.cert.programTitle} — <strong class="font-semibold">{props.cert.level}</strong></span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="default" size="sm" onClick={props.onPrint} class="gap-1.5 font-semibold text-xs">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF Now
          </Button>

          <a
            href={props.cert.verificationUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-input bg-background hover:bg-accent text-foreground transition-colors"
          >
            <svg class="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Public Verifier
          </a>

          <Button variant="ghost" size="sm" onClick={props.onIssueAnother} class="text-xs ml-auto">
            {props.isUpdate ? 'Done / Back to Studio' : '+ Issue Another Certificate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
