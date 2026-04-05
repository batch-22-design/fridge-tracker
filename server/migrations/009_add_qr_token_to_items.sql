ALTER TABLE items ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS items_qr_token_idx ON items (qr_token);
