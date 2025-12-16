import { getDb } from './models/db.js';

async function checkSchema() {
  const db = await getDb();
  
  console.log('\n=== INVOICES TABLE STRUCTURE ===');
  const invoicesSchema = await db.all(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'invoices' 
     ORDER BY ordinal_position`
  );
  console.log('Columns:', invoicesSchema.map(col => col.column_name).join(', '));
  
  console.log('\n=== ALL TABLES ===');
  const tables = await db.all(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );
  console.log('Tables:', tables.map(t => t.table_name).join(', '));
  
  console.log('\n=== CUSTOMERS TABLE STRUCTURE ===');
  const customersSchema = await db.all(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'customers' 
     ORDER BY ordinal_position`
  );
  console.log('Columns:', customersSchema.map(col => col.column_name).join(', '));
  
  await db.close();
}

checkSchema().catch(console.error);
