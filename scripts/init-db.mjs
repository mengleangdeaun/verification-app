import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Helper to parse .env file if process.env.DATABASE_URL is not set
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL?.trim();

if (!dbUrl) {
  console.error('\x1b[31m[ERROR] DATABASE_URL is not set!\x1b[0m');
  console.log('\nPlease add your Neon connection string to .env:\n');
  console.log('  DATABASE_URL=postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require\n');
  process.exit(1);
}

const sql = neon(dbUrl);

async function init() {
  console.log('\x1b[36mConnecting to Neon PostgreSQL and initializing schema...\x1b[0m');

  // 1. Create Enums idempotently
  await sql`
    DO $$ BEGIN
      CREATE TYPE cert_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE paper_size AS ENUM ('A4', 'LETTER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE paper_orientation AS ENUM ('landscape', 'portrait');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log('  \x1b[32m✔\x1b[0m Custom types verified (cert_status, paper_size, paper_orientation)');

  // 2. Create Table
  await sql`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(64) PRIMARY KEY,
      recipient_name VARCHAR(255) NOT NULL,
      program_title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      level VARCHAR(100) NOT NULL,
      issue_date DATE NOT NULL,
      expiry_date DATE,
      signatory1_name VARCHAR(255) NOT NULL,
      signatory1_title VARCHAR(255) NOT NULL,
      signatory2_name VARCHAR(255),
      signatory2_title VARCHAR(255),
      template_id VARCHAR(50) NOT NULL DEFAULT 'classic-diploma',
      paper_size paper_size NOT NULL DEFAULT 'A4',
      orientation paper_orientation NOT NULL DEFAULT 'landscape',
      status cert_status NOT NULL DEFAULT 'ACTIVE',
      payload_hash VARCHAR(64) NOT NULL,
      signature TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('  \x1b[32m✔\x1b[0m Table `certificates` ready');

  // 3. Create Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_certs_status ON certificates(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_certs_recipient ON certificates(recipient_name);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_certs_created_at ON certificates(created_at DESC);`;
  console.log('  \x1b[32m✔\x1b[0m Indexes created (idx_certs_status, idx_certs_recipient, idx_certs_created_at)');

  // 4. Optional import from mock ledger if it exists
  const mockPath = path.resolve(process.cwd(), 'data', 'mock-ledger.json');
  if (fs.existsSync(mockPath)) {
    try {
      const records = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
      if (Array.isArray(records) && records.length > 0) {
        console.log(`\nFound ${records.length} records in data/mock-ledger.json. Migrating to Neon...`);
        let imported = 0;
        for (const r of records) {
          await sql`
            INSERT INTO certificates (
              id, recipient_name, program_title, description, level,
              issue_date, expiry_date, signatory1_name, signatory1_title,
              signatory2_name, signatory2_title, template_id, paper_size,
              orientation, status, payload_hash, signature, created_at, updated_at
            ) VALUES (
              ${r.id}, ${r.recipientName}, ${r.programTitle}, ${r.description}, ${r.level},
              ${r.issueDate}, ${r.expiryDate || null}, ${r.signatory1Name}, ${r.signatory1Title},
              ${r.signatory2Name || null}, ${r.signatory2Title || null}, ${r.templateId || 'classic-diploma'},
              ${r.paperSize || 'A4'}, ${r.orientation || 'landscape'}, ${r.status || 'ACTIVE'},
              ${r.payloadHash}, ${r.signature}, NOW(), NOW()
            )
            ON CONFLICT (id) DO NOTHING;
          `;
          imported++;
        }
        console.log(`  \x1b[32m✔\x1b[0m Successfully migrated ${imported} existing mock records to Neon!`);
      }
    } catch (e) {
      console.warn('  ⚠️ Note: Could not import mock ledger:', e.message);
    }
  }

  // 5. Query test
  const countResult = await sql`SELECT count(*)::int as count FROM certificates;`;
  console.log(`\n\x1b[32m[SUCCESS] Neon Database is fully initialized and operational!\x1b[0m`);
  console.log(`Total certificate records in database: ${countResult[0]?.count ?? 0}\n`);
}

init().catch((err) => {
  console.error('\n\x1b[31m[FAILED] Database initialization error:\x1b[0m', err);
  process.exit(1);
});
