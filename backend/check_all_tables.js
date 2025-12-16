import { getDb } from './models/db.js';

async function checkAllTables() {
  const db = await getDb();
  
  const getTables = async (...tableNames) => {
    for (const tableName of tableNames) {
      console.log(`\n=== ${tableName.toUpperCase()} TABLE STRUCTURE ===`);
      const schema = await db.all(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1 
         ORDER BY ordinal_position`,
        [tableName.toLowerCase()]
      ).catch(() => []);
      if (schema.length) {
        console.log('Columns:', schema.map(col => col.column_name).join(', '));
      } else {
        console.log('Table not found or no columns');
      }
    }
  };
  
  await getTables('tax_rates', 'invoice_templates', 'payments');
  
  await db.close();
}

checkAllTables().catch(console.error);
