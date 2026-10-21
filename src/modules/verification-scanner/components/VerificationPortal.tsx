import { createSignal } from 'solid-js';
import { appPath } from '../../../utils/paths';

interface Props {
  initialId?: string;
  initialSig?: string;
  defaultMode?: 'camera' | 'manual';
}

export default function VerificationPortal(props: Props) {
  const getInitialMode = (): 'camera' | 'manual' => {
    if (props.defaultMode) return props.defaultMode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'manual') return 'manual';
    }
    return 'camera';
  };

  const [mode, setMode] = createSignal<'camera' | 'manual'>(getInitialMode());
  const [id, setId] = createSignal(props.initialId || '');
  const [sig, setSig] = createSignal(props.initialSig || '');
  let cameraInputRef: HTMLInputElement | undefined;

  const handleTriggerCamera = () => {
    if (cameraInputRef) {
      cameraInputRef.click();
    }
  };

  // Proactive Validation Rules (Matches server-side validateVerificationParams)
  const isIdValid = () => {
    const val = id().trim();
    if (!val) return false;
    return /^(CERT|COQ|LOA|LOP|[A-Za-z]{2,6})-\d{4}-[A-Za-z0-9]{4,16}$/.test(val);
  };

  const isSigValid = () => {
    const val = sig().trim();
    if (!val) return false;
    return /^[A-Za-z0-9_-]{80,90}$/.test(val);
  };

  const isFormValid = () => isIdValid() && isSigValid();

  return (
    <div class="space-y-6">
      {/* Method Selection Segmented Tabs */}
      <div class="inline-flex w-full p-1 bg-muted/60 border border-border">
        <button
          type="button"
          onClick={() => setMode('camera')}
          class={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all cursor-pointer select-none ${
            mode() === 'camera'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Camera Scan</span>
          <span class="text-[10px] font-medium opacity-80 hidden xs:inline">(Default)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('manual')}
          class={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all cursor-pointer select-none ${
            mode() === 'manual'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Manual Input</span>
        </button>
      </div>

      {/* Hidden Native Device Camera Trigger for Mobile Browsers */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        aria-hidden="true"
      />

      {/* OPTION 1: Camera Scanner View */}
      {mode() === 'camera' && (
        <div class="space-y-6">
          {/* Visual Camera Viewfinder Reticle */}
          <div class="relative w-full aspect-4/3 max-h-[260px] bg-muted/30 border border-border/80 flex flex-col items-center justify-center p-6 overflow-hidden select-none">
            {/* Viewfinder Corner Framing Crosshairs */}
            <div class="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary/70"></div>
            <div class="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary/70"></div>
            <div class="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary/70"></div>
            <div class="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary/70"></div>

            {/* Central Animated QR Scanner Icon */}
            <div class="relative flex items-center justify-center w-20 h-20 mb-3">
              <svg class="w-20 h-20 text-primary/80" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h6v6H4zm16 0v6h-6V4zm-6 11h2v-2h-2v-2h2v2h2v-2h2v2h-2v2h2v3h-2v2h-2v-2h-3v2h-2v-4h3zm2 0v3h2v-3zM4 20v-6h6v6zM6 6v2h2V6zm10 0v2h2V6zM6 16v2h2v-2zm-2-5h2v2H4zm5 0h4v4h-2v-2H9zm2-5h2v4h-2zM2 2v4H0V2a2 2 0 0 1 2-2h4v2zm20-2a2 2 0 0 1 2 2v4h-2V2h-4V0zM2 18v4h4v2H2a2 2 0 0 1-2-2v-4zm20 4v-4h2v4a2 2 0 0 1-2 2h-4v-2Z"/></svg>
              {/* Subtle Scanning Laser Pulse */}
              <div class="absolute inset-x-0 h-0.5 bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            </div>

            <p class="text-xs sm:text-sm font-semibold text-foreground text-center">
              Scan Certificate QR Code
            </p>
            <p class="text-[11px] text-muted-foreground text-center mt-1 max-w-xs">
              Point your smartphone camera at the QR code printed on the official certificate.
            </p>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={handleTriggerCamera}
            class="w-full h-11 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xs cursor-pointer select-none"
          >
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Open Phone Camera to Scan</span>
          </button>

          {/* Step-by-Step Guidance */}
          <div class="border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              How to verify with your phone:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/80">
              <div class="flex items-start gap-2">
                <span class="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>Open your built-in Camera app or tap the button above.</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>Tap the verification link that appears on your screen.</span>
              </div>
            </div>
          </div>

          {/* Switch to Manual Entry Link */}
          <div class="text-center pt-1">
            <button
              type="button"
              onClick={() => setMode('manual')}
              class="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline transition-colors cursor-pointer"
            >
              Prefer to enter certificate code manually? &rarr;
            </button>
          </div>
        </div>
      )}

      {/* OPTION 2: Manual Input View with Proactive Format Guard & Reactive Button Disabling */}
      {mode() === 'manual' && (
        <form action={appPath('/check')} method="get" class="space-y-4">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for="id" class="block text-xs font-semibold text-foreground">
                Document / Certificate Identifier
              </label>
              {isIdValid() && (
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  Valid format
                </span>
              )}
            </div>
            <input
              id="id"
              name="id"
              type="text"
              required
              value={id()}
              onInput={(e) => setId(e.currentTarget.value)}
              placeholder="e.g. CERT-2026-446A4D9A or LOA-2026-8F92A1"
              class={`w-full h-10 px-3.5 border bg-background font-mono tabular-nums text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${
                id().length > 0 && !isIdValid()
                  ? 'border-amber-500/70 focus:ring-amber-500'
                  : 'border-input focus:ring-ring'
              }`}
            />
            {id().length > 0 && !isIdValid() && (
              <p class="text-[10.5px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <span>Format: CERT-, LOA-, LOP- followed by year & code</span>
              </p>
            )}
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for="sig" class="block text-xs font-semibold text-foreground">
                Verification Signature
              </label>
              <div class="flex items-center gap-1">
                {isSigValid() ? (
                  <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Valid signature
                  </span>
                ) : (
                  <span class="text-[10px] text-muted-foreground">86-char security code</span>
                )}
              </div>
            </div>
            <input
              id="sig"
              name="sig"
              type="text"
              required
              value={sig()}
              onInput={(e) => setSig(e.currentTarget.value)}
              placeholder="Paste signature code from certificate..."
              class={`w-full h-10 px-3.5 border bg-background font-mono tabular-nums text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${
                sig().length > 0 && !isSigValid()
                  ? 'border-amber-500/70 focus:ring-amber-500'
                  : 'border-input focus:ring-ring'
              }`}
            />
            {sig().length > 0 && !isSigValid() && (
              <p class="text-[10.5px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <span>Signature must be a valid 86-character verification code</span>
              </p>
            )}
          </div>

          {/* Proactive Bot Honeypot Input */}
          <input
            type="text"
            name="_hp_check"
            tabindex="-1"
            autocomplete="off"
            class="hidden absolute opacity-0 pointer-events-none"
            aria-hidden="true"
          />

          <button
            type="submit"
            disabled={!isFormValid()}
            class={`w-full h-11 mt-2 inline-flex items-center justify-center gap-2 font-semibold text-xs transition-all select-none ${
              isFormValid()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-xs cursor-pointer'
                : 'bg-muted text-muted-foreground/60 border border-input cursor-not-allowed opacity-50'
            }`}
          >
            <svg class={`w-4 h-4 shrink-0 ${isFormValid() ? 'text-emerald-400' : 'text-muted-foreground/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{isFormValid() ? 'Verify Authenticity' : 'Enter Valid Certificate Info to Verify'}</span>
          </button>

          {/* Switch Back to Camera Scan Link */}
          <div class="text-center pt-2">
            <button
              type="button"
              onClick={() => setMode('camera')}
              class="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline transition-colors cursor-pointer"
            >
              &larr; Have the QR code? Scan with camera
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
