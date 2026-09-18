ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_ats_type_check;
ALTER TABLE companies ADD CONSTRAINT companies_ats_type_check
  CHECK (ats_type IN (
    'greenhouse', 'lever', 'ashby', 'smartrecruiters', 'recruitee', 'personio', 'workable', 'workday',
    'comeet', 'breezy', 'teamtailor', 'pinpoint', 'jobvite', 'arbeitnow', 'successfactors', 'oracle',
    'bolt', 'attrax', 'vinted', 'thehub'
  ));
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_currency CHAR(3),
  ADD COLUMN IF NOT EXISTS salary_period TEXT;

ALTER TABLE job_classifications
  ADD COLUMN IF NOT EXISTS role_match_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relocation_confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visa_confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relocation_scope TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS permit_feasibility TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS permit_pathway TEXT,
  ADD COLUMN IF NOT EXISTS permit_reason TEXT,
  ADD COLUMN IF NOT EXISTS permit_rule_version TEXT,
  ADD COLUMN IF NOT EXISTS non_eu_eligible TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS relocation_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visa_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS english_speaking TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS local_language_required TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS language_requirements JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE job_classifications DROP CONSTRAINT IF EXISTS job_classifications_relocation_scope_check;
ALTER TABLE job_classifications ADD CONSTRAINT job_classifications_relocation_scope_check CHECK (relocation_scope IN ('GLOBAL','EU_ONLY','EEA_ONLY','COUNTRY_ONLY','UNKNOWN'));
ALTER TABLE job_classifications DROP CONSTRAINT IF EXISTS job_classifications_permit_feasibility_check;
ALTER TABLE job_classifications ADD CONSTRAINT job_classifications_permit_feasibility_check CHECK (permit_feasibility IN ('HIGH','POSSIBLE','LOW','UNKNOWN'));
ALTER TABLE job_classifications DROP CONSTRAINT IF EXISTS job_classifications_non_eu_eligible_check;
ALTER TABLE job_classifications ADD CONSTRAINT job_classifications_non_eu_eligible_check CHECK (non_eu_eligible IN ('YES','NO','UNKNOWN'));

CREATE INDEX IF NOT EXISTS jobs_nordic_active_idx ON jobs (country_code, posted_at DESC) WHERE status = 'ACTIVE' AND country_code IN ('DK','FI');
CREATE INDEX IF NOT EXISTS classifications_nordic_access_idx ON job_classifications (non_eu_eligible, permit_feasibility, relocation_scope);
