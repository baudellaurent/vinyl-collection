-- Migration 002: Add master_id column for Discogs master release tracking
ALTER TABLE vinyls ADD COLUMN IF NOT EXISTS master_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_vinyls_master_id ON vinyls(master_id);
