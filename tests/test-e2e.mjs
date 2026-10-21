import * as fs from 'node:fs';
import * as path from 'node:path';

function getAdminSecret() {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ADMIN_API_SECRET=')) {
        return trimmed.replace('ADMIN_API_SECRET=', '').trim();
      }
    }
  } catch {}
  return 'admin_secret_key_2026_ledger';
}

async function runTests() {
  const adminSecret = getAdminSecret();

  console.log('--- 1. Testing POST /api/create ---');
  const createRes = await fetch('http://localhost:4321/api/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminSecret,
    },
    body: JSON.stringify({
      recipientName: 'Sokha Chan',
      programTitle: 'Full-Stack Web Engineering',
      description: 'Demonstrating outstanding technical excellence in Ed25519 cryptography and SolidJS reactive applications.',
      level: 'Level 4 Mastery',
      issueDate: '2026-10-16',
      expiryDate: null,
      signatory1Name: 'Dr. Virak Both',
      signatory1Title: 'Executive Director',
      signatory2Name: 'Sophea Kem',
      signatory2Title: 'Registrar General',
      templateId: 'classic-diploma',
      paperSize: 'A4',
      orientation: 'landscape',
    }),
  });
  console.log('Create HTTP status:', createRes.status);
  const cert = await createRes.json();
  if (createRes.status !== 201) {
    console.error('Create failed response:', cert);
  }
  console.log('Issued Certificate ID:', cert.id);
  console.log('Signature length:', cert.signature?.length);
  console.log('Verification URL:', cert.verificationUrl);

  console.log('\n--- 2. Testing GET /api/verify (Single Valid Cert) ---');
  const verifyRes = await fetch('http://localhost:4321/api/verify?id=' + encodeURIComponent(cert.id) + '&sig=' + encodeURIComponent(cert.signature));
  console.log('Verify HTTP status:', verifyRes.status);
  const verifyData = await verifyRes.json();
  console.log('Verification outcome:', verifyData.code, 'Valid:', verifyData.valid);

  console.log('\n--- 2b. Testing Active SSR /check Page Content ---');
  const activePageRes = await fetch(cert.verificationUrl);
  console.log('Active Page HTTP status:', activePageRes.status);
  const activeHtml = await activePageRes.text();
  console.log('Contains recipient name (Sokha Chan):', activeHtml.includes('Sokha Chan'));
  console.log('Contains signatory 1 (Dr. Virak Both):', activeHtml.includes('Dr. Virak Both'));
  console.log('Contains official seal:', activeHtml.includes('seal.svg'));
  console.log('Contains Authorized Signatory badge:', activeHtml.includes('Authorized Signatory'));
  console.log('Does NOT contain static signature 1 SVG:', !activeHtml.includes('/assets/sig-1.svg'));
  console.log('Does NOT contain static signature 2 SVG:', !activeHtml.includes('/assets/sig-2.svg'));

  console.log('\n--- 3. Testing Tamper Detection ---');
  const badSig = cert.signature.slice(0, -2) + 'AA';
  const tamperRes = await fetch('http://localhost:4321/api/verify?id=' + encodeURIComponent(cert.id) + '&sig=' + encodeURIComponent(badSig));
  console.log('Tamper HTTP status:', tamperRes.status);
  const tamperData = await tamperRes.json();
  console.log('Tamper outcome:', tamperData.code);

  console.log('\n--- 4. Testing PATCH /api/create (Revoke) ---');
  const revokeRes = await fetch('http://localhost:4321/api/create', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminSecret,
    },
    body: JSON.stringify({ id: cert.id, status: 'REVOKED' }),
  });
  console.log('Revoke HTTP status:', revokeRes.status);

  console.log('\n--- 5. Testing GET /api/verify after Revocation ---');
  const checkRevokedRes = await fetch('http://localhost:4321/api/verify?id=' + encodeURIComponent(cert.id) + '&sig=' + encodeURIComponent(cert.signature));
  const checkRevokedData = await checkRevokedRes.json();
  console.log('Revocation check outcome:', checkRevokedData.code, 'Status:', checkRevokedData.record?.status);

  console.log('\n--- 6. Testing SSR /check Page Content ---');
  const pageRes = await fetch(cert.verificationUrl);
  console.log('Page HTTP status:', pageRes.status);
  const html = await pageRes.text();
  console.log('Contains revoked alert:', html.includes('REVOKED'));
  console.log('Zero client JS scripts on /check:', !html.includes('<script type="module" src="/_astro/'));

  console.log('\n--- 7. Testing GET /api/verify?list=true (Server Pagination) ---');
  const listRes = await fetch('http://localhost:4321/api/verify?list=true&page=1&pageSize=5', {
    headers: { Authorization: 'Bearer ' + adminSecret },
  });
  console.log('List HTTP status:', listRes.status);
  if (listRes.ok) {
    const listData = await listRes.json();
    console.log('Paginated items count:', listData.records?.length, 'Total in DB:', listData.total);
  }

  console.log('\n--- 8. Testing Security Guards (Honeypot & 5/min Rate Limiting) ---');
  // Honeypot proactive bot trap test
  const botRes = await fetch('http://localhost:4321/api/verify?id=' + encodeURIComponent(cert.id) + '&sig=' + encodeURIComponent(cert.signature) + '&_hp_check=malicious_crawler');
  console.log('Honeypot blocked HTTP status (expected 403):', botRes.status);

  // Rate Limiting reactive guard test: Send rapid requests from a simulated client IP
  const simulatedIp = '203.0.113.' + Math.floor(Math.random() * 200 + 10);
  let rateLimitedStatus = null;
  for (let i = 1; i <= 6; i++) {
    const res = await fetch('http://localhost:4321/api/verify?id=' + encodeURIComponent(cert.id) + '&sig=' + encodeURIComponent(cert.signature), {
      headers: { 'X-Forwarded-For': simulatedIp },
    });
    if (res.status === 429) {
      rateLimitedStatus = res.status;
      const data = await res.json();
      console.log(`Request #${i} triggered reactive rate limiter: 429 Too Many Requests (code: ${data.code}, retryAfter: ${res.headers.get('Retry-After')}s)`);
      break;
    }
  }
  console.log('Rate limit protection verified:', rateLimitedStatus === 429);

  console.log('\n--- 9. Testing Proactive Format Whitelisting (Letters & Certificates) ---');
  const formatTestIp = '198.51.100.' + Math.floor(Math.random() * 200 + 10);
  // Malformed ID fast rejection test (0 DB query)
  const badIdRes = await fetch('http://localhost:4321/api/verify?id=MALFORMED_ID&sig=' + encodeURIComponent(cert.signature), {
    headers: { 'X-Forwarded-For': formatTestIp },
  });
  console.log('Malformed ID fast rejection (expected 404):', badIdRes.status);

  // Malformed signature fast rejection test (0 DB query)
  const badSigRes = await fetch('http://localhost:4321/api/verify?id=' + encodeURIComponent(cert.id) + '&sig=SHORT_SIG', {
    headers: { 'X-Forwarded-For': formatTestIp },
  });
  console.log('Malformed signature fast rejection (expected 404):', badSigRes.status);

  // Valid Letter of Appreciation (LOA) format accepted by proactive guard
  const loaFormatRes = await fetch('http://localhost:4321/api/verify?id=LOA-2026-A1B2C3D4&sig=' + encodeURIComponent(cert.signature), {
    headers: { 'X-Forwarded-For': formatTestIp },
  });
  console.log('Letter of Appreciation format passed proactive check:', loaFormatRes.status !== 400);

  console.log('\n=== ALL END-TO-END VALIDATIONS COMPLETE ===');
}

runTests().catch(console.error);
