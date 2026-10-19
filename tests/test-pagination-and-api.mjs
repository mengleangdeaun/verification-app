import * as fs from 'node:fs';
import * as path from 'node:path';
import { listCertsFromLedger } from '../src/utils/ledger.ts';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

async function runPaginationTest() {
  console.log('\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m Testing Server-Side Pagination & Filter Pushdown   \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is missing');

  // Test 1: Page 1 with pageSize 5
  console.log('\n1. Fetching Page 1 (pageSize: 5)...');
  const t0 = performance.now();
  const page1 = await listCertsFromLedger({ DATABASE_URL: dbUrl }, { page: 1, pageSize: 5 });
  const tQuery = (performance.now() - t0).toFixed(1);

  console.log(`  \x1b[32m✔\x1b[0m Response in ${tQuery}ms`);
  console.log(`  Total in DB: ${page1.total}, Total Pages: ${page1.totalPages}, Page items: ${page1.records.length}`);
  console.log(`  Metrics -> Total: ${page1.metrics.total}, Active: ${page1.metrics.active}, Revoked: ${page1.metrics.revoked}`);

  if (page1.records.length > 5) {
    throw new Error(`Expected at most 5 records, got ${page1.records.length}`);
  }

  // Test 2: Filter by status 'ACTIVE'
  console.log('\n2. Filtering by Status: ACTIVE (pageSize: 5)...');
  const activePage = await listCertsFromLedger({ DATABASE_URL: dbUrl }, { page: 1, pageSize: 5, status: 'ACTIVE' });
  console.log(`  \x1b[32m✔\x1b[0m Active records found: ${activePage.total}`);
  for (const r of activePage.records) {
    if (r.status !== 'ACTIVE') {
      throw new Error(`Expected ACTIVE record, got ${r.status}`);
    }
  }

  // Test 3: Search filter
  console.log('\n3. Searching for "Vannak"...');
  const searchResult = await listCertsFromLedger({ DATABASE_URL: dbUrl }, { search: 'Vannak', pageSize: 5 });
  console.log(`  \x1b[32m✔\x1b[0m Matching "Vannak" count: ${searchResult.total}`);
  for (const r of searchResult.records) {
    const match = r.recipientName.includes('Vannak') || r.programTitle.includes('Vannak') || r.id.includes('Vannak');
    if (!match) {
      throw new Error(`Record did not match search: ${r.recipientName}`);
    }
  }

  console.log('\n\x1b[32m🎉 ALL PAGINATION & FILTER TESTS PASSED WITH 100% SUCCESS!\x1b[0m\n');
}

runPaginationTest().catch((err) => {
  console.error('\x1b[31m[PAGINATION TEST ERROR]\x1b[0m', err);
  process.exit(1);
});
