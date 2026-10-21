import type { PaperOrientation, PaperSize, TemplateId } from './templates';

export type CertificateStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type DocumentType = 'COMPLETION' | 'QUALIFICATION' | 'APPRECIATION' | 'PROMOTION';

export interface CreateCertificateInput {
  docType?: DocumentType;
  recipientName: string;
  programTitle: string;
  description: string;
  level: string;
  issueDate: string;
  expiryDate?: string | null;
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name?: string | null;
  signatory2Title?: string | null;
  templateId: TemplateId;
  paperSize: PaperSize;
  orientation: PaperOrientation;
}

export interface UpdateCertificateInput extends Partial<CreateCertificateInput> {
  id: string;
  status?: CertificateStatus;
}

export interface CertificateRecord extends CreateCertificateInput {
  id: string;
  docType: DocumentType;
  status: CertificateStatus;
  payloadHash: string;
  signature: string;
  verificationUrl: string;
}

export type VerificationCode =
  | 'VERIFIED' | 'MISSING_PARAMS' | 'INVALID_SIGNATURE' | 'RECORD_NOT_FOUND'
  | 'DATA_TAMPERED' | 'CERTIFICATE_REVOKED' | 'CERTIFICATE_EXPIRED'
  | 'RATE_LIMITED';

export interface VerificationResult {
  valid: boolean; code: VerificationCode; timestamp: string; record?: CertificateRecord;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'REVOKED';
  docType?: 'ALL' | DocumentType;
}

export interface PaginatedCertificatesResult {
  records: CertificateRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: {
    total: number;
    active: number;
    revoked: number;
    completion?: number;
    qualification?: number;
    appreciation?: number;
    promotion?: number;
  };
}

export const buildCanonicalPayload = (d: {
  id: string;
  recipientName: string;
  programTitle: string;
  description: string;
  level: string;
  issueDate: string;
  expiryDate?: string | null;
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name?: string | null;
  signatory2Title?: string | null;
  docType?: DocumentType;
}): string => [
  'v1',
  d.id.trim(),
  d.recipientName.trim(),
  d.programTitle.trim(),
  d.description.trim(),
  d.level.trim(),
  d.issueDate.trim(),
  d.expiryDate?.trim() || 'NEVER',
  d.signatory1Name.trim(),
  d.signatory1Title.trim(),
  d.signatory2Name?.trim() || 'NONE',
  d.signatory2Title?.trim() || 'NONE',
  (d.docType || 'COMPLETION').trim(),
].join('|');

export const buildCanonicalPayloadLegacy = (d: {
  id: string;
  recipientName: string;
  programTitle: string;
  description: string;
  level: string;
  issueDate: string;
  expiryDate?: string | null;
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name?: string | null;
  signatory2Title?: string | null;
}): string => [
  'v1',
  d.id.trim(),
  d.recipientName.trim(),
  d.programTitle.trim(),
  d.description.trim(),
  d.level.trim(),
  d.issueDate.trim(),
  d.expiryDate?.trim() || 'NEVER',
  d.signatory1Name.trim(),
  d.signatory1Title.trim(),
  d.signatory2Name?.trim() || 'NONE',
  d.signatory2Title?.trim() || 'NONE',
].join('|');

