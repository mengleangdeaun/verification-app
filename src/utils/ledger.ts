import type { CertificateRecord, PaginationParams, PaginatedCertificatesResult } from '../types/certificates';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildVerificationUrl } from './paths';

const MOCK_FILE_PATH = path.resolve(process.cwd(), 'data', 'mock-ledger.json');

export interface LedgerEnv {
  DATABASE_URL?: string;
  SHEETS_PROXY_URL?: string;
  SHEETS_BEARER_TOKEN?: string;
  PUBLIC_APP_URL?: string;
}

function resolveDatabaseUrl(env?: LedgerEnv): string | undefined {
  return (
    env?.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    (typeof import.meta !== 'undefined' && import.meta.env?.DATABASE_URL?.trim()) ||
    undefined
  );
}

function resolveAppUrl(env?: LedgerEnv): string {
  return (
    env?.PUBLIC_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_APP_URL) ||
    ''
  ).replace(/\/+$/, '');
}

function mapRowToRecord(row: any, appUrl: string): CertificateRecord {
  const id = String(row.id);
  const sig = String(row.signature || '');
  const formatDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') {
      return val.split('T')[0];
    }
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(val).split('T')[0];
  };

  return {
    id,
    docType: (row.doc_type || 'COMPLETION') as any,
    recipientName: String(row.recipient_name || ''),
    programTitle: String(row.program_title || ''),
    description: String(row.description || ''),
    level: String(row.level || ''),
    issueDate: formatDate(row.issue_date) || String(row.issue_date || ''),
    expiryDate: formatDate(row.expiry_date),
    signatory1Name: String(row.signatory1_name || ''),
    signatory1Title: String(row.signatory1_title || ''),
    signatory2Name: row.signatory2_name ? String(row.signatory2_name) : null,
    signatory2Title: row.signatory2_title ? String(row.signatory2_title) : null,
    templateId: (row.template_id || 'classic-diploma') as any,
    paperSize: (row.paper_size || 'A4') as any,
    orientation: (row.orientation || 'landscape') as any,
    status: (row.status || 'ACTIVE') as any,
    payloadHash: String(row.payload_hash || ''),
    signature: sig,
    verificationUrl: buildVerificationUrl(appUrl, id, sig),
  };
}

