import { getSql } from "@/lib/db/client";

type LinkResult = "HEALTHY" | "DEAD" | "UNKNOWN";

function looksGeneric(original: string, finalUrl: string) {
  const before = new URL(original);
  const after = new URL(finalUrl);
  const beforeParts = before.pathname.split("/").filter(Boolean);
  const afterParts = after.pathname.split("/").filter(Boolean);
  return beforeParts.length >= 2 && afterParts.length === 0;
}

export async function checkJobLink(url: string): Promise<LinkResult> {
  try {
    let response = await fetch(url, {
      method: "HEAD", redirect: "follow",
      headers: { "User-Agent": "RelocateJobs/0.1 (+job-link-checker)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET", redirect: "follow",
        headers: { "User-Agent": "RelocateJobs/0.1 (+job-link-checker)", Range: "bytes=0-1024" },
        signal: AbortSignal.timeout(10_000),
      });
    }
    if (response.status === 404 || response.status === 410 || (response.url && looksGeneric(url, response.url))) return "DEAD";
    if (response.ok) return "HEALTHY";
    return "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) await worker(items[cursor++]);
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
}

export async function checkActiveJobLinks(limit = 100, concurrency = 5) {
  const sql = getSql();
  const jobs = await sql<Array<{ id: string; url: string }>>`
    SELECT id::text, url FROM jobs WHERE status = 'ACTIVE'
    ORDER BY link_checked_at ASC NULLS FIRST, first_seen_at DESC
    LIMIT ${Math.min(Math.max(limit, 1), 500)}
  `;
  const counts = { checked: 0, healthy: 0, dead: 0, unknown: 0, closed: 0 };
  await mapLimit(jobs, Math.max(1, Math.min(concurrency, 10)), async (job) => {
    const result = await checkJobLink(job.url);
    counts.checked += 1;
    counts[result.toLowerCase() as "healthy" | "dead" | "unknown"] += 1;
    if (result === "DEAD") {
      const [updated] = await sql<[{ failures: number }]>`UPDATE jobs SET link_status = 'DEAD',
        link_checked_at = NOW(), link_failure_count = link_failure_count + 1 WHERE id = ${job.id}
        RETURNING link_failure_count AS failures`;
      if (updated.failures >= 2) {
        await sql`UPDATE jobs SET status = 'CLOSED' WHERE id = ${job.id}`;
        counts.closed += 1;
      }
    } else if (result === "HEALTHY") {
      await sql`UPDATE jobs SET link_status = 'HEALTHY', link_checked_at = NOW(), link_failure_count = 0 WHERE id = ${job.id}`;
    } else {
      await sql`UPDATE jobs SET link_status = 'UNKNOWN', link_checked_at = NOW() WHERE id = ${job.id}`;
    }
  });
  return counts;
}
