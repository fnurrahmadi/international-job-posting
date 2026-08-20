CREATE TABLE IF NOT EXISTS ingestion_source_results (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES ingestion_runs(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  ats_type TEXT NOT NULL,
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_relevant INTEGER NOT NULL DEFAULT 0,
  supported_jobs INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ingestion_source_results_source_idx
  ON ingestion_source_results (source_name, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  support_filter TEXT NOT NULL DEFAULT 'SUPPORTED'
    CHECK (support_filter IN ('SUPPORTED', 'VISA', 'RELOCATION')),
  country_code CHAR(2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, support_filter, country_code)
);

CREATE TABLE IF NOT EXISTS alert_deliveries (
  saved_search_id BIGINT NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (saved_search_id, job_id)
);
