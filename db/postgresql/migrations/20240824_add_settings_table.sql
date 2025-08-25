-- CreateMigration
CREATE TABLE setting (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_setting_key ON setting(key);