function ensureMockStorage(): CertificateRecord[] {
  try {
    if (!fs.existsSync(MOCK_FILE_PATH)) {
      const dir = path.dirname(MOCK_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify([]), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(MOCK_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMockStorage(records: CertificateRecord[]): void {
  try {
    const dir = path.dirname(MOCK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save mock ledger:', err);
  }
}

export async function appendCertToLedger(
  record: CertificateRecord,
  env?: LedgerEnv
): Promise<void> {
  const dbUrl = resolveDatabaseUrl(env);

  // 1. Neon Postgres
  if (dbUrl) {
    const sql = neon(dbUrl);
    await sql`
      INSERT INTO certificates (
        id, doc_type, recipient_name, program_title, description, level,
        issue_date, expiry_date, signatory1_name, signatory1_title,
        signatory2_name, signatory2_title, template_id, paper_size,
        orientation, status, payload_hash, signature, created_at, updated_at
      ) VALUES (
        ${record.id},
        ${record.docType || 'COMPLETION'},
        ${record.recipientName},
        ${record.programTitle},
        ${record.description},
        ${record.level},
        ${record.issueDate},
        ${record.expiryDate || null},
        ${record.signatory1Name},
        ${record.signatory1Title},
        ${record.signatory2Name || null},
        ${record.signatory2Title || null},
        ${record.templateId},
        ${record.paperSize},
        ${record.orientation},
        ${record.status},
        ${record.payloadHash},
        ${record.signature},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        doc_type = EXCLUDED.doc_type,
        status = EXCLUDED.status,
        updated_at = NOW();
    `;
    return;
  }


  // 2. Legacy Google Sheets Proxy
  const proxyUrl = env?.SHEETS_PROXY_URL?.trim() || process.env.SHEETS_PROXY_URL?.trim();
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'APPEND_CERT',
        bearerToken: env?.SHEETS_BEARER_TOKEN || process.env.SHEETS_BEARER_TOKEN,
        payload: record,
      }),
    });
    if (!res.ok) {
      throw new Error(`Sheets proxy append failed with HTTP ${res.status}`);
    }
    return;
  }

  // 3. Local Mock JSON Fallback
  const list = ensureMockStorage();
  const existingIdx = list.findIndex((c) => c.id === record.id);
  if (existingIdx >= 0) {
    list[existingIdx] = record;
  } else {
    list.unshift(record);
  }
  saveMockStorage(list);
}

export async function updateCertStatusInLedger(
  id: string,
  status: 'ACTIVE' | 'REVOKED',
  env?: LedgerEnv
): Promise<void> {
  const dbUrl = resolveDatabaseUrl(env);

  // 1. Neon Postgres
  if (dbUrl) {
    const sql = neon(dbUrl);
    const result = await sql`
      UPDATE certificates
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id;
    `;
    if (!result || result.length === 0) {
      throw new Error(`Certificate with ID ${id} not found in database`);
    }
    return;
  }

  // 2. Legacy Google Sheets Proxy
  const proxyUrl = env?.SHEETS_PROXY_URL?.trim() || process.env.SHEETS_PROXY_URL?.trim();
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_STATUS',
        bearerToken: env?.SHEETS_BEARER_TOKEN || process.env.SHEETS_BEARER_TOKEN,
        id,
        status,
      }),
    });
    if (!res.ok) {
      throw new Error(`Sheets proxy status update failed with HTTP ${res.status}`);
    }
    return;
  }

  // 3. Local Mock JSON Fallback
  const list = ensureMockStorage();
  const cert = list.find((c) => c.id === id);
  if (!cert) {
    throw new Error('Certificate not found in ledger');
  }
  cert.status = status;
  saveMockStorage(list);
}

export async function updateCertInLedger(
  record: CertificateRecord,
  env?: LedgerEnv
): Promise<CertificateRecord> {
  const dbUrl = resolveDatabaseUrl(env);

  // 1. Neon Postgres
  if (dbUrl) {
    const sql = neon(dbUrl);
    const result = await sql`
      UPDATE certificates SET
        doc_type = ${record.docType || 'COMPLETION'},
        recipient_name = ${record.recipientName},
        program_title = ${record.programTitle},
        description = ${record.description},
        level = ${record.level},
        issue_date = ${record.issueDate},
        expiry_date = ${record.expiryDate || null},
        signatory1_name = ${record.signatory1Name},
        signatory1_title = ${record.signatory1Title},
        signatory2_name = ${record.signatory2Name || null},
        signatory2_title = ${record.signatory2Title || null},
        template_id = ${record.templateId},
        paper_size = ${record.paperSize},
        orientation = ${record.orientation},
        status = ${record.status},
        payload_hash = ${record.payloadHash},
        signature = ${record.signature},
        updated_at = NOW()
      WHERE id = ${record.id}
      RETURNING *;
    `;
    if (!result || result.length === 0) {
      throw new Error(`Certificate with ID ${record.id} not found in database`);
    }
    return mapRowToRecord(result[0], resolveAppUrl(env));
  }


  // 2. Legacy Google Sheets Proxy
  const proxyUrl = env?.SHEETS_PROXY_URL?.trim() || process.env.SHEETS_PROXY_URL?.trim();
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_CERT',
        bearerToken: env?.SHEETS_BEARER_TOKEN || process.env.SHEETS_BEARER_TOKEN,
        payload: record,
      }),
    });
    if (!res.ok) {
      throw new Error(`Sheets proxy update failed with HTTP ${res.status}`);
    }
    return record;
  }

  // 3. Local Mock JSON Fallback
  const list = ensureMockStorage();
  const idx = list.findIndex((c) => c.id === record.id);
  if (idx === -1) {
    throw new Error(`Certificate with ID ${record.id} not found in ledger`);
  }
  list[idx] = record;
  saveMockStorage(list);
  return record;
}

