import type { APIRoute } from 'astro';
import { buildCanonicalPayload, type CertificateRecord } from '../../types/certificates';
import { signCanonicalPayload } from '../../utils/crypto';
import { appendCertToLedger, updateCertStatusInLedger } from '../../utils/ledger';
import crypto from 'node:crypto';

export const prerender = false;

import fs from 'node:fs';
import path from 'node:path';

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

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      recipientName, programTitle, description, level, issueDate, expiryDate,
      signatory1Name, signatory1Title, signatory2Name, signatory2Title,
      templateId, paperSize, orientation
    } = body;

    if (!recipientName || !programTitle || !description || !level || !issueDate ||
        !signatory1Name || !signatory1Title || !templateId || !paperSize || !orientation) {
      return new Response(JSON.stringify({ error: 'Missing required certificate fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const year = new Date().getFullYear();
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const id = `CERT-${year}-${hex}`;

    const canonical = buildCanonicalPayload({
      id, recipientName, programTitle, description, level, issueDate,
      expiryDate: expiryDate || null, signatory1Name, signatory1Title,
      signatory2Name: signatory2Name || null, signatory2Title: signatory2Title || null,
    });

    const privKey = process.env.ED25519_PRIVATE_KEY_B64 || import.meta.env.ED25519_PRIVATE_KEY_B64;
    if (!privKey) {
      return new Response(JSON.stringify({ error: 'Server Ed25519 private key unconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { signature, payloadHash } = await signCanonicalPayload(canonical, privKey);
    const appUrl = (process.env.PUBLIC_APP_URL || import.meta.env.PUBLIC_APP_URL || '').replace(/\/+$/, '');
    const verificationUrl = `${appUrl}/check?id=${encodeURIComponent(id)}&sig=${encodeURIComponent(signature)}`;

    const record: CertificateRecord = {
      id, recipientName, programTitle, description, level, issueDate,
      expiryDate: expiryDate || null, signatory1Name, signatory1Title,
      signatory2Name: signatory2Name || null, signatory2Title: signatory2Title || null,
      templateId, paperSize, orientation, status: 'ACTIVE', payloadHash, signature, verificationUrl,
    };

    await appendCertToLedger(record, {
      DATABASE_URL: process.env.DATABASE_URL || import.meta.env.DATABASE_URL,
      SHEETS_PROXY_URL: process.env.SHEETS_PROXY_URL || import.meta.env.SHEETS_PROXY_URL,
      SHEETS_BEARER_TOKEN: process.env.SHEETS_BEARER_TOKEN || import.meta.env.SHEETS_BEARER_TOKEN,
    });

    return new Response(JSON.stringify(record), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id, status } = await request.json();
    if (!id || (status !== 'ACTIVE' && status !== 'REVOKED')) {
      return new Response(JSON.stringify({ error: 'Invalid id or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateCertStatusInLedger(id, status, {
      DATABASE_URL: process.env.DATABASE_URL || import.meta.env.DATABASE_URL,
      SHEETS_PROXY_URL: process.env.SHEETS_PROXY_URL || import.meta.env.SHEETS_PROXY_URL,
      SHEETS_BEARER_TOKEN: process.env.SHEETS_BEARER_TOKEN || import.meta.env.SHEETS_BEARER_TOKEN,
    });

    return new Response(JSON.stringify({ id, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
