-- Migration: 003_add_sent_at_column
-- Description: Add sent_at column to track when emails were actually sent (vs just marked as responded)
-- Created: 2026-01-10

ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Create index for efficient queries on unsent responded emails
CREATE INDEX IF NOT EXISTS idx_email_inbox_sent_at ON email_inbox(sent_at);

COMMENT ON COLUMN email_inbox.sent_at IS 'Timestamp when the response was actually sent via SMTP';
