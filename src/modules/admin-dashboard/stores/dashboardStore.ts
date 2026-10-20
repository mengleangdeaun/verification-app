import { createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { CertificateRecord, CertificateStatus, CreateCertificateInput, DocumentType } from '../../../types/certificates';
import type { PaperOrientation, PaperSize, TemplateId } from '../../../types/templates';

const TOKEN_KEY = 'ledger_admin_api_token';

function getInitialToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    if (key) {
      sessionStorage.setItem(TOKEN_KEY, key);
      return key;
    }
  } catch {}
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export const initialDraft: CreateCertificateInput & {
  promotionFromRole?: string;
  promotionToRole?: string;
  promotionMerit?: string;
  appreciationEvent?: string;
  qualificationTitle?: string;
} = {
  docType: 'COMPLETION',
  recipientName: 'Deaun Mengleang',
  programTitle: 'PPF Installation Training Program',
  description: "has successfully completed the 'PPF Installation Training Program' on October 15, 2026.",
  level: 'Standard',
  issueDate: '2026-10-15',
  expiryDate: null,
  signatory1Name: 'Sok Sabay',
  signatory1Title: 'Technical Supervisor',
  signatory2Name: 'Saing Dararith',
  signatory2Title: 'Managing Director',
  templateId: 'classic-diploma',
  paperSize: 'A4',
  orientation: 'landscape',
  promotionFromRole: 'L0 Intern',
  promotionToRole: 'L1 Junior Technician',
  promotionMerit: 'proven technical capabilities and growth within the company',
  appreciationEvent: 'Autoshow Expo',
  qualificationTitle: 'PPF Master Installer & Surface Specialist',
};

function formatReadableDate(dateStr: string): string {
  if (!dateStr) return 'today';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  } catch {}
  return dateStr;
}

export function buildStrongTemplate(draft: typeof initialDraft): string {
  const type = draft.docType || 'COMPLETION';
  const dateFormatted = formatReadableDate(draft.issueDate);
  const expiryFormatted = draft.expiryDate ? formatReadableDate(draft.expiryDate) : null;
  const expirySuffix = expiryFormatted ? `, valid until ${expiryFormatted}` : '';

  if (type === 'QUALIFICATION') {
    const qual = draft.qualificationTitle?.trim() || draft.programTitle.trim() || 'PPF Master Installer & Surface Specialist';
    return `has fulfilled all qualification standards and is officially certified as '${qual}' on ${dateFormatted}${expirySuffix}.`;
  }

  if (type === 'APPRECIATION') {
    const event = draft.appreciationEvent?.trim() || draft.programTitle.trim() || 'Autoshow Expo';
    return `on ${dateFormatted}, in sincere appreciation for your exceptional dedication and outstanding support during the ${event}. Your hard work was instrumental to our team's success.`;
  }

  if (type === 'PROMOTION') {
    const fromRole = draft.promotionFromRole?.trim() || 'L0 Intern';
    const toRole = draft.promotionToRole?.trim() || 'L1 Junior Technician';
    const merit = draft.promotionMerit?.trim() || 'proven technical capabilities and growth within the company';
    return `has been promoted from ${fromRole} to ${toRole}, effective ${dateFormatted}, in recognition of your ${merit}.`;
  }

  // COMPLETION
  const program = draft.programTitle.trim() || 'PPF Installation Training Program';
  return `has successfully completed the '${program}' on ${dateFormatted}${expirySuffix}.`;
}

function createDashboardStore() {
  const [state, setState] = createStore({
    adminToken: getInitialToken(),
    selectedCert: null as CertificateRecord | null,
    editingCertId: null as string | null,
    editingCertStatus: 'ACTIVE' as CertificateStatus,
    activeTemplateId: 'classic-diploma' as TemplateId,
    paperSize: 'A4' as PaperSize,
    orientation: 'landscape' as PaperOrientation,
    includeSignaturesOnPrint: false,
    searchFilter: '',
    docTypeFilter: 'ALL' as 'ALL' | DocumentType,
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

  const setDocType = (type: DocumentType) => {
    setState('draft', 'docType', type);
    // Apply smart layout defaults based on document nature
    if (type === 'COMPLETION') {
      setState('orientation', 'landscape');
      setState('draft', 'orientation', 'landscape');
      if (state.draft.programTitle.includes('→') || state.draft.programTitle === 'Autoshow Expo' || state.draft.programTitle.includes('Master')) {
        setState('draft', 'programTitle', 'PPF Installation Training Program');
      }
      setState('draft', 'issueDate', '2026-10-15');
    } else if (type === 'QUALIFICATION') {
      setState('orientation', 'landscape');
      setState('draft', 'orientation', 'landscape');
      setState('draft', 'programTitle', state.draft.qualificationTitle || 'PPF Master Installer & Surface Specialist');
      setState('draft', 'issueDate', '2026-10-20');
    } else if (type === 'APPRECIATION') {
      setState('orientation', 'portrait');
      setState('draft', 'orientation', 'portrait');
      setState('draft', 'programTitle', 'Autoshow Expo');
      setState('draft', 'issueDate', '2026-10-20');
    } else if (type === 'PROMOTION') {
      setState('orientation', 'portrait');
      setState('draft', 'orientation', 'portrait');
      setState('draft', 'programTitle', `${state.draft.promotionFromRole || 'L0 Intern'} → ${state.draft.promotionToRole || 'L1 Junior Technician'}`);
      setState('draft', 'issueDate', '2026-11-01');
    }
    // Update description immediately to match selected document context
    setState('draft', 'description', buildStrongTemplate({ ...state.draft, docType: type }));
  };


  const selectCertForPrint = (cert: CertificateRecord) => {
    setState({
      selectedCert: cert,
      activeTemplateId: cert.templateId,
      paperSize: cert.paperSize,
      orientation: cert.orientation,
    });
  };

  const loadCertForEdit = (cert: CertificateRecord) => {
    const docType = cert.docType || 'COMPLETION';
    setState({
      selectedCert: null, // Clear static preview so live canvas renders draft updates
      editingCertId: cert.id,
      editingCertStatus: cert.status,
      activeTemplateId: cert.templateId,
      paperSize: cert.paperSize,
      orientation: cert.orientation,
      draft: {
        docType,
        recipientName: cert.recipientName,
        programTitle: cert.programTitle,
        description: cert.description,
        level: cert.level,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate || null,
        signatory1Name: cert.signatory1Name,
        signatory1Title: cert.signatory1Title,
        signatory2Name: cert.signatory2Name || null,
        signatory2Title: cert.signatory2Title || null,
        templateId: cert.templateId,
        paperSize: cert.paperSize,
        orientation: cert.orientation,
        promotionFromRole: 'L0 Intern',
        promotionToRole: cert.programTitle.includes('→') ? cert.programTitle.split('→')[1]?.trim() : cert.programTitle,
        promotionMerit: 'proven technical capabilities and growth within the company',
        appreciationEvent: cert.programTitle,
      },
    });

  };

  const cancelEdit = () => {
    setState({
      editingCertId: null,
      draft: { ...initialDraft },
    });
  };

  const resetDraft = () => {
    setState({
      editingCertId: null,
      draft: { ...initialDraft },
    });
  };

  return { state, setState, setToken, setDocType, selectCertForPrint, loadCertForEdit, cancelEdit, resetDraft, buildStrongTemplate };
}

export const dashboardStore = createRoot(createDashboardStore);


