CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_json JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
