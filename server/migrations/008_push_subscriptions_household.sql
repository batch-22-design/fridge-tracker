ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS household_id INT REFERENCES households(id);

UPDATE push_subscriptions SET household_id = 1 WHERE household_id IS NULL;

ALTER TABLE push_subscriptions
  ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE push_subscriptions
  DROP COLUMN IF EXISTS user_id;
