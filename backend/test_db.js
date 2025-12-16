import { getDb } from './models/db.js';

async function testDb() {
  const db = await getDb();
  
  // List tables
  const tables = await db.all(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  console.log('Tables:', tables.map(t => t.table_name));
  
  // Check inventory
  const inventory = await db.all('SELECT COUNT(*) as count FROM inventory');
  console.log('Inventory count:', inventory[0]?.count);
  
  // Check invoices
  const invoices = await db.all('SELECT COUNT(*) as count FROM invoices');
  console.log('Invoices count:', invoices[0]?.count);
  
  // Check tenant
  const tenants = await db.all('SELECT * FROM tenants LIMIT 1');
  console.log('Tenant:', tenants[0]);
  
  await db.close();
}

testDb().catch(console.error);
