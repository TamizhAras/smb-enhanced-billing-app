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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
  expected_date DATETIME,
  received_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- ============================================
-- EXPENSES TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget_monthly REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  category_id TEXT,
  vendor_id TEXT,
  amount REAL NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- ============================================
-- MARKETING & CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'sms', 'whatsapp', 'email', 'discount', 'bundle'
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  start_date DATETIME,
  end_date DATETIME,
  target_segment TEXT, -- JSON: customer segment criteria
  offer_details TEXT, -- JSON: discount, products, etc.
  budget REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS campaign_results (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  sent_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME,
  converted_at DATETIME,
  conversion_amount REAL DEFAULT 0,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ============================================
-- CUSTOMER ENHANCEMENTS
-- ============================================

-- Add columns to customers if not exist (run separately)
-- ALTER TABLE customers ADD COLUMN segment TEXT;
-- ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0;
-- ALTER TABLE customers ADD COLUMN lifetime_value REAL DEFAULT 0;
-- ALTER TABLE customers ADD COLUMN churn_score REAL DEFAULT 0;
-- ALTER TABLE customers ADD COLUMN preferred_channel TEXT;
-- ALTER TABLE customers ADD COLUMN last_purchase_date DATETIME;
-- ALTER TABLE customers ADD COLUMN avg_order_value REAL DEFAULT 0;
-- ALTER TABLE customers ADD COLUMN total_orders INTEGER DEFAULT 0;

-- Customer payment history for credit scoring
CREATE TABLE IF NOT EXISTS customer_payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date DATETIME NOT NULL,
  days_to_pay INTEGER, -- days from invoice date to payment
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- ============================================
-- REFUNDS & RETURNS
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  customer_id TEXT,
  processed_by TEXT NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  approved_by TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ============================================
-- AI INSIGHTS CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  insight_type TEXT NOT NULL,
  insight_category TEXT NOT NULL, -- sales, customer, inventory, financial, fraud, operations, marketing, forecast
  visibility TEXT NOT NULL, -- 'staff', 'owner', 'all'
  priority TEXT DEFAULT 'info', -- critical, warning, info, positive
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL DEFAULT 0,
  data TEXT, -- JSON with detailed data
  actionable INTEGER DEFAULT 0,
  action_taken INTEGER DEFAULT 0,
  action_taken_by TEXT,
  action_taken_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- ============================================
-- SEASONAL CALENDAR
-- ============================================

CREATE TABLE IF NOT EXISTS seasonal_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'festival', 'holiday', 'school', 'sale_event', 'economic'
  region TEXT, -- 'all', 'north', 'south', 'east', 'west', specific state
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  impact_factor REAL DEFAULT 1.0, -- multiplier for demand (1.5 = 50% increase expected)
  affected_categories TEXT, -- JSON array of product categories affected
  notes TEXT,
  recurring INTEGER DEFAULT 1, -- 1 = annual event
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate with common Indian festivals/events
INSERT INTO seasonal_events (id, name, event_type, region, start_date, end_date, impact_factor, affected_categories) VALUES
('diwali-2025', 'Diwali', 'festival', 'all', '2025-10-20', '2025-10-25', 2.5, '["electronics", "clothing", "gifts", "sweets", "home_decor"]'),
('holi-2026', 'Holi', 'festival', 'all', '2026-03-14', '2026-03-15', 1.8, '["colors", "sweets", "beverages", "clothing"]'),
('eid-2025', 'Eid ul-Fitr', 'festival', 'all', '2025-03-30', '2025-04-01', 2.0, '["clothing", "perfumes", "gifts", "food"]'),
('christmas-2025', 'Christmas', 'festival', 'all', '2025-12-20', '2025-12-26', 1.8, '["gifts", "decorations", "food", "clothing"]'),
('school-open-2025', 'School Opening', 'school', 'all', '2025-06-01', '2025-06-15', 2.0, '["stationery", "uniforms", "bags", "books"]'),
('wedding-season-2025', 'Wedding Season', 'economic', 'all', '2025-11-01', '2026-02-28', 1.5, '["jewelry", "clothing", "gifts", "catering"]'),
('republic-day-2026', 'Republic Day Sale', 'sale_event', 'all', '2026-01-20', '2026-01-26', 1.6, '["electronics", "appliances", "clothing"]'),
('summer-vacation-2025', 'Summer Vacation', 'school', 'all', '2025-04-15', '2025-06-15', 1.3, '["travel", "games", "beverages", "ice_cream"]'),
('financial-year-end', 'Financial Year End', 'economic', 'all', '2026-03-15', '2026-03-31', 1.4, '["office_supplies", "electronics", "furniture"]');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_staff_activities_user ON staff_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_activities_date ON staff_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_refunds_invoice ON refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant ON ai_insights_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights_cache(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_visibility ON ai_insights_cache(visibility);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_date ON seasonal_events(start_date, end_date);
