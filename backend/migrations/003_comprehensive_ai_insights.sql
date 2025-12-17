-- Enhanced Schema for Comprehensive AI Insights
-- Migration 003: Extended tables for full AI analysis

-- Staff activity log
CREATE TABLE IF NOT EXISTS staff_activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  reference_id TEXT,
  amount REAL DEFAULT 0,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms INTEGER DEFAULT 30,
  rating REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  po_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_amount REAL NOT NULL,
  expected_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safely add Foreign Keys
DO $$
BEGIN
    -- Staff Activities FKs
    BEGIN
        ALTER TABLE staff_activities ADD CONSTRAINT staff_activities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK staff_activities_tenant_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE staff_activities ADD CONSTRAINT staff_activities_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK staff_activities_branch_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE staff_activities ADD CONSTRAINT staff_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK staff_activities_user_id_fkey: %', SQLERRM; END;

    -- Vendors FKs
    BEGIN
        ALTER TABLE vendors ADD CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK vendors_tenant_id_fkey: %', SQLERRM; END;

    -- Purchase Orders FKs
    BEGIN
        ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK purchase_orders_tenant_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK purchase_orders_branch_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK purchase_orders_vendor_id_fkey: %', SQLERRM; END;

    -- Purchase Order Items FKs
    BEGIN
        ALTER TABLE purchase_order_items ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES purchase_orders(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK purchase_order_items_po_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE purchase_order_items ADD CONSTRAINT purchase_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES inventory(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK purchase_order_items_item_id_fkey: %', SQLERRM; END;
END $$;
