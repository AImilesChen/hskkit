-- Preserve the 50-credit allowance already granted to existing welcome trials.
-- New welcome trials explicitly store the current 20-credit allowance.
ALTER TABLE promotional_entitlements ADD COLUMN ai_credits INTEGER;
UPDATE promotional_entitlements
SET ai_credits = 50
WHERE kind = 'welcome_trial' AND ai_credits IS NULL;
