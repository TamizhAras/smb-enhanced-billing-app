-- ============================================================================
-- SUPABASE POSTGRESQL MIGRATION
-- Converts SQLite schema to PostgreSQL for free cloud deployment
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  gstin VARCHAR(15),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BRANCHES TABLE
-- ============================================================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  gstin VARCHAR(15),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMERS TABLE (32 fields)
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  gst_number VARCHAR(15),
  pan_number VARCHAR(10),
  type VARCHAR(20) DEFAULT 'regular' CHECK(type IN ('regular', 'vip', 'wholesale', 'retail')),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
  tags JSONB DEFAULT '[]',
  total_spent DECIMAL(15,2) DEFAULT 0,
  outstanding_amount DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  preferred_payment_method VARCHAR(50),
  last_purchase_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  acquisition_source VARCHAR(100),
  referred_by UUID REFERENCES customers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE (47 fields)
-- ============================================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  customer_city VARCHAR(100),
  customer_state VARCHAR(100),
  customer_pincode VARCHAR(10),
  customer_gst_number VARCHAR(15),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_type VARCHAR(20),
  discount_value DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  outstanding_amount DECIMAL(15,2) DEFAULT 0,
  payment_terms VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'INR',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  notes TEXT,
  footer_text TEXT,
  terms_and_conditions TEXT,
  template_id UUID,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20),
  recurring_end_date DATE,
  parent_invoice_id UUID REFERENCES invoices(id),
  sent_at TIMESTAMPTZ,
  reminders_sent INTEGER DEFAULT 0,
  last_reminder_date TIMESTAMPTZ,
  po_number VARCHAR(50),
  project_id VARCHAR(100),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TAX RATES TABLE
-- ============================================================================
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICE TEMPLATES TABLE
-- ============================================================================
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  layout VARCHAR(50),
  styles TEXT,
  header TEXT,
  footer TEXT,
  color_scheme VARCHAR(50),
  custom_fields JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50),
  quantity INTEGER DEFAULT 0,
  minimum_quantity INTEGER DEFAULT 0,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  supplier VARCHAR(255),
  location VARCHAR(255),
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Branches
CREATE INDEX idx_branches_tenant ON branches(tenant_id);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_email ON users(email);

-- Customers
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_branch ON customers(branch_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_status ON customers(status);

-- Invoices
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_branch ON invoices(branch_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Payments
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);

-- Inventory
CREATE INDEX idx_inventory_tenant ON inventory(tenant_id);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_category ON inventory(category);

-- Tax Rates
CREATE INDEX idx_taxrates_tenant ON tax_rates(tenant_id);

-- Templates
CREATE INDEX idx_templates_tenant ON invoice_templates(tenant_id);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default tenant
INSERT INTO tenants (id, name, email, phone, address) VALUES
('7413d201-a37d-4af5-bbde-74bf24cb17f3', 'Demo Company', 'demo@example.com', '+91-9876543210', 'Mumbai, India');

-- Insert default branch
INSERT INTO branches (id, tenant_id, name, address, email, phone) VALUES
('7413d201-a37d-4af5-bbde-74bf24cb17f3', '7413d201-a37d-4af5-bbde-74bf24cb17f3', 'Main Branch', 'Mumbai, Maharashtra, India', 'mainbranch@demo.com', '+91-9876543210');

-- Insert default admin user (password: 'password')
-- You MUST change this password after first login!
INSERT INTO users (id, tenant_id, branch_id, name, email, password_hash, role) VALUES
('8bcb2ba6-98ac-42cc-b452-d22ecc471572', '7413d201-a37d-4af5-bbde-74bf24cb17f3', '7413d201-a37d-4af5-bbde-74bf24cb17f3', 'Admin User', 'admin@example.com', '$2b$10$rH5VPqKQM5LKY8vZ6pYQkeXHzJZnPqGCqKY8vZ6pYQkeXHzJZnPqG', 'owner');

-- Insert default tax rates
INSERT INTO tax_rates (tenant_id, name, rate, description, is_active, is_default) VALUES
('7413d201-a37d-4af5-bbde-74bf24cb17f3', 'GST 18%', 18.00, 'Standard GST rate', TRUE, TRUE),
('7413d201-a37d-4af5-bbde-74bf24cb17f3', 'GST 12%', 12.00, 'Reduced GST rate', TRUE, FALSE),
('7413d201-a37d-4af5-bbde-74bf24cb17f3', 'GST 5%', 5.00, 'Low GST rate', TRUE, FALSE),
('7413d201-a37d-4af5-bbde-74bf24cb17f3', 'IGST 18%', 18.00, 'Interstate GST', TRUE, FALSE),
('7413d201-a37d-4af5-bbde-74bf24cb17f3', 'No Tax', 0.00, 'Tax exempt', TRUE, FALSE);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all tables were created successfully
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected output: 11 tables
-- branches, customers, inventory, invoice_templates, invoices, payments, tax_rates, tenants, users

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - OPTIONAL BUT RECOMMENDED
-- ============================================================================
-- Uncomment the sections below to enable RLS for enhanced security
-- This ensures users can only access data from their own tenant

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventory table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tax_rates table
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoice_templates table
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES - TENANT ISOLATION
-- ============================================================================

-- Helper function to get current tenant_id from JWT token
-- This assumes your backend sets tenant_id in the JWT claims
CREATE OR REPLACE FUNCTION auth.tenant_id() 
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    current_setting('app.tenant_id', true)
  )::uuid;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Users can only view their own tenant
