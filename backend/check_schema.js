import { getDb } from './models/db.js';

async function checkSchema() {
  const db = await getDb();
  
  console.log('\n=== INVOICES TABLE STRUCTURE ===');
  const invoicesSchema = await db.all('PRAGMA table_info(invoices)');
  console.log('Columns:', invoicesSchema.map(col => col.name).join(', '));
  
  console.log('\n=== ALL TABLES ===');
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables:', tables.map(t => t.name).join(', '));
  
  console.log('\n=== CUSTOMERS TABLE STRUCTURE ===');
  const customersSchema = await db.all('PRAGMA table_info(customers)');
  console.log('Columns:', customersSchema.map(col => col.name).join(', '));
  
  await db.close();
}

checkSchema().catch(console.error);
