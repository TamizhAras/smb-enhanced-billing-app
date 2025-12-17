-- Extended schema for AI Insights support
-- Run this migration to add tables needed for full AI analysis

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  cost_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table (for line items in invoices)
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  item_id TEXT,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safely add Foreign Keys
DO $$
BEGIN
    -- Customers FKs
    BEGIN
        ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK customers_tenant_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE customers ADD CONSTRAINT customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK customers_branch_id_fkey: %', SQLERRM; END;

    -- Inventory FKs
    BEGIN
        ALTER TABLE inventory ADD CONSTRAINT inventory_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK inventory_tenant_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE inventory ADD CONSTRAINT inventory_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK inventory_branch_id_fkey: %', SQLERRM; END;

    -- Invoice Items FKs
    BEGIN
        ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK invoice_items_invoice_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES inventory(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK invoice_items_item_id_fkey: %', SQLERRM; END;

    -- Feedback FKs
    BEGIN
        ALTER TABLE feedback ADD CONSTRAINT feedback_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK feedback_tenant_id_fkey: %', SQLERRM; END;

    BEGIN
        ALTER TABLE feedback ADD CONSTRAINT feedback_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'Could not add FK feedback_customer_id_fkey: %', SQLERRM; END;
END $$;
