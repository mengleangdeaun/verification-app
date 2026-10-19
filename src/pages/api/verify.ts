import type { APIRoute } from 'astro';
import { listCertsFromLedger } from '../../utils/ledger';
import { verifyCertificate } from '../../utils/verifier';

import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

function getExpectedAdminSecret(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf-8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('ADMIN_API_SECRET=')) {
          const val = trimmed.replace('ADMIN_API_SECRET=', '').trim().replace(/^["']|["']$/g, '');
          if (val) return val;
        }
      }
    }
  } catch {}
  return process.env.ADMIN_API_SECRET || (typeof import.meta !== 'undefined' ? import.meta.env?.ADMIN_API_SECRET : '') || '';
}

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secret = getExpectedAdminSecret();
  const envSecret = process.env.ADMIN_API_SECRET || (typeof import.meta !== 'undefined' ? import.meta.env?.ADMIN_API_SECRET : '');
  return Boolean(token && (token === secret || (envSecret && token === envSecret)));
}

export const GET: APIRoute = async ({ request, url }) => {
  const isListMode = url.searchParams.get('list') === 'true';

  if (isListMode) {
    if (!checkAuth(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
      const search = url.searchParams.get('search') || '';
      const status = (url.searchParams.get('status') || 'ALL') as 'ALL' | 'ACTIVE' | 'REVOKED';

      const result = await listCertsFromLedger(
        {
          DATABASE_URL: process.env.DATABASE_URL || import.meta.env.DATABASE_URL,
          SHEETS_PROXY_URL: process.env.SHEETS_PROXY_URL || import.meta.env.SHEETS_PROXY_URL,
          SHEETS_BEARER_TOKEN: process.env.SHEETS_BEARER_TOKEN || import.meta.env.SHEETS_BEARER_TOKEN,
        },
        { page, pageSize, search, status }
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || 'Failed to list certificates' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const id = url.searchParams.get('id');
  const sig = url.searchParams.get('sig');

  const result = await verifyCertificate(id, sig);

  let statusCode = 200;
  if (result.code === 'MISSING_PARAMS' || result.code === 'INVALID_SIGNATURE') {
    statusCode = 400;
  } else if (result.code === 'RECORD_NOT_FOUND') {
    statusCode = 404;
  } else if (result.code === 'DATA_TAMPERED') {
    statusCode = 403;
  }

  return new Response(JSON.stringify(result), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
};
