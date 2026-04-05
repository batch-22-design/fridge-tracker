CREATE TABLE IF NOT EXISTS containers (
  id SERIAL PRIMARY KEY,
  household_id INT REFERENCES households(id) NOT NULL,
  qr_token TEXT UNIQUE NOT NULL,
  name TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
