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

async function testAllThreeTypes() {
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
      description: "This is to verify that Deaun Mengleang has successfully completed the 'PPF Installation Training Program' on October 15, 2026.",
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

  console.log('\n--- TEST 2: Letter of Appreciation ---');
  const res2 = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
    body: JSON.stringify({
      docType: 'APPRECIATION',
      recipientName: 'Deaun Mengleang',
      programTitle: 'Autoshow Expo',
      description: 'This letter is proudly presented to Deaun Mengleang on October 20, 2026, in sincere appreciation for your exceptional dedication and outstanding support during the Autoshow Expo. Your hard work was instrumental to our team\'s success.',
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
  const cert2 = await res2.json();
  console.log('Status:', res2.status, '| ID:', cert2.id, '| docType:', cert2.docType);
  if (!cert2.id?.startsWith('LOA-')) throw new Error(`Expected LOA- prefix, got ${cert2.id}`);

  console.log('\n--- TEST 3: Letter of Promotion ---');
  const res3 = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
    body: JSON.stringify({
      docType: 'PROMOTION',
      recipientName: 'Deaun Mengleang',
      programTitle: 'L0 Intern → L1 Junior Technician',
      description: 'This officially certifies that Deaun Mengleang has been promoted from L0 Intern to L1 Junior Technician, effective November 1, 2026, in recognition of your proven technical capabilities and growth within the company.',
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
  const cert3 = await res3.json();
  console.log('Status:', res3.status, '| ID:', cert3.id, '| docType:', cert3.docType);
  if (!cert3.id?.startsWith('LOP-')) throw new Error(`Expected LOP- prefix, got ${cert3.id}`);

  console.log('\n--- TEST 4: Fetch List with docType Filters ---');
  const listAllRes = await fetch(`${baseUrl}/api/verify?list=true&page=1&pageSize=5`, {
    headers: { Authorization: `Bearer ${adminSecret}` },
  });
  const listAll = await listAllRes.json();
  console.log('Total in ledger:', listAll.metrics.total, '| Completion:', listAll.metrics.completion, '| Appreciation:', listAll.metrics.appreciation, '| Promotion:', listAll.metrics.promotion);

  console.log('\n[ALL TESTS PASSED SUCCESSFULLY]');
}

testAllThreeTypes().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
