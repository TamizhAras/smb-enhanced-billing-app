-- Enhanced Schema for Comprehensive AI Insights
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
