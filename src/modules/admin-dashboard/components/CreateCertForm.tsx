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
  const { state, setState, resetDraft, cancelEdit } = dashboardStore;
  const { issueCert, updateCert } = useCreateCert();
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  const [issuedCert, setIssuedCert] = createSignal<CertificateRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const isEditing = () => !!state.editingCertId;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (isSubmitting() || issueCert.isPending || updateCert.isPending) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      let resultCert: CertificateRecord;
      if (isEditing()) {
        resultCert = await updateCert.mutateAsync({
          id: state.editingCertId!,
          ...state.draft,
          status: state.editingCertStatus || 'ACTIVE',
          templateId: state.activeTemplateId,
          paperSize: state.paperSize,
          orientation: state.orientation,
        });
      } else {
        resultCert = await issueCert.mutateAsync({
          ...state.draft,
          templateId: state.activeTemplateId,
          paperSize: state.paperSize,
          orientation: state.orientation,
        });
      }
      setIssuedCert(resultCert);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueAnother = () => {
    cancelEdit();
    setIssuedCert(null);
    setErrorMsg(null);
  };

  return (
    <Show
      when={!issuedCert()}
      fallback={
        <IssuanceSuccessCard
          cert={issuedCert()!}
          isUpdate={isEditing()}
          onPrint={() => dashboardStore.selectCertForPrint(issuedCert()!)}
          onIssueAnother={handleIssueAnother}
        />
      }
    >
      <Card class="shadow-xs border-border">
        <CardHeader class="flex flex-row items-center justify-between pb-4 border-b border-border">
          <div>
            <div class="flex items-center gap-2">
              <CardTitle class="text-base font-semibold text-foreground">
                {isEditing() ? 'Edit Certificate Credential' : 'Certificate Credential Details'}
              </CardTitle>
              <Show when={isEditing()}>
                <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Editing: {state.editingCertId}
                </span>
              </Show>
            </div>
            <CardDescription class="text-xs text-muted-foreground mt-0.5">
              {isEditing()
                ? 'Live edits reflect on the preview template. Saving will re-sign the ledger.'
                : 'All fields are cryptographically signed into the canonical ledger'}
            </CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Show
              when={isEditing()}
              fallback={
                <Button type="button" variant="ghost" size="sm" onClick={resetDraft} disabled={isSubmitting()}>Reset</Button>
              }
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                disabled={isSubmitting()}
                class="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 cursor-pointer"
              >
                Cancel Edit
              </Button>
            </Show>
          </div>
        </CardHeader>
        <CardContent class="p-6 pt-5">
          <form onSubmit={handleSubmit}>
            <fieldset disabled={isSubmitting() || issueCert.isPending || updateCert.isPending} class="space-y-5">
              {errorMsg() && (
                <div class="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 flex items-start justify-between gap-3">
                  <span>{errorMsg()}</span>
                  <button type="button" onClick={() => setErrorMsg(null)} class="text-xs underline cursor-pointer">Dismiss</button>
                </div>
              )}

              {/* Document Type Selector */}
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">Document Type *</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => dashboardStore.setDocType('COMPLETION')}
                    class={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      (state.draft.docType || 'COMPLETION') === 'COMPLETION'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div>
                      <p class="text-xs font-bold">Certificate of Completion</p>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Course & skill training</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => dashboardStore.setDocType('QUALIFICATION')}
                    class={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      state.draft.docType === 'QUALIFICATION'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-950 dark:text-teal-200 ring-1 ring-teal-500/30'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div>
                      <p class="text-xs font-bold">Certificate of Qualification</p>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Trade mastery & competency</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => dashboardStore.setDocType('APPRECIATION')}
                    class={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      state.draft.docType === 'APPRECIATION'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div>
                      <p class="text-xs font-bold">Letter of Appreciation</p>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Excellence & dedication</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => dashboardStore.setDocType('PROMOTION')}
                    class={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      state.draft.docType === 'PROMOTION'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div>
                      <p class="text-xs font-bold">Letter of Promotion</p>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Role step & rank advance</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recipient Field */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <TextField class="space-y-2">
                  <TextFieldLabel>Recipient Full Name *</TextFieldLabel>
                  <TextFieldInput
                    required
                    value={state.draft.recipientName}
                    onInput={(e) => {
                      const name = e.currentTarget.value;
                      setState('draft', 'recipientName', name);
                      setState('draft', 'description', dashboardStore.buildStrongTemplate({ ...state.draft, recipientName: name }));
                    }}
                    placeholder="e.g. Deaun Mengleang"
                  />
                </TextField>

                <Show
                  when={state.draft.docType === 'PROMOTION'}
                  fallback={
                    <TextField class="space-y-2">
                      <TextFieldLabel>
                        {state.draft.docType === 'QUALIFICATION'
                          ? 'Trade / Qualification Specialty *'
                          : state.draft.docType === 'APPRECIATION'
                          ? 'Event / Occasion *'
                          : 'Training Program / Course *'}
                      </TextFieldLabel>
                      <TextFieldInput
                        required
                        value={state.draft.programTitle}
                        onInput={(e) => {
                          const val = e.currentTarget.value;
                          setState('draft', 'programTitle', val);
                          if (state.draft.docType === 'QUALIFICATION') {
                            setState('draft', 'qualificationTitle', val);
                          } else if (state.draft.docType === 'APPRECIATION') {
                            setState('draft', 'appreciationEvent', val);
                          }
                          setState('draft', 'description', dashboardStore.buildStrongTemplate({
                            ...state.draft,
                            programTitle: val,
                            qualificationTitle: val,
                            appreciationEvent: val,
                          }));
                        }}
                        placeholder={
                          state.draft.docType === 'QUALIFICATION'
                            ? 'e.g. PPF Master Installer & Surface Specialist'
                            : state.draft.docType === 'APPRECIATION'
                            ? 'e.g. Autoshow Expo'
                            : 'e.g. PPF Installation Training Program'
                        }
                      />
                    </TextField>
                  }
                >
                  <div class="grid grid-cols-2 gap-2">
                    <TextField class="space-y-2">
                      <TextFieldLabel>From Current Role *</TextFieldLabel>
                      <TextFieldInput
                        required
                        value={state.draft.promotionFromRole || ''}
                        onInput={(e) => {
                          const from = e.currentTarget.value;
                          setState('draft', 'promotionFromRole', from);
                          const title = `${from} → ${state.draft.promotionToRole || ''}`;
                          setState('draft', 'programTitle', title);
                          setState('draft', 'description', dashboardStore.buildStrongTemplate({
                            ...state.draft,
                            promotionFromRole: from,
                            programTitle: title,
                          }));
                        }}
                        placeholder="e.g. L0 Intern"
                      />
                    </TextField>
                    <TextField class="space-y-2">
                      <TextFieldLabel>To Promoted Role *</TextFieldLabel>
                      <TextFieldInput
                        required
                        value={state.draft.promotionToRole || ''}
                        onInput={(e) => {
                          const to = e.currentTarget.value;
                          setState('draft', 'promotionToRole', to);
                          const title = `${state.draft.promotionFromRole || ''} → ${to}`;
                          setState('draft', 'programTitle', title);
                          setState('draft', 'description', dashboardStore.buildStrongTemplate({
                            ...state.draft,
                            promotionToRole: to,
                            programTitle: title,
                          }));
                        }}
                        placeholder="e.g. L1 Junior Technician"
                      />
                    </TextField>
                  </div>
                </Show>
              </div>

              {/* Contextual Date Fields (No Level / Rank fields!) */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <DatePickerField
                  id="issue-date"
                  label={
                    state.draft.docType === 'PROMOTION'
                      ? 'Effective Promotion Date *'
                      : state.draft.docType === 'QUALIFICATION'
                      ? 'Qualification Conferred Date *'
                      : state.draft.docType === 'APPRECIATION'
                      ? 'Presentation Date *'
                      : 'Completion Date *'
                  }
                  value={state.draft.issueDate}
                  onChange={(v) => {
                    setState('draft', 'issueDate', v);
                    setState('draft', 'description', dashboardStore.buildStrongTemplate({ ...state.draft, issueDate: v }));
                  }}
                  required
                />

                <Show when={state.draft.docType === 'COMPLETION' || state.draft.docType === 'QUALIFICATION'}>
                  <DatePickerField
                    id="expiry-date"
                    label={state.draft.docType === 'QUALIFICATION' ? 'Recertification / Expiry Date (Optional)' : 'Expiry Date (Optional)'}
                    value={state.draft.expiryDate || ''}
                    onChange={(v) => {
                      setState('draft', 'expiryDate', v || null);
                      setState('draft', 'description', dashboardStore.buildStrongTemplate({
                        ...state.draft,
                        expiryDate: v || null,
                      }));
                    }}
                  />
                </Show>
              </div>

              {/* Citation Description */}
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div>
                    <TextFieldLabel>Citation Statement *</TextFieldLabel>
                    <span class="text-[10px] text-muted-foreground ml-2">Connects directly after recipient name on parchment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const strongText = dashboardStore.buildStrongTemplate(state.draft);
                      setState('draft', 'description', strongText);
                    }}
                    class="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>⚡ Reset to Strong Formula</span>
                  </button>
                </div>
                <TextFieldTextArea
                  rows="3"
                  required
                  value={state.draft.description}
                  onInput={(e) => setState('draft', 'description', e.currentTarget.value)}
                  placeholder="Official decree statement..."
                  class="font-normal text-xs leading-relaxed"
                />
              </div>


              <SignatoryFields
                signatory1Name={state.draft.signatory1Name}
                signatory1Title={state.draft.signatory1Title}
                signatory2Name={state.draft.signatory2Name}
                signatory2Title={state.draft.signatory2Title}
                onUpdate={(field, val) => setState('draft', field, val)}
              />


              <Button
                type="submit"
                disabled={isSubmitting() || issueCert.isPending || updateCert.isPending}
                variant="default"
                size="lg"
                class="w-full text-xs font-semibold h-10 mt-6 gap-2 transition-[filter,background-color,transform] duration-150 ease-out"
              >
                <Show
                  when={isSubmitting() || issueCert.isPending || updateCert.isPending}
                  fallback={
                    <span class="transition-[filter,opacity] duration-180 ease-out">
                      {isEditing() ? 'Update & Re-sign Certificate to Ledger' : 'Sign & Issue Certificate to Ledger'}
                    </span>
                  }
                >
                  <span class="inline-flex items-center gap-2 transition-[filter,opacity] duration-180 ease-out">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>
                      {isEditing()
                        ? 'Cryptographically Re-signing & Updating Ledger...'
                        : 'Cryptographically Signing & Writing to Ledger...'}
                    </span>
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
