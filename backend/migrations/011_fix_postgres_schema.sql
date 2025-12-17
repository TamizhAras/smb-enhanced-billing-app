-- Fix missing columns and tables for Postgres
-- This migration ensures that all required columns exist, even if previous migrations failed or were skipped.

-- 1. Ensure payments table exists with correct schema
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT,
  reference TEXT,
  notes TEXT,
  payment_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 2. Add method and reference columns to payments if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'method') THEN
        ALTER TABLE payments ADD COLUMN method TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reference') THEN
        ALTER TABLE payments ADD COLUMN reference TEXT;
    END IF;
END $$;

-- 3. Add missing columns to invoices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
        ALTER TABLE invoices ADD COLUMN terms TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_terms') THEN
        ALTER TABLE invoices ADD COLUMN payment_terms TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'items') THEN
        ALTER TABLE invoices ADD COLUMN items TEXT; -- JSON
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tags') THEN
        ALTER TABLE invoices ADD COLUMN tags TEXT; -- JSON
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'is_recurring') THEN
        ALTER TABLE invoices ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'recurring_frequency') THEN
        ALTER TABLE invoices ADD COLUMN recurring_frequency TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'recurring_end_date') THEN
        ALTER TABLE invoices ADD COLUMN recurring_end_date DATETIME;
    END IF;
END $$;

-- 4. Fix tax_rates is_active
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tax_rates' AND column_name = 'is_active') THEN
        ALTER TABLE tax_rates ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
