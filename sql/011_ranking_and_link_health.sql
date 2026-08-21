ALTER TABLE job_classifications
  ADD COLUMN IF NOT EXISTS support_score INTEGER NOT NULL DEFAULT 0
  CHECK (support_score >= 0 AND support_score <= 100);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS link_status TEXT NOT NULL DEFAULT 'UNCHECKED'
    CHECK (link_status IN ('UNCHECKED', 'HEALTHY', 'DEAD', 'UNKNOWN')),
  ADD COLUMN IF NOT EXISTS link_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS link_failure_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS jobs_link_check_idx
  ON jobs (link_checked_at NULLS FIRST) WHERE status = 'ACTIVE';
