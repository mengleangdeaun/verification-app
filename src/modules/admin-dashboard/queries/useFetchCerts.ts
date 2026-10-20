import { createQuery, keepPreviousData } from '@tanstack/solid-query';
import type { DocumentType, PaginatedCertificatesResult } from '../../../types/certificates';
import { dashboardStore } from '../stores/dashboardStore';
import { apiUrl } from '../../../utils/paths';

export interface UseFetchCertsOptions {
  page?: () => number;
  pageSize?: () => number;
  search?: () => string;
  status?: () => 'ALL' | 'ACTIVE' | 'REVOKED';
  docType?: () => 'ALL' | DocumentType;
}

export function useFetchCerts(options?: UseFetchCertsOptions) {
  const page = () => options?.page?.() ?? 1;
  const pageSize = () => options?.pageSize?.() ?? 10;
  const search = () => options?.search?.() ?? '';
  const status = () => options?.status?.() ?? 'ALL';
  const docType = () => options?.docType?.() ?? 'ALL';

  return createQuery<PaginatedCertificatesResult>(() => ({
    queryKey: ['certificates', dashboardStore.state.adminToken, page(), pageSize(), search(), status(), docType()],
    queryFn: async () => {
      const token = dashboardStore.state.adminToken;
      if (!token) {
        return {
          records: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          metrics: { total: 0, active: 0, revoked: 0 },
        };
      }

      const params = new URLSearchParams({
        list: 'true',
        page: String(page()),
        pageSize: String(pageSize()),
        search: search(),
        status: status(),
        docType: docType(),
      });


      const res = await fetch(apiUrl(`/api/verify?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: Invalid or expired Admin Secret Key.');
        }
        throw new Error(`Failed to fetch certificates: HTTP ${res.status}`);
      }
      return res.json();
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(dashboardStore.state.adminToken),
    staleTime: 2 * 60 * 1000, // 2 minutes: cache remains fresh, avoiding redundant re-requests
    gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    refetchOnWindowFocus: false,
    retry: false,
  }));
}
