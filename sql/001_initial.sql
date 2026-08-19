CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  careers_url TEXT,
  ats_type TEXT NOT NULL CHECK (ats_type IN ('greenhouse', 'lever', 'ashby')),
  ats_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ats_type, ats_identifier)
);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description_html TEXT NOT NULL,
  description_text TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  country_code CHAR(2),
  remote_type TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (remote_type IN ('REMOTE', 'HYBRID', 'ONSITE', 'UNKNOWN')),
  url TEXT NOT NULL,
  posted_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  content_hash CHAR(64) NOT NULL,
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (source, source_job_id)
);

CREATE INDEX IF NOT EXISTS jobs_active_posted_idx ON jobs (posted_at DESC NULLS LAST) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS jobs_company_status_idx ON jobs (company_id, status);

CREATE TABLE IF NOT EXISTS job_classifications (
  job_id BIGINT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  role_family TEXT NOT NULL,
  seniority TEXT NOT NULL,
  visa_sponsorship TEXT NOT NULL CHECK (visa_sponsorship IN ('YES', 'NO', 'UNKNOWN')),
  relocation_support TEXT NOT NULL CHECK (relocation_support IN ('YES', 'NO', 'UNKNOWN')),
  international_candidates TEXT NOT NULL CHECK (international_candidates IN ('YES', 'NO', 'UNKNOWN')),
  existing_work_authorization_required TEXT NOT NULL CHECK (existing_work_authorization_required IN ('YES', 'NO', 'UNKNOWN')),
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  classifier_version TEXT NOT NULL,
  classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS classifications_role_idx ON job_classifications (role_family);
CREATE INDEX IF NOT EXISTS classifications_visa_idx ON job_classifications (visa_sponsorship, relocation_support);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED')),
  companies_attempted INTEGER NOT NULL DEFAULT 0,
  companies_succeeded INTEGER NOT NULL DEFAULT 0,
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_relevant INTEGER NOT NULL DEFAULT 0,
  error_summary JSONB NOT NULL DEFAULT '[]'::jsonb
);
