import { getDb } from './models/db.js';

async function showSchema() {
  const db = await getDb();
  
  const tables = await db.all(`SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
  console.log('DATABASE SCHEMA:\n');
  tables.forEach(t => console.log(t.sql + ';\n'));
  
  await db.close();
}

showSchema().catch(console.error);
