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

async function testAllFourTypes() {
  const adminSecret = getAdminSecret();
  const baseUrl = 'http://localhost:4321';

  console.log('\n--- TEST 1: Certificate of Completion ---');
  const res1 = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
    body: JSON.stringify({
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
    }),
  });
  const cert1 = await res1.json();
  console.log('Status:', res1.status, '| ID:', cert1.id, '| docType:', cert1.docType);
  if (!cert1.id?.startsWith('CERT-')) throw new Error(`Expected CERT- prefix, got ${cert1.id}`);

  console.log('\n--- TEST 2: Certificate of Qualification ---');
  const res2 = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
    body: JSON.stringify({
      docType: 'QUALIFICATION',
      recipientName: 'Deaun Mengleang',
      programTitle: 'PPF Master Installer & Surface Specialist',
      description: "has fulfilled all qualification standards and is officially certified as 'PPF Master Installer & Surface Specialist' on October 20, 2026.",
      level: 'Standard',
      issueDate: '2026-10-20',
      expiryDate: '2028-10-20',
      signatory1Name: 'Sok Sabay',
      signatory1Title: 'Technical Supervisor',
      signatory2Name: 'Saing Dararith',
      signatory2Title: 'Managing Director',
      templateId: 'classic-diploma',
      paperSize: 'A4',
      orientation: 'landscape',
    }),
  });
  const cert2 = await res2.json();
  console.log('Status:', res2.status, '| ID:', cert2.id, '| docType:', cert2.docType);
  if (!cert2.id?.startsWith('COQ-')) throw new Error(`Expected COQ- prefix, got ${cert2.id}`);

  console.log('\n--- TEST 3: Letter of Appreciation ---');
  const res3 = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
    body: JSON.stringify({
      docType: 'APPRECIATION',
      recipientName: 'Deaun Mengleang',
      programTitle: 'Autoshow Expo',
      description: 'on October 20, 2026, in sincere appreciation for your exceptional dedication and outstanding support during the Autoshow Expo. Your hard work was instrumental to our team\'s success.',
      level: 'Standard',
      issueDate: '2026-10-20',
      expiryDate: null,
      signatory1Name: 'Sok Sabay',
      signatory1Title: 'Technical Supervisor',
      signatory2Name: 'Saing Dararith',
      signatory2Title: 'Managing Director',
      templateId: 'classic-diploma',
      paperSize: 'A4',
      orientation: 'portrait',
    }),
  });
  const cert3 = await res3.json();
  console.log('Status:', res3.status, '| ID:', cert3.id, '| docType:', cert3.docType);
  if (!cert3.id?.startsWith('LOA-')) throw new Error(`Expected LOA- prefix, got ${cert3.id}`);

  console.log('\n--- TEST 4: Letter of Promotion ---');
  const res4 = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
    body: JSON.stringify({
      docType: 'PROMOTION',
      recipientName: 'Deaun Mengleang',
      programTitle: 'L0 Intern → L1 Junior Technician',
      description: 'has been promoted from L0 Intern to L1 Junior Technician, effective November 1, 2026, in recognition of your proven technical capabilities and growth within the company.',
      level: 'Standard',
      issueDate: '2026-11-01',
      expiryDate: null,
      signatory1Name: 'Sok Sabay',
      signatory1Title: 'Technical Supervisor',
      signatory2Name: 'Saing Dararith',
      signatory2Title: 'Managing Director',
      templateId: 'classic-diploma',
      paperSize: 'A4',
      orientation: 'portrait',
    }),
  });
  const cert4 = await res4.json();
  console.log('Status:', res4.status, '| ID:', cert4.id, '| docType:', cert4.docType);
  if (!cert4.id?.startsWith('LOP-')) throw new Error(`Expected LOP- prefix, got ${cert4.id}`);

  console.log('\n--- TEST 5: Verify Cryptographic Signatures via /check ---');
  for (const c of [cert1, cert2, cert3, cert4]) {
    const vRes = await fetch(`${baseUrl}/api/verify?id=${encodeURIComponent(c.id)}&sig=${encodeURIComponent(c.signature)}`);
    const vBody = await vRes.json();
    console.log(`Verify ${c.id}: valid =`, vBody.valid, '| code =', vBody.code);
    if (!vBody.valid || vBody.code !== 'VERIFIED') {
      throw new Error(`Verification failed for ${c.id}: ${JSON.stringify(vBody)}`);
    }
  }

  console.log('\n--- TEST 6: Test Qualification Registry Filtering & Metrics ---');
  const qualRes = await fetch(`${baseUrl}/api/verify?list=true&docType=QUALIFICATION&page=1&pageSize=5`, {
    headers: { Authorization: `Bearer ${adminSecret}` },
  });
  const qualList = await qualRes.json();
  console.log('Qualification count found:', qualList.records?.length, '| Metrics:', qualList.metrics);
  if (!qualList.records?.some((r) => r.id === cert2.id)) {
    throw new Error(`Expected ${cert2.id} in qualification filtered results`);
  }
  if (qualList.metrics?.qualification < 1) {
    throw new Error('Expected qualification metric >= 1');
  }

  console.log('\n ALL 4 DOCUMENT TYPES VERIFIED & TESTED PERFECTLY!');
}

testAllFourTypes().catch((err) => {
  console.error('\n Test execution failed:', err);
  process.exit(1);
});
