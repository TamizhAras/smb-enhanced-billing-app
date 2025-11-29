-- Final alignment of all missing columns

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0;

-- Add missing columns to tax_rates table
ALTER TABLE tax_rates ADD COLUMN is_default INTEGER DEFAULT 0;

-- Add missing columns to invoice_templates table
ALTER TABLE invoice_templates ADD COLUMN color_scheme TEXT;
ALTER TABLE invoice_templates ADD COLUMN custom_fields TEXT; -- JSON

-- Update existing tax_rates to set one as default if none exists
UPDATE tax_rates 
SET is_default = 1 
WHERE id = (SELECT id FROM tax_rates ORDER BY rate DESC LIMIT 1)
AND (SELECT COUNT(*) FROM tax_rates WHERE is_default = 1) = 0;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_tax_rates_is_default ON tax_rates(is_default);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_default ON invoice_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_invoices_tax_rate ON invoices(tax_rate);
