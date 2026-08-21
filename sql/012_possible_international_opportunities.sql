ALTER TABLE job_classifications
  ADD COLUMN IF NOT EXISTS possible_support BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS possible_evidence JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE saved_searches DROP CONSTRAINT IF EXISTS saved_searches_support_filter_check;
ALTER TABLE saved_searches ADD CONSTRAINT saved_searches_support_filter_check
  CHECK (support_filter IN ('SUPPORTED', 'VISA', 'RELOCATION', 'POSSIBLE'));

CREATE INDEX IF NOT EXISTS classifications_possible_support_idx
  ON job_classifications (possible_support) WHERE possible_support = TRUE;
