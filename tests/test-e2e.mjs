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
  const pageRes = await fetch('http://localhost:4321/check?id=' + encodeURIComponent(cert.id) + '&sig=' + encodeURIComponent(cert.signature));
  console.log('Page HTTP status:', pageRes.status);
  const html = await pageRes.text();
  console.log('Contains recipient name:', html.includes('Sokha Chan'));
  console.log('Contains program title:', html.includes('Full-Stack Web Engineering'));
  console.log('Contains static signature 1:', html.includes('/assets/sig-1.svg'));
  console.log('Contains static signature 2:', html.includes('/assets/sig-2.svg'));
  console.log('Contains official seal:', html.includes('/assets/seal.svg'));
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

  console.log('\n=== ALL END-TO-END VALIDATIONS COMPLETE ===');
}

runTests().catch(console.error);
