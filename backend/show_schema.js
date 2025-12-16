import { getDb } from './models/db.js';

async function showSchema() {
  const db = await getDb();
  
  // Get table definitions from information schema
  const tables = await db.all(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log('DATABASE SCHEMA:\n');
  
  for (const table of tables) {
    const tableName = table.table_name;
    const columns = await db.all(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log(`CREATE TABLE ${tableName} (`);
    columns.forEach((col, idx) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const default_ = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      const comma = idx < columns.length - 1 ? ',' : '';
      console.log(`  ${col.column_name} ${col.data_type} ${nullable}${default_}${comma}`);
    });
    console.log(`);\n`);
  }
  
  await db.close();
}

showSchema().catch(console.error);
