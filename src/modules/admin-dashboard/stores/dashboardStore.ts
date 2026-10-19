import { createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { CertificateRecord, CreateCertificateInput } from '../../../types/certificates';
import type { PaperOrientation, PaperSize, TemplateId } from '../../../types/templates';

const TOKEN_KEY = 'ledger_admin_api_token';

function getInitialToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export const initialDraft: CreateCertificateInput = {
  recipientName: '',
  programTitle: '',
  description: '',
  level: 'Professional Mastery',
  issueDate: new Date().toISOString().split('T')[0],
  expiryDate: null,
  signatory1Name: 'Sok Sabay',
  signatory1Title: 'Technicial Supervisor',
  signatory2Name: 'Saing Dararith',
  signatory2Title: 'Managing Director',
  templateId: 'classic-diploma',
  paperSize: 'A4',
  orientation: 'landscape',
};

function createDashboardStore() {
  const [state, setState] = createStore({
    adminToken: getInitialToken(),
    selectedCert: null as CertificateRecord | null,
    activeTemplateId: 'classic-diploma' as TemplateId,
    paperSize: 'A4' as PaperSize,
    orientation: 'landscape' as PaperOrientation,
    includeSignaturesOnPrint: false,
    searchFilter: '',
    draft: { ...initialDraft },
    activeTab: 'create' as 'create' | 'records',
  });

  const setToken = (tok: string) => {
    setState('adminToken', tok);
    if (typeof window !== 'undefined') {
      if (tok) sessionStorage.setItem(TOKEN_KEY, tok);
      else sessionStorage.removeItem(TOKEN_KEY);
    }
  };

  const selectCertForPrint = (cert: CertificateRecord) => {
    setState({
      selectedCert: cert,
      activeTemplateId: cert.templateId,
      paperSize: cert.paperSize,
      orientation: cert.orientation,
    });
  };

  const resetDraft = () => setState('draft', { ...initialDraft });

  return { state, setState, setToken, selectCertForPrint, resetDraft };
}

export const dashboardStore = createRoot(createDashboardStore);
