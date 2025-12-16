-- Phase 1: Invoice Management System Enhancement
-- This migration expands the basic invoices table and adds related tables
-- for comprehensive invoice, payment, and billing management

-- ============================================================================
-- 1. ENHANCE INVOICES TABLE
-- ============================================================================
-- Add comprehensive fields to existing invoices table
ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN customer_id TEXT;
ALTER TABLE invoices ADD COLUMN customer_email TEXT;
ALTER TABLE invoices ADD COLUMN customer_address TEXT;
ALTER TABLE invoices ADD COLUMN customer_phone TEXT;
ALTER TABLE invoices ADD COLUMN issue_date DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE invoices ADD COLUMN due_date DATETIME;
ALTER TABLE invoices ADD COLUMN subtotal REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN discount_type TEXT; -- 'percentage' or 'fixed'
ALTER TABLE invoices ADD COLUMN discount_value REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN discount_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN total_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN outstanding_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN payment_terms TEXT;
ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'INR';
ALTER TABLE invoices ADD COLUMN exchange_rate REAL DEFAULT 1;
ALTER TABLE invoices ADD COLUMN is_recurring BOOLEAN DEFAULT 0;
ALTER TABLE invoices ADD COLUMN recurring_frequency TEXT; -- 'weekly', 'monthly', 'quarterly', 'yearly'
ALTER TABLE invoices ADD COLUMN recurring_end_date DATETIME;
ALTER TABLE invoices ADD COLUMN parent_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN notes TEXT;
ALTER TABLE invoices ADD COLUMN terms TEXT;
ALTER TABLE invoices ADD COLUMN footer_text TEXT;
ALTER TABLE invoices ADD COLUMN template_id TEXT;
ALTER TABLE invoices ADD COLUMN sent_at DATETIME;
ALTER TABLE invoices ADD COLUMN reminders_sent INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN last_reminder_date DATETIME;
ALTER TABLE invoices ADD COLUMN po_number TEXT;
ALTER TABLE invoices ADD COLUMN project_id TEXT;
ALTER TABLE invoices ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE invoices ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_branch ON invoices(tenant_id, branch_id);

-- ============================================================================
-- 2. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL, -- 'cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online'
  reference TEXT,
  notes TEXT,
  payment_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_branch ON payments(tenant_id, branch_id);

-- ============================================================================
-- 3. TAX RATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tax_rates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_tenant ON tax_rates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);

-- ============================================================================
-- 4. INVOICE TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout TEXT NOT NULL, -- 'modern', 'classic', 'minimal', 'professional'
  color_scheme TEXT,
  is_default BOOLEAN DEFAULT 0,
  custom_fields TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_templates_tenant ON invoice_templates(tenant_id);

-- ============================================================================
-- 5. COMPANY SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  tax_id TEXT,
  gst_number TEXT,
  logo_url TEXT,
  
  -- Invoice settings
  default_currency TEXT DEFAULT 'INR',
  default_tax_rate REAL DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1000,
  quotation_prefix TEXT DEFAULT 'QT',
  
  -- Payment settings
  payment_terms TEXT,
  bank_details TEXT, -- JSON: {bankName, accountNumber, ifscCode, accountName}
  
  -- Branding
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#10B981',
  
  -- Communication settings
  communication_settings TEXT, -- JSON object with email, WhatsApp, SMS config
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_company_settings_tenant ON company_settings(tenant_id);

-- ============================================================================
-- 6. ENHANCE CUSTOMERS TABLE (if needed)
-- ============================================================================
-- Check if customers table exists and add missing fields
-- Note: customers table created in 002_ai_insights_tables.sql

-- Add fields if they don't exist (SQLite doesn't have IF NOT EXISTS for columns)
-- These will fail silently if columns already exist

-- ============================================================================
-- 7. INSERT DEFAULT DATA
-- ============================================================================

-- Insert default tax rates for common scenarios
INSERT OR IGNORE INTO tax_rates (id, tenant_id, name, rate, description, is_default, is_active)
SELECT 'tax_gst_18', id, 'GST 18%', 18, 'Standard GST rate', 1, 1 FROM tenants LIMIT 1;

INSERT OR IGNORE INTO tax_rates (id, tenant_id, name, rate, description, is_default, is_active)
SELECT 'tax_gst_12', id, 'GST 12%', 12, 'Reduced GST rate', 0, 1 FROM tenants LIMIT 1;

INSERT OR IGNORE INTO tax_rates (id, tenant_id, name, rate, description, is_default, is_active)
SELECT 'tax_gst_5', id, 'GST 5%', 5, 'Essential goods GST rate', 0, 1 FROM tenants LIMIT 1;

INSERT OR IGNORE INTO tax_rates (id, tenant_id, name, rate, description, is_default, is_active)
SELECT 'tax_no_tax', id, 'No Tax', 0, 'Tax exempt', 0, 1 FROM tenants LIMIT 1;

-- Insert default invoice template
INSERT OR IGNORE INTO invoice_templates (id, tenant_id, name, description, layout, color_scheme, is_default)
SELECT 'template_modern', id, 'Modern', 'Clean and modern invoice template', 'modern', '#4F46E5', 1 FROM tenants LIMIT 1;

INSERT OR IGNORE INTO invoice_templates (id, tenant_id, name, description, layout, color_scheme, is_default)
SELECT 'template_classic', id, 'Classic', 'Traditional business invoice template', 'classic', '#1F2937', 0 FROM tenants LIMIT 1;

INSERT OR IGNORE INTO invoice_templates (id, tenant_id, name, description, layout, color_scheme, is_default)
SELECT 'template_minimal', id, 'Minimal', 'Minimalist invoice design', 'minimal', '#6B7280', 0 FROM tenants LIMIT 1;

-- Insert default company settings for each tenant
INSERT INTO company_settings (id, tenant_id, company_name, default_currency, invoice_prefix, invoice_start_number) ON CONFLICT DO NOTHING
SELECT 'settings_' || id, id, name, 'INR', 'INV', 1000 FROM tenants;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Phase 1 database schema is now ready for:
-- - Comprehensive invoice management
-- - Payment tracking
-- - Tax rate management
-- - Invoice templates
-- - Company settings configuration
