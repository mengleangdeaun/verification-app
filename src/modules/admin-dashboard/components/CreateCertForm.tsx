import { createSignal, Show } from 'solid-js';
import type { CertificateRecord } from '../../../types/certificates';
import { dashboardStore } from '../stores/dashboardStore';
import { useCreateCert } from '../queries/useCreateCert';
import IssuanceSuccessCard from './IssuanceSuccessCard';
import SignatoryFields from './SignatoryFields';
import { Button } from '@/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/card';
import { DatePickerField } from '@/components/date-picker-field';
import { TextField, TextFieldLabel, TextFieldInput, TextFieldTextArea } from '@/components/text-field';

export default function CreateCertForm() {
  const { state, setState, resetDraft } = dashboardStore;
  const { issueCert } = useCreateCert();
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  const [issuedCert, setIssuedCert] = createSignal<CertificateRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (isSubmitting() || issueCert.isPending) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const newCert = await issueCert.mutateAsync({
        ...state.draft,
        templateId: state.activeTemplateId,
        paperSize: state.paperSize,
        orientation: state.orientation,
      });
      setIssuedCert(newCert);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueAnother = () => {
    resetDraft();
    setIssuedCert(null);
    setErrorMsg(null);
  };

  return (
    <Show
      when={!issuedCert()}
      fallback={
        <IssuanceSuccessCard
          cert={issuedCert()!}
          onPrint={() => dashboardStore.selectCertForPrint(issuedCert()!)}
          onIssueAnother={handleIssueAnother}
        />
      }
    >
      <Card class="shadow-xs border-border">
        <CardHeader class="flex flex-row items-center justify-between pb-4 border-b border-border">
          <div>
            <CardTitle class="text-base font-semibold text-foreground">Certificate Credential Details</CardTitle>
            <CardDescription class="text-xs text-muted-foreground mt-0.5">All fields are cryptographically signed into the canonical ledger</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={resetDraft} disabled={isSubmitting()}>Reset</Button>
        </CardHeader>
        <CardContent class="p-6 pt-5">
          <form onSubmit={handleSubmit}>
            <fieldset disabled={isSubmitting() || issueCert.isPending} class="space-y-5">
              {errorMsg() && (
                <div class="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 flex items-start justify-between gap-3">
                  <span>{errorMsg()}</span>
                  <button type="button" onClick={() => setErrorMsg(null)} class="text-xs underline cursor-pointer">Dismiss</button>
                </div>
              )}

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <TextField class="space-y-2">
                  <TextFieldLabel>Recipient Full Name *</TextFieldLabel>
                  <TextFieldInput required value={state.draft.recipientName} onInput={(e) => setState('draft', 'recipientName', e.currentTarget.value)} placeholder="e.g. Sokha Chan" />
                </TextField>
                <TextField class="space-y-2">
                  <TextFieldLabel>Program / Course Title *</TextFieldLabel>
                  <TextFieldInput required value={state.draft.programTitle} onInput={(e) => setState('draft', 'programTitle', e.currentTarget.value)} placeholder="e.g. Full-Stack Web Engineering" />
                </TextField>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <TextField class="space-y-2">
                  <TextFieldLabel>Level (Free-text) *</TextFieldLabel>
                  <TextFieldInput required value={state.draft.level} onInput={(e) => setState('draft', 'level', e.currentTarget.value)} placeholder="e.g. Level 4 / Advanced" />
                </TextField>
                <DatePickerField id="issue-date" label="Issue Date *" value={state.draft.issueDate} onChange={(v) => setState('draft', 'issueDate', v)} required />
                <DatePickerField id="expiry-date" label="Expiry Date (Optional)" value={state.draft.expiryDate || ''} onChange={(v) => setState('draft', 'expiryDate', v || null)} />
              </div>

              <TextField class="space-y-2">
                <TextFieldLabel>Citation Description *</TextFieldLabel>
                <TextFieldTextArea rows="3" required value={state.draft.description} onInput={(e) => setState('draft', 'description', e.currentTarget.value)} placeholder="For successfully completing the comprehensive curriculum with honors..." />
              </TextField>

              <SignatoryFields
                signatory1Name={state.draft.signatory1Name}
                signatory1Title={state.draft.signatory1Title}
                signatory2Name={state.draft.signatory2Name}
                signatory2Title={state.draft.signatory2Title}
                onUpdate={(field, val) => setState('draft', field, val)}
              />

              <Button
                type="submit"
                disabled={isSubmitting() || issueCert.isPending}
                variant="default"
                size="lg"
                class="w-full text-xs font-semibold h-10 mt-6 gap-2 transition-[filter,background-color,transform] duration-150 ease-out"
              >
                <Show
                  when={isSubmitting() || issueCert.isPending}
                  fallback={<span class="transition-[filter,opacity] duration-180 ease-out">Sign & Issue Certificate to Ledger</span>}
                >
                  <span class="inline-flex items-center gap-2 transition-[filter,opacity] duration-180 ease-out">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Cryptographically Signing & Writing to Ledger...</span>
                  </span>
                </Show>
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </Show>
  );
}
