-- Comprehensive customer table enhancement
-- Adds all columns expected by CustomerRepository

-- Add all missing customer columns
ALTER TABLE customers ADD COLUMN pan_number TEXT;
ALTER TABLE customers ADD COLUMN type TEXT DEFAULT 'regular' CHECK(type IN ('regular', 'vip', 'wholesale', 'retail'));
ALTER TABLE customers ADD COLUMN category TEXT;
ALTER TABLE customers ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE customers ADD COLUMN total_orders INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN average_order_value REAL DEFAULT 0;
ALTER TABLE customers ADD COLUMN last_order_date DATETIME;
ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0;
ALTER TABLE customers ADD COLUMN payment_terms TEXT;
ALTER TABLE customers ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked'));
ALTER TABLE customers ADD COLUMN preferred_payment_method TEXT;
ALTER TABLE customers ADD COLUMN notes TEXT;
ALTER TABLE customers ADD COLUMN acquisition_source TEXT;
ALTER TABLE customers ADD COLUMN referred_by TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_pan_number ON customers(pan_number);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_date ON customers(last_order_date);

-- Update existing data with defaults
UPDATE customers SET 
  type = 'regular',
  status = 'active',
  total_orders = 0,
  average_order_value = 0,
  tags = '[]'
WHERE type IS NULL OR status IS NULL;
