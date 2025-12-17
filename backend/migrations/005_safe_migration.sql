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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS invoice_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Now add missing columns to existing tables
-- We'll use a safer approach: check if column exists before adding

-- For invoices table, we need to add many columns
-- Postgres supports IF NOT EXISTS for columns in recent versions, but to be safe we use DO block

DO -- Enhanced Schema for Comprehensive AI Insights
-- Migration 003: Extended tables for full AI analysis

-- ============================================
-- STAFF & PERFORMANCE TRACKING
-- ============================================

-- Staff activity log (for performance tracking)
CREATE TABLE IF NOT EXISTS staff_activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'sale', 'refund', 'discount', 'customer_add', 'inventory_update'
  reference_id TEXT, -- invoice_id, customer_id, etc.
  amount REAL DEFAULT 0,
  metadata TEXT, -- JSON for additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- VENDOR MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms INTEGER DEFAULT 30, -- days
  rating REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  po_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, partial, received, cancelled
  total_amount REAL NOT NULL,
  expected_date TIMESTAMP,
  received_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (item_id) REFERENCES inventory(id)
);

-- ============================================
-- SUPPORT & COMPLAINTS
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  customer_id TEXT,
  invoice_id TEXT,
  category TEXT, -- 'product_quality', 'delivery', 'billing', 'service', 'refund', 'other'
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  subject TEXT NOT NULL,
  description TEXT,
  resolution TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- ============================================
-- EXPENSES TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  category TEXT NOT NULL, -- rent, utilities, salary, marketing, etc.
  amount REAL NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- ============================================
-- CUSTOMER INSIGHTS
-- ============================================

CREATE TABLE IF NOT EXISTS customer_segments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  criteria TEXT NOT NULL, -- JSON defining segment rules
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS customer_feedback (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  customer_id TEXT,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  source TEXT, -- 'sms', 'email', 'kiosk'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ============================================
-- AI PREDICTIONS & LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_predictions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  prediction_type TEXT NOT NULL, -- 'sales_forecast', 'churn_risk', 'inventory_restock'
  target_date TIMESTAMP,
  predicted_value REAL,
  confidence_score REAL,
  factors TEXT, -- JSON explanation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_id') THEN
        ALTER TABLE invoices ADD COLUMN customer_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_name') THEN
        ALTER TABLE invoices ADD COLUMN customer_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_email') THEN
        ALTER TABLE invoices ADD COLUMN customer_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_phone') THEN
        ALTER TABLE invoices ADD COLUMN customer_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_address') THEN
        ALTER TABLE invoices ADD COLUMN customer_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
        ALTER TABLE invoices ADD COLUMN issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
        ALTER TABLE invoices ADD COLUMN due_date TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
        ALTER TABLE invoices ADD COLUMN subtotal REAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_amount') THEN
        ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_amount') THEN
        ALTER TABLE invoices ADD COLUMN total_amount REAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_amount') THEN
        ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'outstanding_amount') THEN
        ALTER TABLE invoices ADD COLUMN outstanding_amount REAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'notes') THEN
        ALTER TABLE invoices ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'updated_at') THEN
        ALTER TABLE invoices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END -- Enhanced Schema for Comprehensive AI Insights
-- Migration 003: Extended tables for full AI analysis

-- ============================================
-- STAFF & PERFORMANCE TRACKING
-- ============================================

-- Staff activity log (for performance tracking)
CREATE TABLE IF NOT EXISTS staff_activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'sale', 'refund', 'discount', 'customer_add', 'inventory_update'
  reference_id TEXT, -- invoice_id, customer_id, etc.
  amount REAL DEFAULT 0,
  metadata TEXT, -- JSON for additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- VENDOR MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms INTEGER DEFAULT 30, -- days
  rating REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  po_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, partial, received, cancelled
  total_amount REAL NOT NULL,
  expected_date TIMESTAMP,
  received_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (item_id) REFERENCES inventory(id)
);

-- ============================================
-- SUPPORT & COMPLAINTS
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  customer_id TEXT,
  invoice_id TEXT,
  category TEXT, -- 'product_quality', 'delivery', 'billing', 'service', 'refund', 'other'
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  subject TEXT NOT NULL,
  description TEXT,
  resolution TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- ============================================
-- EXPENSES TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  category TEXT NOT NULL, -- rent, utilities, salary, marketing, etc.
  amount REAL NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- ============================================
-- CUSTOMER INSIGHTS
-- ============================================

CREATE TABLE IF NOT EXISTS customer_segments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  criteria TEXT NOT NULL, -- JSON defining segment rules
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS customer_feedback (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  customer_id TEXT,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  source TEXT, -- 'sms', 'email', 'kiosk'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ============================================
-- AI PREDICTIONS & LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_predictions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  prediction_type TEXT NOT NULL, -- 'sales_forecast', 'churn_risk', 'inventory_restock'
  target_date TIMESTAMP,
  predicted_value REAL,
  confidence_score REAL,
  factors TEXT, -- JSON explanation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);;
