CREATE TABLE IF NOT EXISTS items (
  id           SERIAL PRIMARY KEY,
  household_id INT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  quantity     NUMERIC,
  unit         TEXT,
  expiry_date  DATE,
  added_by     INT REFERENCES users(id) ON DELETE SET NULL,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS items_household_id_idx ON items(household_id);
CREATE INDEX IF NOT EXISTS items_expiry_date_idx ON items(expiry_date) WHERE removed_at IS NULL;
