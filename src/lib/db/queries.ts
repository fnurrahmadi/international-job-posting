import { getSql } from "./client";

export type SupportFilter = "supported" | "visa" | "relocation" | "all";

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
      : supportFilter === "all"
        ? sql``
        : sql`AND (c.visa_sponsorship = 'YES' OR c.relocation_support = 'YES')`;

  return sql<Array<{
    id: string; title: string; company: string; location: string; url: string;
    roleFamily: string; visaSponsorship: string; relocationSupport: string;
  }>>`
    SELECT j.id::text, j.title, co.name AS company, j.location, j.url,
      c.role_family AS "roleFamily", c.visa_sponsorship AS "visaSponsorship",
      c.relocation_support AS "relocationSupport"
    FROM jobs j
    JOIN companies co ON co.id = j.company_id
    JOIN job_classifications c ON c.job_id = j.id
    WHERE j.status = 'ACTIVE'
    ${supportPredicate}
    ORDER BY COALESCE(j.posted_at, j.first_seen_at) DESC
    LIMIT ${Math.min(Math.max(limit, 1), 100)}
  `;
}
