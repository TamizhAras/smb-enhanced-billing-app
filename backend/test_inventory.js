import { getDb } from './models/db.js';

async function testInventory() {
  const db = await getDb();
  
  // Check inventory with tenant_id
  const inventory = await db.all('SELECT * FROM inventory LIMIT 5');
  console.log('Inventory items:', inventory);
  
  // Check tenant
  const tenants = await db.all('SELECT * FROM tenants');
  console.log('Tenants:', tenants);
  
  // Check branches
  const branches = await db.all('SELECT * FROM branches');
  console.log('Branches:', branches);
  
  await db.close();
}

testInventory().catch(console.error);
