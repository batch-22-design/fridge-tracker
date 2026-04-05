CREATE TABLE IF NOT EXISTS shopping_list (
  id           SERIAL PRIMARY KEY,
  household_id INT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  quantity     NUMERIC,
  unit         TEXT,
  checked      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shopping_list_household_id_idx ON shopping_list(household_id);
