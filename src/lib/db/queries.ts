import { getSql } from "./client";

export type SupportFilter = "supported" | "visa" | "relocation" | "possible" | "all";

export async function getDashboardStats() {
  const sql = getSql();
  const [row] = await sql<[{ jobs: number; companies: number; sponsor_positive: number }]>`
    SELECT
      COUNT(*)::int AS jobs,
      COUNT(DISTINCT j.company_id)::int AS companies,
      COUNT(*) FILTER (WHERE c.visa_sponsorship = 'YES' OR c.relocation_support = 'YES')::int AS sponsor_positive
    FROM jobs j
    JOIN job_classifications c ON c.job_id = j.id
    WHERE j.status = 'ACTIVE'
  `;
  return { jobs: row.jobs, companies: row.companies, sponsorPositive: row.sponsor_positive };
}

export async function getRecentJobs(limit: number, supportFilter: SupportFilter = "supported") {
  const sql = getSql();
  const supportPredicate = supportFilter === "visa"
    ? sql`AND c.visa_sponsorship = 'YES'`
    : supportFilter === "relocation"
      ? sql`AND c.relocation_support = 'YES'`
      : supportFilter === "possible"
        ? sql`AND c.possible_support = TRUE AND c.visa_sponsorship = 'UNKNOWN' AND c.relocation_support = 'UNKNOWN'`
      : supportFilter === "all"
        ? sql``
        : sql`AND (c.visa_sponsorship = 'YES' OR c.relocation_support = 'YES')`;

  return sql<Array<{
    id: string; title: string; company: string; location: string; url: string;
    roleFamily: string; visaSponsorship: string; relocationSupport: string; evidence: string[];
    possibleSupport: boolean; possibleEvidence: string[]; supportScore: number;
  }>>`
    WITH ranked AS (
      SELECT j.id, j.title, j.location, j.url, j.posted_at, j.first_seen_at, co.name AS company,
        c.role_family, c.visa_sponsorship, c.relocation_support, c.evidence, c.support_score,
        c.possible_support, c.possible_evidence,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(co.name), LOWER(REGEXP_REPLACE(j.title, '[^a-zA-Z0-9]+', '', 'g')),
            LOWER(COALESCE(j.location, ''))
          ORDER BY j.last_seen_at DESC, j.id DESC
        ) AS duplicate_rank
      FROM jobs j
      JOIN companies co ON co.id = j.company_id
      JOIN job_classifications c ON c.job_id = j.id
      WHERE j.status = 'ACTIVE'
      ${supportPredicate}
    )
    SELECT id::text, title, company, location, url, role_family AS "roleFamily",
      visa_sponsorship AS "visaSponsorship", relocation_support AS "relocationSupport", evidence,
      support_score AS "supportScore", possible_support AS "possibleSupport",
      possible_evidence AS "possibleEvidence"
    FROM ranked
    WHERE duplicate_rank = 1
    ORDER BY support_score DESC, COALESCE(posted_at, first_seen_at) DESC
    LIMIT ${Math.min(Math.max(limit, 1), 100)}
  `;
}

export async function getJobById(id: string) {
  const sql = getSql();
  const [job] = await sql<Array<{
    id: string; title: string; company: string; companyWebsite: string | null; location: string;
    countryCode: string | null; remoteType: string; url: string; descriptionText: string;
    postedAt: Date | null; firstSeenAt: Date; lastSeenAt: Date; status: string; roleFamily: string;
    seniority: string; visaSponsorship: string; relocationSupport: string;
    internationalCandidates: string; existingWorkAuthorizationRequired: string;
    confidence: number; evidence: string[]; possibleSupport: boolean; possibleEvidence: string[];
    supportScore: number; linkStatus: string;
  }>>`
    SELECT j.id::text, j.title, co.name AS company, co.website AS "companyWebsite",
      j.location, j.country_code AS "countryCode", j.remote_type AS "remoteType", j.url,
      j.description_text AS "descriptionText", j.posted_at AS "postedAt",
      j.first_seen_at AS "firstSeenAt", j.last_seen_at AS "lastSeenAt", j.status,
      c.role_family AS "roleFamily", c.seniority, c.visa_sponsorship AS "visaSponsorship",
      c.relocation_support AS "relocationSupport", c.international_candidates AS "internationalCandidates",
      c.existing_work_authorization_required AS "existingWorkAuthorizationRequired",
      c.confidence, c.evidence, c.possible_support AS "possibleSupport",
      c.possible_evidence AS "possibleEvidence", c.support_score AS "supportScore", j.link_status AS "linkStatus"
    FROM jobs j
    JOIN companies co ON co.id = j.company_id
    JOIN job_classifications c ON c.job_id = j.id
    WHERE j.id = ${id}
  `;
  return job ?? null;
}
