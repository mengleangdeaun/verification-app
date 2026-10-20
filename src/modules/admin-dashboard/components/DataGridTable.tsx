import { createSignal, createEffect, For, Show } from 'solid-js';
import { useQueryClient } from '@tanstack/solid-query';
import type { CertificateRecord } from '../../../types/certificates';
import { dashboardStore } from '../stores/dashboardStore';
import { useCreateCert } from '../queries/useCreateCert';
import { useFetchCerts } from '../queries/useFetchCerts';
import TablePaginationBar from './TablePaginationBar';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Card, CardHeader, CardContent } from '@/components/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/tooltip';
import { TextField, TextFieldInput } from '@/components/text-field';

interface Props {
  onSelectForPrint?: (cert: CertificateRecord) => void;
  onNewCertClick?: () => void;
  onEditCertClick?: (cert: CertificateRecord) => void;
}

export default function DataGridTable(props: Props) {
  const { state, setState, selectCertForPrint } = dashboardStore;
  const [page, setPage] = createSignal(1);
  const [pageSize, setPageSize] = createSignal(10);
  const [statusFilter, setStatusFilter] = createSignal<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');
  const [debouncedSearch, setDebouncedSearch] = createSignal(state.searchFilter);
  const [copiedId, setCopiedId] = createSignal<string | null>(null);
  const [revokeTarget, setRevokeTarget] = createSignal<CertificateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = createSignal<CertificateRecord | null>(null);

  // 300ms Debounce search input to avoid spamming the database
  let debounceTimer: any;
  createEffect(() => {
    const raw = state.searchFilter;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setDebouncedSearch(raw);
      setPage(1);
    }, 300);
  });

  const handleStatusFilterChange = (st: 'ALL' | 'ACTIVE' | 'REVOKED') => {
    setStatusFilter(st);
    setPage(1);
  };

  const certsQuery = useFetchCerts({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
  });

  const { updateStatus, deleteCert } = useCreateCert();
  const queryClient = useQueryClient();

  // Prefetch Next Page into TanStack Query Cache for Instant Pagination
  createEffect(() => {
    const data = certsQuery.data;
    const curPage = page();
    const token = dashboardStore.state.adminToken;
    if (data && curPage < data.totalPages && token) {
      const nextPage = curPage + 1;
      const params = new URLSearchParams({
        list: 'true',
        page: String(nextPage),
        pageSize: String(pageSize()),
        search: debouncedSearch(),
        status: statusFilter(),
      });
      void queryClient
        .query({
          queryKey: ['certificates', token, nextPage, pageSize(), debouncedSearch(), statusFilter()],
          queryFn: async () => {
            const res = await fetch(`/api/verify?${params.toString()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          },
          staleTime: 2 * 60 * 1000,
        })
        .catch(() => {});
    }
  });

  const queryData = () => certsQuery.data;
  const certs = () => queryData()?.records || [];
  const metrics = () => queryData()?.metrics || { total: 0, active: 0, revoked: 0 };
  const total = () => queryData()?.total || 0;
  const totalPages = () => queryData()?.totalPages || 1;

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmStatusChange = async () => {
    const cert = revokeTarget();
    if (!cert) return;
    const nextStatus = cert.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    await updateStatus.mutateAsync({ id: cert.id, status: nextStatus });
    setRevokeTarget(null);
  };

  const handleConfirmDelete = async () => {
    const cert = deleteTarget();
    if (!cert) return;
    await deleteCert.mutateAsync({ id: cert.id });
    setDeleteTarget(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div class="space-y-6">
      {/* Enterprise KPI Cards built with Solid UI Card */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card class="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Credentials</span>
            <div class="h-8 w-8 bg-secondary flex items-center justify-center text-foreground">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold font-mono tabular-nums tracking-tight text-foreground">{metrics().total}</div>
            <p class="text-[11px] text-muted-foreground mt-1">Total certificates signed into ledger</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active & Valid</span>
            <div class="h-8 w-8 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-600">{metrics().active}</div>
            <p class="text-[11px] text-muted-foreground mt-1">Cryptographically authentic credentials</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revoked Records</span>
            <div class="h-8 w-8 bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold font-mono tabular-nums tracking-tight text-rose-600">{metrics().revoked}</div>
            <p class="text-[11px] text-muted-foreground mt-1">Formally invalidated credentials</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card using Solid UI Card and Table */}
      <Card class="shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div class="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card">
          <div class="flex items-center gap-3">
            {/* Filter Pills with Tactile Scale */}
            <div class="inline-flex bg-muted p-1 text-xs font-medium border border-border">
              {(['ALL', 'ACTIVE', 'REVOKED'] as const).map((st) => (
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange(st)}
                  class={`px-3 py-1 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
                    statusFilter() === st
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Revoked'}
                </button>
              ))}
            </div>

            <div class="text-xs text-muted-foreground font-mono">
              {total()} credentials found
            </div>
          </div>

          <div class="flex items-center gap-3">
            {/* Search Input */}
            <TextField class="relative w-full sm:w-64">
              <svg class="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <TextFieldInput
                type="text"
                placeholder="Search recipient, ID, course..."
                value={state.searchFilter}
                onInput={(e) => setState('searchFilter', e.currentTarget.value)}
                class="pl-9 pr-4 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background"
              />
            </TextField>

            {/* Refresh Ledger Button */}
            <Tooltip position="bottom">
              <TooltipTrigger
                as={Button}
                variant="outline"
                size="sm"
                onClick={() => certsQuery.refetch()}
                disabled={certsQuery.isFetching}
                class="gap-1.5 text-xs h-9 px-3"
              >
                <svg
                  class={`w-3.5 h-3.5 text-muted-foreground ${certsQuery.isFetching ? 'animate-spin text-primary' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh</span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sync ledger records from Neon PostgreSQL</TooltipContent>
            </Tooltip>

            {props.onNewCertClick && (
              <Button variant="default" size="sm" onClick={props.onNewCertClick} class="gap-1.5 text-xs h-9">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Issue Certificate
              </Button>
            )}
          </div>
        </div>

        {/* Solid UI Table */}
        <Table>
          <TableHeader class="bg-muted/40">
            <TableRow>
              <TableHead class="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider">Certificate ID</TableHead>
              <TableHead class="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider">Recipient</TableHead>
              <TableHead class="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider">Program & Level</TableHead>
              <TableHead class="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider">Issue Date</TableHead>
              <TableHead class="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead class="py-3 px-5 text-right text-[11px] font-semibold uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              when={!certsQuery.isLoading}
              fallback={
                <TableRow>
                  <TableCell colSpan={6} class="py-12 text-center text-muted-foreground">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Loading certificates from ledger...</span>
                    </div>
                  </TableCell>
                </TableRow>
              }
            >
              <Show
                when={!certsQuery.isError}
                fallback={
                  <TableRow>
                    <TableCell colSpan={6} class="py-14 text-center">
                      <div class="max-w-md mx-auto p-5 bg-rose-50 border border-rose-200 text-rose-900 space-y-3 shadow-xs">
                        <div class="flex items-center justify-center gap-2 font-semibold text-sm text-rose-700">
                          <svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>{certsQuery.error?.message || 'Failed to communicate with ledger endpoint'}</span>
                        </div>
                        <p class="text-xs text-rose-600">
                          The current access key may be expired or rejected by the server. Re-authenticate to resume registry operations.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => dashboardStore.setToken('')}
                          class="text-xs font-semibold"
                        >
                          Re-authenticate with Master Key
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                }
              >
                <For
                  each={certs()}
                  fallback={
                    <TableRow>
                      <TableCell colSpan={6} class="py-16 text-center text-muted-foreground">
                        <div class="max-w-xs mx-auto space-y-2">
                          <div class="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p class="font-medium text-foreground">No certificates found</p>
                          <p class="text-xs text-muted-foreground">No records match the active filter criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                >
                  {(cert) => (
                  <TableRow class="hover:bg-muted/40 transition-colors">
                    {/* ID with Copy */}
                    <TableCell class="py-3.5 px-5 font-mono text-xs font-semibold">
                      <div class="flex items-center gap-2">
                        <span class="bg-muted px-2 py-0.5 border border-border text-foreground">
                          {cert.id}
                        </span>
                        <Tooltip position="right">
                          <TooltipTrigger
                            as="button"
                            type="button"
                            onClick={() => handleCopyId(cert.id)}
                            class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {copiedId() === cert.id ? (
                              <span class="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            ) : (
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </TooltipTrigger>
                          <TooltipContent side="right">{copiedId() === cert.id ? 'Copied to clipboard!' : 'Copy Certificate ID'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Recipient */}
                    <TableCell class="py-3.5 px-5">
                      <div class="flex items-center gap-2.5">
                        <div class="h-7 w-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-[10px] shrink-0 border border-border">
                          {getInitials(cert.recipientName)}
                        </div>
                        <span class="font-semibold text-foreground">{cert.recipientName}</span>
                      </div>
                    </TableCell>

                    {/* Program & Level */}
                    <TableCell class="py-3.5 px-5">
                      <div class="font-medium text-foreground">{cert.programTitle}</div>
                      <span class="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-muted text-muted-foreground font-medium border border-border">
                        {cert.level}
                      </span>
                    </TableCell>

                    {/* Issue Date */}
                    <TableCell class="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                      {cert.issueDate}
                    </TableCell>

                    {/* Status with Solid UI Badge */}
                    <TableCell class="py-3.5 px-5">
                      <Badge
                        variant={cert.status === 'ACTIVE' ? 'success' : 'error'}
                        class="gap-1.5"
                      >
                        <span class={`h-1.5 w-1.5 rounded-full ${cert.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {cert.status}
                      </Badge>
                    </TableCell>

                    {/* Actions with Solid UI Button & Kobalte Tooltips */}
                    <TableCell class="py-3 px-5 text-center align-middle">
                      <div class="flex items-center justify-end gap-1.5">
                        <Tooltip position="top">
                          <TooltipTrigger
                            as={Button}
                            variant="outline"
                            size="xs"
                            class="font-semibold gap-1"
                            onClick={() => {
                              selectCertForPrint(cert);
                              if (props.onSelectForPrint) props.onSelectForPrint(cert);
                            }}
                          >
                            <svg class="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Preview</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Open live print canvas preview</TooltipContent>
                        </Tooltip>

                        <Tooltip position="top">
                          <TooltipTrigger
                            as={Button}
                            variant="outline"
                            size="xs"
                            class="font-medium gap-1 text-foreground hover:bg-muted"
                            onClick={() => {
                              dashboardStore.loadCertForEdit(cert);
                              if (props.onEditCertClick) props.onEditCertClick(cert);
                            }}
                          >
                            <svg class="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Edit in studio with live preview</TooltipContent>
                        </Tooltip>

                        <Button
                          variant={cert.status === 'ACTIVE' ? 'destructive' : 'outline'}
                          size="xs"
                          class="font-medium"
                          disabled={updateStatus.isPending}
                          onClick={() => setRevokeTarget(cert)}
                        >
                          {cert.status === 'ACTIVE' ? 'Revoke' : 'Restore'}
                        </Button>

                        <Tooltip position="top">
                          <TooltipTrigger
                            as="a"
                            href={cert.verificationUrl}
                            target="_blank"
                            rel="noreferrer"
                            class="inline-flex items-center h-8 gap-1 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-input transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97]"
                          >
                            <span>Verify</span>
                            <svg class="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent side="left">Open public view in new tab</TooltipContent>
                        </Tooltip>

                        <Tooltip position="top">
                          <TooltipTrigger
                            as={Button}
                            variant="ghost"
                            size="xs"
                            class="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                            onClick={() => setDeleteTarget(cert)}
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent side="top">Delete from ledger</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </Show>
          </Show>
        </TableBody>
        </Table>

        {/* Server-Side Pagination Bar */}
        <Show when={!certsQuery.isError && total() > 0}>
          <TablePaginationBar
            page={page()}
            pageSize={pageSize()}
            total={total()}
            totalPages={totalPages()}
            isFetching={certsQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </Show>
      </Card>

      {/* Accessible Kobalte Confirmation Dialog for Revoke/Restore */}
      <AlertDialog open={!!revokeTarget()} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revokeTarget()?.status === 'ACTIVE' ? 'Revoke Certificate Credential?' : 'Restore Certificate Credential?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget()?.status === 'ACTIVE' ? (
                <span>
                  Are you sure you want to revoke certificate <strong class="font-mono text-foreground">{revokeTarget()?.id}</strong> issued to <strong class="text-foreground">{revokeTarget()?.recipientName}</strong>? Anyone verifying this document will immediately see a revocation warning.
                </span>
              ) : (
                <span>
                  Restore certificate <strong class="font-mono text-foreground">{revokeTarget()?.id}</strong> issued to <strong class="text-foreground">{revokeTarget()?.recipientName}</strong> back to ACTIVE status in the official ledger?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={revokeTarget()?.status === 'ACTIVE' ? 'destructive' : 'default'}
              size="sm"
              disabled={updateStatus.isPending}
              onClick={handleConfirmStatusChange}
            >
              {updateStatus.isPending
                ? 'Updating Ledger...'
                : revokeTarget()?.status === 'ACTIVE'
                ? 'Confirm Revocation'
                : 'Confirm Restoration'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accessible Kobalte Confirmation Dialog for Permanent Deletion */}
      <AlertDialog open={!!deleteTarget()} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle class="text-destructive flex items-center gap-2">
              <svg class="w-5 h-5 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Permanently Delete Certificate?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete certificate <strong class="font-mono text-foreground">{deleteTarget()?.id}</strong> issued to <strong class="text-foreground">{deleteTarget()?.recipientName}</strong>?
              <br /><br />
              <span class="text-rose-600 font-semibold">This action cannot be undone.</span> The cryptographic record will be permanently purged from the database and public verification will return <em>RECORD_NOT_FOUND</em>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteCert.isPending}
              onClick={handleConfirmDelete}
            >
              {deleteCert.isPending ? 'Purging from Ledger...' : 'Delete Permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
