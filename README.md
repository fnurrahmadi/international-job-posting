# Relocate Jobs

A production-shaped job discovery service for analytics roles with visa sponsorship and relocation signals. It collects public postings from employer ATS boards and job networks, normalizes and deduplicates them in PostgreSQL, and exposes recent matches through a Next.js app.

## Architecture

```text
Greenhouse ─┐
Lever ──────┼─> fetch + validate ─> normalize ─> role filter ─> visa rules
Ashby ──────┘                                               │
                                                            v
                                                     PostgreSQL
                                                            │
                                               Next.js server components
```

The web process and ingestion process are separate. The ingestion CLI can run in GitHub Actions today and move to a container or queue worker later without changing the collectors or database model.

## Free deployment stack

- **Web:** Vercel Hobby for a personal, non-commercial deployment.
- **Database:** Neon Free PostgreSQL. Use its pooled connection string as `DATABASE_URL`.
- **Scheduler:** GitHub Actions. Public repositories receive free standard hosted-runner usage; private repositories receive an included monthly allowance.
- **Email alerts:** Resend Free. A verified sending domain is required before sending to arbitrary subscribers.

Free tiers have usage and fair-use limits. The code is provider-neutral: any PostgreSQL host and any Node.js scheduler can replace these services.

## Local setup

Requirements: Node.js 20.9+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm ingest
pnpm dev
```

Set `DATABASE_URL` in your shell for the CLI commands. Next.js also reads `.env.local` automatically.

Company boards are configured in [`config/companies.json`](config/companies.json). Each record needs an ATS type and the public board identifier.

Current adapters cover Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee, Personio, Workable,
Workday, Comeet, Breezy, Teamtailor, Pinpoint, Jobvite, Arbeitnow, SAP SuccessFactors, and Oracle
Recruiting Cloud, plus Bolt's careers platform, Attrax-powered sites such as Wise, and Vinted's
custom Greenhouse-backed careers site. Workday,
SuccessFactors, and Oracle entries use explicit verified public feed URLs;
unverified enterprise tenants should remain disabled until their feeds pass `pnpm sources:audit`.

## Daily ingestion

The workflow in `.github/workflows/ingest-jobs.yml` runs daily at approximately 02:17 Asia/Bangkok (19:17 UTC) and can also be started manually. Add a repository Actions secret named `DATABASE_URL` before enabling it. To enable saved-search emails, also add Actions secrets `RESEND_API_KEY` and `ALERT_FROM_EMAIL`, plus an Actions variable `APP_BASE_URL` containing the production URL. Without the email secrets, the alert step exits successfully without sending.

Every successful company fetch is authoritative for that company: unseen postings are marked closed. A failed fetch never closes that company's existing jobs. Upserts make reruns safe. After ingestion, every active stored job is reclassified with the latest rules, so wording and ranking improvements apply to older postings without manual labels. The rotating link check closes definitively dead jobs only after two failures.

## Classification behavior

Only target analytics role families are stored. Visa and relocation fields use `YES`, `NO`, or `UNKNOWN`; missing or conditional language is never interpreted as confirmed support. Role-specific negative work-authorization or relocation language takes precedence over generic benefits, and application screening questions are not treated as offers of support. Normalization also records inferred posting countries and explicitly stated eligible countries without relying on a paid geocoding service.

This milestone uses deterministic rules so ingestion remains free and auditable. A later classifier can add an LLM fallback only for `UNKNOWN` records without changing the schema.

Candidate titles are now evaluated against their descriptions before storage, allowing analytics-heavy roles with unconventional names to pass while retaining a strict final relevance check. Support results are ranked with an explainable 0–100 score based on explicit visa, relocation, international-candidate, work-authorization, and evidence signals.

The separate **Possible international opportunities** filter surfaces nationality-inclusive or similar international-friendly wording when visa and relocation remain `UNKNOWN`. It never changes either factual field to `YES`, excludes roles with explicit sponsorship restrictions, and shows the exact text that caused the possible label.

The ingestion workflow checks a rotating batch of application links on each run. Definitive 404/410 responses or redirects to a generic homepage must fail twice before a job is closed; transient network and access errors do not close jobs.

To audit a new employer page without adding it to production, run `pnpm sources:discover -- <careers-url>`. The command detects supported ATS links, validates the public feed, measures relevant-job yield, and prints a candidate configuration entry.

## Commands

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm alerts:send
pnpm jobs:reclassify
pnpm jobs:check-links
pnpm sources:discover -- https://example.com/careers
```
