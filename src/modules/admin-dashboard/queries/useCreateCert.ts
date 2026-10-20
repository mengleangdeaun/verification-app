import { createMutation, useQueryClient } from '@tanstack/solid-query';
import type { CertificateRecord, CreateCertificateInput } from '../../../types/certificates';
import { dashboardStore } from '../stores/dashboardStore';
import { apiUrl } from '../../../utils/paths';

export function useCreateCert() {
  const queryClient = useQueryClient();

  const issueCert = createMutation(() => ({
    mutationFn: async (payload: CreateCertificateInput): Promise<CertificateRecord> => {
      const res = await fetch(apiUrl('/api/create'), {
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

  const updateCert = createMutation(() => ({
    mutationFn: async (payload: CertificateRecord | (CreateCertificateInput & { id: string; status?: string })): Promise<CertificateRecord> => {
      const res = await fetch(apiUrl('/api/create'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dashboardStore.state.adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Update failed with HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (updatedCert) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      if (dashboardStore.state.selectedCert?.id === updatedCert.id) {
        dashboardStore.selectCertForPrint(updatedCert);
      }
    },
  }));

  const updateStatus = createMutation(() => ({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'REVOKED' }) => {
      const res = await fetch(apiUrl('/api/create'), {
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

  const deleteCert = createMutation(() => ({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(apiUrl('/api/create'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dashboardStore.state.adminToken}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed with HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      if (dashboardStore.state.selectedCert?.id === id) {
        dashboardStore.setState('selectedCert', null);
      }
    },
  }));

  return { issueCert, updateCert, updateStatus, deleteCert };
}