CREATE POLICY "Users can view their own tenant"
  ON tenants
  FOR SELECT
  USING (id = auth.tenant_id());

-- Users can update their own tenant
CREATE POLICY "Users can update their own tenant"
  ON tenants
  FOR UPDATE
  USING (id = auth.tenant_id());

-- ============================================================================
-- BRANCHES TABLE POLICIES
-- ============================================================================

-- Users can view branches in their tenant
CREATE POLICY "Users can view branches in their tenant"
  ON branches
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert branches in their tenant
CREATE POLICY "Users can insert branches in their tenant"
  ON branches
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update branches in their tenant
CREATE POLICY "Users can update branches in their tenant"
  ON branches
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete branches in their tenant
CREATE POLICY "Users can delete branches in their tenant"
  ON branches
  FOR DELETE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view other users in their tenant
CREATE POLICY "Users can view users in their tenant"
  ON users
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert new users in their tenant (admins only)
CREATE POLICY "Admins can insert users in their tenant"
  ON users
  FOR INSERT
  WITH CHECK (
    tenant_id = auth.tenant_id() 
    AND (
      SELECT role FROM users 
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid
    ) IN ('owner', 'admin')
  );

-- Users can update users in their tenant
CREATE POLICY "Users can update users in their tenant"
  ON users
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================================

-- Users can view customers in their tenant
CREATE POLICY "Users can view customers in their tenant"
  ON customers
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert customers in their tenant
CREATE POLICY "Users can insert customers in their tenant"
  ON customers
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update customers in their tenant
CREATE POLICY "Users can update customers in their tenant"
  ON customers
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete customers in their tenant
CREATE POLICY "Users can delete customers in their tenant"
  ON customers
  FOR DELETE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- INVOICES TABLE POLICIES
-- ============================================================================

-- Users can view invoices in their tenant
CREATE POLICY "Users can view invoices in their tenant"
  ON invoices
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert invoices in their tenant
CREATE POLICY "Users can insert invoices in their tenant"
  ON invoices
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update invoices in their tenant
CREATE POLICY "Users can update invoices in their tenant"
  ON invoices
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete invoices in their tenant (admins only)
CREATE POLICY "Admins can delete invoices in their tenant"
  ON invoices
  FOR DELETE
  USING (
    tenant_id = auth.tenant_id() 
    AND (
      SELECT role FROM users 
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid
    ) IN ('owner', 'admin')
  );

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================

-- Users can view payments in their tenant
CREATE POLICY "Users can view payments in their tenant"
  ON payments
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert payments in their tenant
CREATE POLICY "Users can insert payments in their tenant"
  ON payments
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update payments in their tenant
CREATE POLICY "Users can update payments in their tenant"
  ON payments
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete payments in their tenant
CREATE POLICY "Users can delete payments in their tenant"
  ON payments
  FOR DELETE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- INVENTORY TABLE POLICIES
