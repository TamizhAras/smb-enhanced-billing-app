import { getDb } from '../models/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(closeConn = false) {
  const db = await getDb();
  
  // Get all migration files in order
  const migrationFiles = [
    '001_init.sql',
    '002_ai_insights_tables.sql',
    '003_comprehensive_ai_insights.sql',
    '005_safe_migration.sql',  // Use safe migration instead of 004
    '006_add_missing_columns.sql',  // Add repository-expected columns
    '007_complete_customer_fields.sql',  // Complete customer table fields
    '008_final_alignment.sql',  // Final alignment of all tables
    '009_invoice_complete_fields.sql',  // Add ALL missing invoice columns
    '010_branch_enhanced_fields.sql',  // Add enhanced branch fields for Phase 2
    '011_fix_postgres_schema.sql'   // Fix missing columns and tables for Postgres
  ];
  
  console.log('Running migrations...');
  
  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
      console.log(`Applying migration: ${file}`);
      const migration = fs.readFileSync(filePath, 'utf-8');
      try {
        await db.exec(migration);
        console.log(`✓ ${file} applied successfully`);
      } catch (error) {
        console.error(`✗ Error applying ${file}:`, error.message);
        // Continue with other migrations even if one fails
      }
    } else {
      console.log(`⚠ Migration file not found: ${file}`);
    }
  }
  
  console.log('\nAll migrations completed.');
  if (closeConn) {
    await db.close();
  }
}

if (process.argv[1] === __filename) {
  runMigrations(true);
}
