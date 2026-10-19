import { createMutation, useQueryClient } from '@tanstack/solid-query';
import type { CertificateRecord, CreateCertificateInput } from '../../../types/certificates';
import { dashboardStore } from '../stores/dashboardStore';

export function useCreateCert() {
  const queryClient = useQueryClient();

  const issueCert = createMutation(() => ({
    mutationFn: async (payload: CreateCertificateInput): Promise<CertificateRecord> => {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dashboardStore.state.adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Issuance failed with HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (newCert) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      dashboardStore.selectCertForPrint(newCert);
    },
  }));

  const updateStatus = createMutation(() => ({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'REVOKED' }) => {
      const res = await fetch('/api/create', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dashboardStore.state.adminToken}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Status update failed with HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  }));

  return { issueCert, updateStatus };
}
