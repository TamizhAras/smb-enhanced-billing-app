import { getDb } from './models/db.js';

async function checkAllTables() {
  const db = await getDb();
  
  console.log('\n=== TAX_RATES TABLE STRUCTURE ===');
  const taxRatesSchema = await db.all('PRAGMA table_info(tax_rates)');
  console.log('Columns:', taxRatesSchema.map(col => col.name).join(', '));
  
  console.log('\n=== INVOICE_TEMPLATES TABLE STRUCTURE ===');
  const templatesSchema = await db.all('PRAGMA table_info(invoice_templates)');
  console.log('Columns:', templatesSchema.map(col => col.name).join(', '));
  
  console.log('\n=== PAYMENTS TABLE STRUCTURE ===');
  const paymentsSchema = await db.all('PRAGMA table_info(payments)');
  console.log('Columns:', paymentsSchema.map(col => col.name).join(', '));
  
  await db.close();
}

checkAllTables().catch(console.error);
