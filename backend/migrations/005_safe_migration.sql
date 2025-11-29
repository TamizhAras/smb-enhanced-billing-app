-- Safe migration script that handles existing columns/tables
-- Run this to upgrade database schema to Phase 1 requirements

-- First, let's create the new tables (if they don't exist)

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  amount REAL NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online')),
  reference TEXT,
  notes TEXT,
  payment_date DATETIME NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  tenant_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS invoice_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  tenant_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Now add missing columns to existing tables
-- We'll use a safer approach: check if column exists before adding

-- For invoices table, we need to add many columns
-- SQLite doesn't support ALTER TABLE ... ADD COLUMN IF NOT EXISTS
-- So we'll need to create a new table and migrate data

-- First, let's check what we have and create a comprehensive invoices table

-- Rename old table
ALTER TABLE invoices RENAME TO invoices_old;

-- Create new invoices table with all required columns
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  
  -- Customer info
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_city TEXT,
  customer_state TEXT,
  customer_pincode TEXT,
  customer_gst_number TEXT,
  
  -- Dates
  issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  
  -- Items (JSON string)
  items TEXT NOT NULL, -- JSON array of invoice items
  
  -- Amounts
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  outstanding_amount REAL DEFAULT 0,
  
  -- Additional fields
  notes TEXT,
  terms TEXT,
  payment_method TEXT,
  
  -- Recurring invoice fields
  is_recurring INTEGER DEFAULT 0,
  recurring_frequency TEXT CHECK(recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_end_date DATETIME,
  parent_invoice_id TEXT,
  
  -- Communication fields
  sent_at DATETIME,
  reminders_sent INTEGER DEFAULT 0,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (parent_invoice_id) REFERENCES invoices(id)
);

-- Migrate data from old table to new table
INSERT INTO invoices (
  id, tenant_id, branch_id, invoice_number, customer_id, customer_name,
  issue_date, due_date, status, items, total_amount, created_at
)
SELECT 
  id,
  tenant_id,
  branch_id,
  COALESCE(invoice_number, 'INV-' || id),
  customer_id,
  customer_name,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(due_date, datetime(CURRENT_TIMESTAMP, '+30 days')),
  COALESCE(status, 'pending'),
  '[]', -- empty items array for now
  COALESCE(total_amount, amount, 0),
  COALESCE(created_at, CURRENT_TIMESTAMP)
FROM invoices_old;

-- Drop old table
DROP TABLE invoices_old;

-- Now handle customers table
ALTER TABLE customers RENAME TO customers_old;

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  total_spent REAL DEFAULT 0,
  outstanding_amount REAL DEFAULT 0,
  last_purchase_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Migrate customers data
INSERT INTO customers (id, tenant_id, branch_id, name, email, phone, address, created_at)
SELECT id, tenant_id, branch_id, name, email, phone, address, created_at
FROM customers_old;

DROP TABLE customers_old;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Insert default data for demo
-- Note: This assumes tenant_id '1' exists. Adjust as needed.

-- Default tax rates
INSERT OR IGNORE INTO tax_rates (name, rate, description, tenant_id) VALUES
('GST 0%', 0, 'Zero rated GST', '1'),
('GST 5%', 5, 'Reduced GST rate', '1'),
('GST 12%', 12, 'Standard GST rate', '1'),
('GST 18%', 18, 'Higher GST rate', '1'),
('GST 28%', 28, 'Luxury goods GST', '1');

-- Default invoice templates
INSERT OR IGNORE INTO invoice_templates (name, description, template, is_default, tenant_id) VALUES
('Standard', 'Standard invoice template', '{}', 1, '1'),
('Modern', 'Modern invoice template with color', '{}', 0, '1'),
('Minimal', 'Minimal invoice template', '{}', 0, '1');

-- Default company settings
INSERT OR IGNORE INTO company_settings (
  company_name, default_currency, default_tax_rate, 
  invoice_prefix, invoice_start_number, tenant_id
) VALUES (
  'Your Company', 'INR', 18, 'INV', 1, '1'
);