export async function deleteCertFromLedger(
  id: string,
  env?: LedgerEnv
): Promise<void> {
  const dbUrl = resolveDatabaseUrl(env);

  // 1. Neon Postgres
  if (dbUrl) {
    const sql = neon(dbUrl);
    const result = await sql`
      DELETE FROM certificates
      WHERE id = ${id}
      RETURNING id;
    `;
    if (!result || result.length === 0) {
      throw new Error(`Certificate with ID ${id} not found in database`);
    }
    return;
  }

  // 2. Legacy Google Sheets Proxy
  const proxyUrl = env?.SHEETS_PROXY_URL?.trim() || process.env.SHEETS_PROXY_URL?.trim();
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_CERT',
        bearerToken: env?.SHEETS_BEARER_TOKEN || process.env.SHEETS_BEARER_TOKEN,
        id,
      }),
    });
    if (!res.ok) {
      throw new Error(`Sheets proxy delete failed with HTTP ${res.status}`);
    }
    return;
  }

  // 3. Local Mock JSON Fallback
  const list = ensureMockStorage();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) {
    throw new Error(`Certificate with ID ${id} not found in ledger`);
  }
  list.splice(idx, 1);
  saveMockStorage(list);
}

export async function getCertFromLedger(
  id: string,
  env?: LedgerEnv
): Promise<CertificateRecord | null> {
  const dbUrl = resolveDatabaseUrl(env);
  const appUrl = resolveAppUrl(env);

  // 1. Neon Postgres
  if (dbUrl) {
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT * FROM certificates WHERE id = ${id} LIMIT 1;
    `;
    if (!rows || rows.length === 0) return null;
    return mapRowToRecord(rows[0], appUrl);
  }

  // 2. Legacy Google Sheets Proxy
  const proxyUrl = env?.SHEETS_PROXY_URL?.trim() || process.env.SHEETS_PROXY_URL?.trim();
  if (proxyUrl) {
    const token = env?.SHEETS_BEARER_TOKEN || process.env.SHEETS_BEARER_TOKEN || '';
    const targetUrl = `${proxyUrl}?action=GET_CERT&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(targetUrl);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Sheets proxy GET failed with HTTP ${res.status}`);
    const body = await res.json();
    return body.data || null;
  }

  // 3. Local Mock JSON Fallback
  const list = ensureMockStorage();
  return list.find((c) => c.id === id) || null;
}

export async function listCertsFromLedger(
  env?: LedgerEnv,
  params?: PaginationParams
): Promise<PaginatedCertificatesResult> {
  const dbUrl = resolveDatabaseUrl(env);
  const appUrl = resolveAppUrl(env);

  const page = Math.max(1, Number(params?.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize || 10)));
  const offset = (page - 1) * pageSize;
  const search = (params?.search || '').trim();
  const status = (params?.status || 'ALL').toUpperCase();
  const docType = (params?.docType || 'ALL').toUpperCase();

  // 1. Neon Postgres
  if (dbUrl) {
    const sql = neon(dbUrl);
    const searchPattern = search ? `%${search}%` : null;
    const statusParam = status !== 'ALL' ? status : null;
    const docTypeParam = docType !== 'ALL' ? docType : null;

    // Fetch Global Metrics
    const metricsRows = await sql`
      SELECT
        count(*)::int as total,
        count(*) FILTER (WHERE status = 'ACTIVE')::int as active,
        count(*) FILTER (WHERE status = 'REVOKED')::int as revoked,
        count(*) FILTER (WHERE doc_type = 'COMPLETION')::int as completion,
        count(*) FILTER (WHERE doc_type = 'QUALIFICATION')::int as qualification,
        count(*) FILTER (WHERE doc_type = 'APPRECIATION')::int as appreciation,
        count(*) FILTER (WHERE doc_type = 'PROMOTION')::int as promotion
      FROM certificates;
    `;
    const metrics = {
      total: Number(metricsRows[0]?.total || 0),
      active: Number(metricsRows[0]?.active || 0),
      revoked: Number(metricsRows[0]?.revoked || 0),
      completion: Number(metricsRows[0]?.completion || 0),
      qualification: Number(metricsRows[0]?.qualification || 0),
      appreciation: Number(metricsRows[0]?.appreciation || 0),
      promotion: Number(metricsRows[0]?.promotion || 0),
    };

    const countRows = await sql`
      SELECT count(*)::int as count FROM certificates
      WHERE (${searchPattern}::text IS NULL OR id ILIKE ${searchPattern} OR recipient_name ILIKE ${searchPattern} OR program_title ILIKE ${searchPattern})
        AND (${statusParam}::text IS NULL OR status = ${statusParam}::cert_status)
        AND (${docTypeParam}::text IS NULL OR doc_type = ${docTypeParam});
    `;

    const recordRows = await sql`
      SELECT * FROM certificates
      WHERE (${searchPattern}::text IS NULL OR id ILIKE ${searchPattern} OR recipient_name ILIKE ${searchPattern} OR program_title ILIKE ${searchPattern})
        AND (${statusParam}::text IS NULL OR status = ${statusParam}::cert_status)
        AND (${docTypeParam}::text IS NULL OR doc_type = ${docTypeParam})
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    const filteredTotal = Number(countRows[0]?.count || 0);
    const totalPages = Math.ceil(filteredTotal / pageSize) || 1;
    const records = (recordRows || []).map((r) => mapRowToRecord(r, appUrl));

    return {
      records,
      total: filteredTotal,
      page,
      pageSize,
      totalPages,
      metrics,
    };
  }

  // 2. Legacy Google Sheets Proxy (Fallback)
  const proxyUrl = env?.SHEETS_PROXY_URL?.trim() || process.env.SHEETS_PROXY_URL?.trim();
  if (proxyUrl) {
    const token = env?.SHEETS_BEARER_TOKEN || process.env.SHEETS_BEARER_TOKEN || '';
    const targetUrl = `${proxyUrl}?action=LIST_CERTS&token=${encodeURIComponent(token)}`;
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`Sheets proxy LIST failed with HTTP ${res.status}`);
    const body = await res.json();
    const allRecords: CertificateRecord[] = body.data || [];
    return paginateArray(allRecords, page, pageSize, search, status, docType);
  }

  // 3. Local Mock JSON Fallback
  const allRecords = ensureMockStorage();
  return paginateArray(allRecords, page, pageSize, search, status, docType);
}

