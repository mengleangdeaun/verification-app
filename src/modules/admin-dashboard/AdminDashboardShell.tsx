import { createSignal, Show } from 'solid-js';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { dashboardStore } from './stores/dashboardStore';
import CreateCertForm from './components/CreateCertForm';
import DataGridTable from './components/DataGridTable';
import TemplatePicker from './components/TemplatePicker';
import PrintablePaper from '../certificate-printer/components/PrintablePaper';
import { triggerCertificatePrint } from '../certificate-printer/utils/printTrigger';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes caching: keeps data fresh and eliminates redundant re-requests
      gcTime: 10 * 60 * 1000, // 10 minutes cache retention
      refetchOnWindowFocus: false, // Prevents aggressive network spam when switching browser tabs
      refetchOnReconnect: true,
      retry: false,
    },
  },
});

export default function AdminDashboardShell() {
  const { state, setToken, setState } = dashboardStore;
  const [tokenInput, setTokenInput] = createSignal('');
  const [activeTab, setActiveTab] = createSignal<'registry' | 'studio'>('registry');
  const [loginError, setLoginError] = createSignal<string | null>(null);
  const [isVerifyingKey, setIsVerifyingKey] = createSignal(false);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    const entered = tokenInput().trim();
    if (!entered) return;

    setLoginError(null);
    setIsVerifyingKey(true);

    try {
      const res = await fetch('/api/verify?list=true&page=1&pageSize=1', {
        headers: { Authorization: `Bearer ${entered}` },
      });

      if (res.status === 401) {
        setLoginError('Invalid Master Admin Secret Key. Access denied.');
        setIsVerifyingKey(false);
        return;
      }

      if (!res.ok) {
        setLoginError(`Authentication check failed (HTTP ${res.status}).`);
        setIsVerifyingKey(false);
        return;
      }

      setToken(entered);
    } catch (err: any) {
      setLoginError(err?.message || 'Network error connecting to verification gateway.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handlePrint = () => {
    triggerCertificatePrint(state.paperSize, state.orientation);
  };

  const previewData = () => state.selectedCert || state.draft;

  return (
    <QueryClientProvider client={queryClient}>
      <Show
        when={state.adminToken}
        fallback={
          <div class="min-h-screen bg-slate-50/80 flex items-center justify-center p-4">
            <Card class="w-full max-w-md border-border">
              <CardHeader class="text-center pb-4">
                <div class="h-16 w-16 mx-auto mb-3 p-2 bg-white border border-border shadow-xs flex items-center justify-center">
                  <img src="/assets/logo.svg" alt="Emblem" class="h-12 w-12 object-contain" />
                </div>
                <CardTitle class="text-xl font-bold font-serif text-foreground">Registrar Authorization</CardTitle>
                <CardDescription>Enter Master Admin API Secret to unlock ledger operations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} class="space-y-4">
                  <Show when={loginError()}>
                    <div class="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <svg class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p class="font-semibold">{loginError()}</p>
                        <p class="text-[11px] text-rose-600 mt-0.5">Please check ADMIN_API_SECRET in your configuration.</p>
                      </div>
                    </div>
                  </Show>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-foreground">Master Access Key</label>
                    <input
                      type="password"
                      placeholder="Enter ADMIN_API_SECRET..."
                      value={tokenInput()}
                      onInput={(e) => {
                        setTokenInput(e.currentTarget.value);
                        if (loginError()) setLoginError(null);
                      }}
                      class="w-full h-10 px-3.5 text-xs font-mono bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-[border-color,box-shadow] duration-150 ease-out"
                      required
                    />
                  </div>
                  <Button type="submit" variant="default" disabled={isVerifyingKey()} class="w-full h-10 font-semibold text-xs gap-2">
                    <Show when={isVerifyingKey()}>
                      <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    </Show>
                    <span>{isVerifyingKey() ? 'Verifying Key...' : 'Unlock Workspace'}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        }
      >
        <div class="min-h-screen bg-slate-50/50 flex flex-col font-sans">
          {/* Executive Light-Mode Header */}
          <header class="no-print bg-white/95 backdrop-blur-md border-b border-border sticky top-0 z-40 shadow-xs">
            <div class="max-w-[1600px] mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left: Branding & Status Badge */}
              <div class="flex items-center gap-3.5">
                <div class="h-10 w-10 p-1.5 bg-white border border-border shadow-xs flex items-center justify-center">
                  <img src="/assets/logo.svg" alt="Emblem" class="h-full w-full object-contain" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h1 class="text-sm font-bold text-foreground tracking-tight">Certificate Ledger</h1>
                    <Badge variant="outline" class="gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Ed25519 Active
                    </Badge>
                  </div>
                  <p class="text-[11px] text-muted-foreground">Registrar Operations & Asymmetric Ledger</p>
                </div>
              </div>

              {/* Center: Kobalte Tabs Segmented Control */}
              <Tabs
                value={activeTab()}
                onChange={(val) => setActiveTab(val as 'registry' | 'studio')}
              > 
                <TabsList class="h-9 p-1 bg-muted/80 border border-border">
                  <TabsTrigger value="registry" class="gap-2 text-xs py-1 px-3.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Ledger Registry</span>
                  </TabsTrigger>
                  <TabsTrigger value="studio" class="gap-2 text-xs py-1 px-3.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Certificate Studio</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Right: Quick Actions */}
              <div class="flex items-center">
                <Tooltip placement="left">
                  <TooltipTrigger as={Button} variant="ghost" size="sm" onClick={() => setToken('')} class="text-xs h-9 text-muted-foreground hover:text-foreground">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Lock</span>
                  </TooltipTrigger>
                  <TooltipContent>Lock registrar session</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Primary View Workspace */}
          <main class="no-print flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto">
            {/* VIEW 1: Full-Width Certificate Registry Data Table */}
            <Show when={activeTab() === 'registry'}>
              <DataGridTable
                onSelectForPrint={() => setActiveTab('studio')}
                onNewCertClick={() => setActiveTab('studio')}
              />
            </Show>

            {/* VIEW 2: Certificate Studio (Form + Live Canvas Preview) */}
            <Show when={activeTab() === 'studio'}>
              <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Side: Controls & Input Form */}
                <div class="xl:col-span-5 space-y-6">
                  <TemplatePicker />
                  <CreateCertForm />
                </div>

                {/* Right Side: Live Canvas Preview Desk */}
                <div class="xl:col-span-7 flex flex-col items-center justify-start bg-slate-200/50 p-6 border border-border shadow-inner">
                  <div class="w-full flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-foreground">Live Print Canvas Preview</span>
                      <Badge variant="outline" class="font-mono text-[10px]">
                        {state.paperSize} • {state.orientation}
                      </Badge>
                    </div>

                    <div class="flex items-center gap-2">
                      {state.selectedCert && (
                        <button
                          type="button"
                          onClick={() => setState('selectedCert', null)}
                          class="text-xs text-amber-600 hover:underline font-semibold cursor-pointer"
                        >
                          &larr; Switch Back to Current Draft
                        </button>
                      )}
                      <Button variant="default" size="sm" onClick={handlePrint} class="text-xs font-semibold">
                        Print Document
                      </Button>
                    </div>
                  </div>

                  <PrintablePaper
                    data={previewData()}
                    themeId={state.activeTemplateId}
                    paperSize={state.paperSize}
                    orientation={state.orientation}
                    includeSignatures={state.includeSignaturesOnPrint}
                    isPreview={true}
                  />
                </div>
              </div>
            </Show>
          </main>

          {/* Dedicated Window.print() Target Overlay */}
          <div class="hidden print:block">
            <PrintablePaper
              data={previewData()}
              themeId={state.activeTemplateId}
              paperSize={state.paperSize}
              orientation={state.orientation}
              includeSignatures={state.includeSignaturesOnPrint}
              isPreview={false}
            />
          </div>
        </div>
      </Show>
    </QueryClientProvider>
  );
}
