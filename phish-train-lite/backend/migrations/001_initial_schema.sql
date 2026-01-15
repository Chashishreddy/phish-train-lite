-- Migration: Initial Schema
-- Description: Creates all core tables for Phish Train Lite
-- Date: 2025-01-20

-- This migration is for reference - tables are already created via db.js
-- Future migrations should be added as numbered files (002_, 003_, etc.)

-- Example of how to add new columns in future migrations:
-- ALTER TABLE campaigns ADD COLUMN new_field TEXT;

-- Example of adding indexes:
-- CREATE INDEX IF NOT EXISTS idx_campaign_events_email ON campaign_events(email);
-- CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON campaign_events(campaign_id);
-- CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign_id ON campaign_targets(campaign_id);
