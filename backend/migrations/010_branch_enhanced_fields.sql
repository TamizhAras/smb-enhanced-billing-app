-- Migration: Add additional fields to branches table
-- Date: 2025-12-17
-- Description: Add status, location, contact fields for enhanced branch management

-- Add new columns to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add comment to document the migration
COMMENT ON COLUMN branches.status IS 'Branch status: active or inactive';
COMMENT ON COLUMN branches.location IS 'Physical address or location description';
COMMENT ON COLUMN branches.contact_phone IS 'Branch contact phone number';
COMMENT ON COLUMN branches.contact_email IS 'Branch contact email address';
