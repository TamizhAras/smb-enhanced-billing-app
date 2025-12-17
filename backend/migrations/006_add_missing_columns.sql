-- Additional columns needed by repositories
-- Run this after 005_safe_migration.sql

DO $$
BEGIN
    -- Add missing columns to customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='postal_code') THEN
        ALTER TABLE customers ADD COLUMN postal_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='country') THEN
        ALTER TABLE customers ADD COLUMN country TEXT;
    END IF;

    -- Add missing columns to invoices table  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='discount_type') THEN
        ALTER TABLE invoices ADD COLUMN discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='discount_value') THEN
        ALTER TABLE invoices ADD COLUMN discount_value REAL DEFAULT 0;
    END IF;

    -- Add missing columns to tax_rates table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tax_rates' AND column_name='branch_id') THEN
        ALTER TABLE tax_rates ADD COLUMN branch_id TEXT;
        BEGIN
            ALTER TABLE tax_rates ADD CONSTRAINT tax_rates_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;

    -- Add missing columns to invoice_templates table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_templates' AND column_name='layout') THEN
        ALTER TABLE invoice_templates ADD COLUMN layout TEXT;
    END IF;
END $$;

-- Copy data from pincode to postal_code (if pincode column exists, which it might not in Postgres if it was SQLite specific, but let's try safely)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='pincode') THEN
        EXECUTE 'UPDATE customers SET postal_code = pincode WHERE postal_code IS NULL AND pincode IS NOT NULL';
    END IF;
END $$;
