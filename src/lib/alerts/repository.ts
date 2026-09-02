import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db/client";
import type { SupportFilter } from "@/lib/db/queries";
import type { RoleCategory } from "@/lib/jobs/types";

export type AlertSupportFilter = Exclude<SupportFilter, "all">;

export async function saveAlert(email: string, supportFilter: AlertSupportFilter, roleCategory: RoleCategory = "analytics", countryCode?: string) {
  const sql = getSql();
  const token = randomUUID();
  const normalizedCountry = countryCode?.trim().toUpperCase() || null;
  const [row] = await sql<[{ id: string; unsubscribeToken: string }]>`
    INSERT INTO saved_searches (email, support_filter, role_category, country_code, unsubscribe_token)
    VALUES (${email.trim().toLowerCase()}, ${supportFilter.toUpperCase()}, ${roleCategory.toUpperCase()}, ${normalizedCountry}, ${token})
    ON CONFLICT (email, support_filter, role_category, country_code) DO UPDATE
      SET active = TRUE, unsubscribe_token = ${token}, updated_at = NOW()
    RETURNING id::text, unsubscribe_token AS "unsubscribeToken"
  `;
  return row;
}

export async function deactivateAlert(token: string) {
  const sql = getSql();
  const result = await sql`UPDATE saved_searches SET active = FALSE, updated_at = NOW()
    WHERE unsubscribe_token = ${token}`;
  return result.count > 0;
}

export async function getPendingAlerts() {
  const sql = getSql();
  return sql<Array<{
    id: string; email: string; supportFilter: string; countryCode: string | null;
    unsubscribeToken: string; jobs: Array<{ id: string; title: string; company: string; location: string; url: string }>;
  }>>`
    SELECT s.id::text, s.email, s.support_filter AS "supportFilter", s.country_code AS "countryCode",
      s.unsubscribe_token AS "unsubscribeToken",
      COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', j.id::text, 'title', j.title, 'company', co.name, 'location', j.location, 'url', j.url
      ) ORDER BY COALESCE(j.posted_at, j.first_seen_at) DESC) FILTER (WHERE j.id IS NOT NULL), '[]') AS jobs
    FROM saved_searches s
    LEFT JOIN jobs j ON j.status = 'ACTIVE'
      AND (s.country_code IS NULL OR j.country_code = s.country_code)
      AND j.first_seen_at >= COALESCE(s.last_sent_at, s.created_at - INTERVAL '1 day')
    LEFT JOIN companies co ON co.id = j.company_id
    LEFT JOIN job_classifications c ON c.job_id = j.id
      AND CASE s.role_category
        WHEN 'DATA_ML' THEN c.role_family IN ('data_science', 'data_engineering', 'machine_learning')
        WHEN 'PRODUCT' THEN c.role_family = 'product_management'
        ELSE c.role_family NOT IN ('data_science', 'data_engineering', 'machine_learning', 'product_management')
      END
      AND CASE s.support_filter
        WHEN 'VISA' THEN c.visa_sponsorship = 'YES'
        WHEN 'RELOCATION' THEN c.relocation_support = 'YES'
        WHEN 'POSSIBLE' THEN c.possible_support = TRUE AND c.visa_sponsorship = 'UNKNOWN' AND c.relocation_support = 'UNKNOWN'
        ELSE c.visa_sponsorship = 'YES' OR c.relocation_support = 'YES'
      END
    LEFT JOIN alert_deliveries d ON d.saved_search_id = s.id AND d.job_id = j.id
    WHERE s.active = TRUE AND d.job_id IS NULL
      AND (j.id IS NULL OR c.job_id IS NOT NULL)
    GROUP BY s.id
  `;
}

export async function recordAlertDelivery(searchId: string, jobIds: string[]) {
  if (jobIds.length === 0) return;
  const sql = getSql();
  await sql.begin(async (tx) => {
    for (const jobId of jobIds) {
      await tx`INSERT INTO alert_deliveries (saved_search_id, job_id) VALUES (${searchId}, ${jobId})
        ON CONFLICT DO NOTHING`;
    }
    await tx`UPDATE saved_searches SET last_sent_at = NOW(), updated_at = NOW() WHERE id = ${searchId}`;
  });
}
