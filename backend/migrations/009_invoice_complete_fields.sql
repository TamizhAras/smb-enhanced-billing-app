-- Migration 009: Add ALL missing invoice columns
-- This migration adds payment_terms, currency, exchange_rate, footer_text, template_id, po_number, project_id, tags, last_reminder_date

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN payment_terms TEXT;
ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'INR';
ALTER TABLE invoices ADD COLUMN exchange_rate REAL DEFAULT 1.0;
ALTER TABLE invoices ADD COLUMN footer_text TEXT;
ALTER TABLE invoices ADD COLUMN template_id TEXT;
ALTER TABLE invoices ADD COLUMN po_number TEXT;
ALTER TABLE invoices ADD COLUMN project_id TEXT;
ALTER TABLE invoices ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE invoices ADD COLUMN last_reminder_date TEXT;
ALTER TABLE invoices ADD COLUMN amount REAL; -- Legacy compatibility column

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_invoices_template_id ON invoices(template_id);
CREATE INDEX IF NOT EXISTS idx_invoices_po_number ON invoices(po_number);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);
