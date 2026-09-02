ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS role_category TEXT NOT NULL DEFAULT 'ANALYTICS';

ALTER TABLE saved_searches DROP CONSTRAINT IF EXISTS saved_searches_role_category_check;
ALTER TABLE saved_searches ADD CONSTRAINT saved_searches_role_category_check
  CHECK (role_category IN ('ANALYTICS', 'DATA_ML', 'PRODUCT'));

ALTER TABLE saved_searches DROP CONSTRAINT IF EXISTS saved_searches_email_support_filter_country_code_key;
ALTER TABLE saved_searches DROP CONSTRAINT IF EXISTS saved_searches_email_support_filter_role_category_country_code_key;
ALTER TABLE saved_searches ADD CONSTRAINT saved_searches_email_support_filter_role_category_country_code_key
  UNIQUE (email, support_filter, role_category, country_code);

CREATE INDEX IF NOT EXISTS classifications_role_support_idx
  ON job_classifications (role_family, support_score DESC);