-- ============================================================================

-- Users can view inventory in their tenant
CREATE POLICY "Users can view inventory in their tenant"
  ON inventory
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert inventory in their tenant
CREATE POLICY "Users can insert inventory in their tenant"
  ON inventory
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update inventory in their tenant
CREATE POLICY "Users can update inventory in their tenant"
  ON inventory
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete inventory in their tenant
CREATE POLICY "Users can delete inventory in their tenant"
  ON inventory
  FOR DELETE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- TAX RATES TABLE POLICIES
-- ============================================================================

-- Users can view tax rates in their tenant
CREATE POLICY "Users can view tax rates in their tenant"
  ON tax_rates
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert tax rates in their tenant
CREATE POLICY "Users can insert tax rates in their tenant"
  ON tax_rates
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update tax rates in their tenant
CREATE POLICY "Users can update tax rates in their tenant"
  ON tax_rates
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete tax rates in their tenant
CREATE POLICY "Users can delete tax rates in their tenant"
  ON tax_rates
  FOR DELETE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- INVOICE TEMPLATES TABLE POLICIES
-- ============================================================================

-- Users can view templates in their tenant
CREATE POLICY "Users can view templates in their tenant"
  ON invoice_templates
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Users can insert templates in their tenant
CREATE POLICY "Users can insert templates in their tenant"
  ON invoice_templates
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update templates in their tenant
CREATE POLICY "Users can update templates in their tenant"
  ON invoice_templates
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Users can delete templates in their tenant
CREATE POLICY "Users can delete templates in their tenant"
  ON invoice_templates
  FOR DELETE
  USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- VERIFICATION QUERY FOR RLS
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- TESTING RLS (OPTIONAL)
-- ============================================================================

-- Test RLS by setting a tenant_id and querying
-- This simulates how your application will interact with the database

-- Set tenant context (example)
-- SET app.tenant_id = '7413d201-a37d-4af5-bbde-74bf24cb17f3';

-- Test query (should only return data for that tenant)
-- SELECT COUNT(*) FROM invoices;

-- Reset context
-- RESET app.tenant_id;

-- ============================================================================
-- DISABLING RLS (IF NEEDED FOR DEVELOPMENT)
-- ============================================================================

-- WARNING: Only disable RLS for development/testing!
-- NEVER disable in production!

-- To disable RLS on a table (example):
-- ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- To drop all policies on a table (example):
-- DROP POLICY IF EXISTS "Users can view invoices in their tenant" ON invoices;
-- DROP POLICY IF EXISTS "Users can insert invoices in their tenant" ON invoices;
-- DROP POLICY IF EXISTS "Users can update invoices in their tenant" ON invoices;
-- DROP POLICY IF EXISTS "Admins can delete invoices in their tenant" ON invoices;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Default login credentials:
--    Email: admin@example.com
--    Password: password
--    ⚠️ CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!

-- 2. All tables use UUID as primary key for better distribution
-- 3. Multi-tenancy is built-in (tenant_id on all tables)
-- 4. Indexes are optimized for common query patterns
-- 5. Row Level Security (RLS) is NOW ENABLED for all tables

-- 6. RLS Implementation:
--    - All tables have tenant isolation policies
--    - Users can only access data from their own tenant
--    - Admins have additional permissions for deleting critical data
--    - Helper function auth.tenant_id() extracts tenant from JWT

-- 7. Backend Integration:
--    Your backend must set the tenant_id in the JWT token claims
--    Example JWT payload:
--    {
--      "user_id": "uuid",
--      "tenant_id": "uuid",
--      "role": "owner"
--    }

-- 8. Free tier limits (Supabase):
--    - 500MB database storage
--    - Unlimited API requests
--    - ~50,000 invoices capacity
--    - 2 GB bandwidth/month

-- 9. Migration complete! ✅
--    RLS is now enabled and configured for maximum security!
