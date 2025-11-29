-- Additional columns needed by repositories
-- Run this after 005_safe_migration.sql

-- Add missing columns to customers table
ALTER TABLE customers ADD COLUMN postal_code TEXT;
ALTER TABLE customers ADD COLUMN country TEXT;

-- Copy data from pincode to postal_code
UPDATE customers SET postal_code = pincode WHERE pincode IS NOT NULL;

-- Add missing columns to invoices table  
ALTER TABLE invoices ADD COLUMN discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed'));
ALTER TABLE invoices ADD COLUMN discount_value REAL DEFAULT 0;

-- Add missing columns to tax_rates table
ALTER TABLE tax_rates ADD COLUMN branch_id TEXT;
ALTER TABLE tax_rates ADD FOREIGN KEY (branch_id) REFERENCES branches(id);

-- Add missing columns to invoice_templates table
ALTER TABLE invoice_templates ADD COLUMN layout TEXT;
ALTER TABLE invoice_templates ADD COLUMN styles TEXT;
ALTER TABLE invoice_templates ADD COLUMN header TEXT;
ALTER TABLE invoice_templates ADD COLUMN footer TEXT;

-- Create index on postal_code for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_postal_code ON customers(postal_code);
