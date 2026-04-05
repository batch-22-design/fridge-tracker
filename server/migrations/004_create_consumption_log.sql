CREATE TABLE IF NOT EXISTS consumption_log (
  id           SERIAL PRIMARY KEY,
  item_id      INT REFERENCES items(id) ON DELETE SET NULL,
  household_id INT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  removed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason       TEXT CHECK (reason IN ('used', 'expired', 'discarded'))
);

CREATE INDEX IF NOT EXISTS consumption_log_household_id_idx ON consumption_log(household_id);
