-- Safe migration script that handles existing columns/tables
-- Run this to upgrade database schema to Phase 1 requirements

-- First, let's create the new tables (if they don't exist)

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  amount REAL NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online')),
  reference TEXT,
  notes TEXT,
  payment_date TIMESTAMP NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  tax_id TEXT,
  logo_url TEXT,
  default_currency TEXT DEFAULT 'INR',
  default_tax_rate REAL DEFAULT 18,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1,
  communication_settings TEXT,
  tenant_id TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safely add Foreign Keys for new tables
DO $$
BEGIN
    -- Payments FKs
    BEGIN
        ALTER TABLE payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK payments_invoice_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE payments ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK payments_tenant_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE payments ADD CONSTRAINT payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK payments_branch_id_fkey: %', SQLERRM; END;

    -- Tax Rates FKs
    BEGIN
        ALTER TABLE tax_rates ADD CONSTRAINT tax_rates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK tax_rates_tenant_id_fkey: %', SQLERRM; END;

    -- Invoice Templates FKs
    BEGIN
        ALTER TABLE invoice_templates ADD CONSTRAINT invoice_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK invoice_templates_tenant_id_fkey: %', SQLERRM; END;

    -- Company Settings FKs
    BEGIN
        ALTER TABLE company_settings ADD CONSTRAINT company_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK company_settings_tenant_id_fkey: %', SQLERRM; END;
END $$;

-- Now add missing columns to existing tables
DO $$
BEGIN
    -- Invoices columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='subtotal') THEN
        ALTER TABLE invoices ADD COLUMN subtotal REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='tax_amount') THEN
        ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='discount_amount') THEN
        ALTER TABLE invoices ADD COLUMN discount_amount REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='total_amount') THEN
        ALTER TABLE invoices ADD COLUMN total_amount REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='paid_amount') THEN
        ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='outstanding_amount') THEN
        ALTER TABLE invoices ADD COLUMN outstanding_amount REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='due_date') THEN
        ALTER TABLE invoices ADD COLUMN due_date TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='notes') THEN
        ALTER TABLE invoices ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='terms') THEN
        ALTER TABLE invoices ADD COLUMN terms TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='items') THEN
        ALTER TABLE invoices ADD COLUMN items TEXT; -- JSON string
    END IF;

    -- Customers columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='gst_number') THEN
        ALTER TABLE customers ADD COLUMN gst_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='pan_number') THEN
        ALTER TABLE customers ADD COLUMN pan_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='credit_limit') THEN
        ALTER TABLE customers ADD COLUMN credit_limit REAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='payment_terms') THEN
        ALTER TABLE customers ADD COLUMN payment_terms INTEGER;
    END IF;
END $$;