function paginateArray(
  all: CertificateRecord[],
  page: number,
  pageSize: number,
  search: string,
  status: string,
  docType: string = 'ALL'
): PaginatedCertificatesResult {
  const metrics = {
    total: all.length,
    active: all.filter((c) => c.status === 'ACTIVE').length,
    revoked: all.filter((c) => c.status === 'REVOKED').length,
    completion: all.filter((c) => (c.docType || 'COMPLETION') === 'COMPLETION').length,
    qualification: all.filter((c) => c.docType === 'QUALIFICATION').length,
    appreciation: all.filter((c) => c.docType === 'APPRECIATION').length,
    promotion: all.filter((c) => c.docType === 'PROMOTION').length,
  };

  let filtered = all;
  if (status !== 'ALL') {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (docType !== 'ALL') {
    filtered = filtered.filter((c) => (c.docType || 'COMPLETION') === docType);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
        c.programTitle.toLowerCase().includes(q)
    );
  }

  const offset = (page - 1) * pageSize;
  const filteredTotal = filtered.length;
  const totalPages = Math.ceil(filteredTotal / pageSize) || 1;
  const records = filtered.slice(offset, offset + pageSize);

  return {
    records,
    total: filteredTotal,
    page,
    pageSize,
    totalPages,
    metrics,
  };
}

