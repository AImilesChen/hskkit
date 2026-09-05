-- Preserve unused welcome-trial AI credits when an account becomes paid Pro.
CREATE TABLE IF NOT EXISTS welcome_credit_rollovers (
  owner_id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL UNIQUE,
  granted_units INTEGER NOT NULL CHECK(granted_units >= 0),
  spent_before_paid INTEGER NOT NULL CHECK(spent_before_paid >= 0),
  initial_remaining_units INTEGER NOT NULL CHECK(initial_remaining_units >= 0),
  remaining_units INTEGER NOT NULL CHECK(remaining_units >= 0),
  conversion_period TEXT NOT NULL CHECK(length(conversion_period) = 7),
  conversion_period_used INTEGER NOT NULL CHECK(conversion_period_used >= 0),
  created_at TEXT NOT NULL,
  CHECK(initial_remaining_units = MAX(0, granted_units - spent_before_paid)),
  CHECK(remaining_units <= initial_remaining_units)
);
CREATE INDEX IF NOT EXISTS welcome_credit_rollovers_subscription_idx ON welcome_credit_rollovers(subscription_id);
