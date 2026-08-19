import * as cheerio from "cheerio";
import { z } from "zod";
import type { AtsType, CompanyConfig, RawJob } from "@/lib/jobs/types";
import { classifyRole } from "@/lib/jobs/role-classifier";
import { fetchText } from "./http";

const MAX_DETAIL_PAGES = 150;

const jobPostingSchema = z.object({
  "@type": z.union([z.literal("JobPosting"), z.array(z.string())]),
  title: z.string(),
  description: z.string().default(""),
  datePosted: z.string().nullish(),
  url: z.string().nullish(),
  identifier: z.union([
    z.string(),
    z.object({ value: z.union([z.string(), z.number()]).optional(), name: z.string().optional() }).passthrough(),
  ]).optional(),
  jobLocation: z.unknown().optional(),
  applicantLocationRequirements: z.unknown().optional(),
  employmentType: z.unknown().optional(),
  hiringOrganization: z.object({ name: z.string().optional() }).passthrough().optional(),
}).passthrough();

function flattenJsonLd(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return [value, ...flattenJsonLd(record["@graph"])];
}

function textValues(value: unknown, key: string): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => textValues(item, key));
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const direct = typeof record[key] === "string" ? [record[key]] : [];
  return [...direct, ...Object.values(record).flatMap((item) => textValues(item, key))];
}

function sourceId(identifier: z.infer<typeof jobPostingSchema>["identifier"], fallback: string) {
  if (typeof identifier === "string") return identifier;
  if (identifier?.value != null) return String(identifier.value);
  return identifier?.name ?? fallback;
}

async function mapWithLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
  return results;
}

export async function fetchStructuredCareerJobs(
  company: CompanyConfig,
  source: AtsType,
  jobPathPattern: RegExp,
): Promise<RawJob[]> {
  if (!company.careersUrl) throw new Error(`careersUrl is required for ${source} company ${company.name}`);
  const listingHtml = await fetchText(company.careersUrl, 3, "text/html,application/xhtml+xml");
  const $ = cheerio.load(listingHtml);
  const links = new Map<string, string>();
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, company.careersUrl!);
      if (jobPathPattern.test(url.pathname)) {
        const title = $(element).text().replace(/\s+/g, " ").trim();
        const existing = links.get(url.toString()) ?? "";
        if (title.length > existing.length) links.set(url.toString(), title);
      }
    } catch { /* Ignore malformed links from third-party widgets. */ }
  });

  const titledLinks = [...links].filter(([, title]) => title.length > 2);
  const selectedLinks = titledLinks.length > 0
    ? titledLinks.filter(([, title]) => classifyRole(title))
    : [...links];
  const detailUrls = selectedLinks.map(([url]) => url).slice(0, MAX_DETAIL_PAGES);
  const rows = await mapWithLimit<string, RawJob | null>(detailUrls, 5, async (detailUrl) => {
    const html = await fetchText(detailUrl, 3, "text/html,application/xhtml+xml");
    const page = cheerio.load(html);
    for (const element of page('script[type="application/ld+json"]').toArray()) {
      try {
        const parsed = JSON.parse(page(element).text()) as unknown;
        for (const candidate of flattenJsonLd(parsed)) {
          const result = jobPostingSchema.safeParse(candidate);
          if (!result.success) continue;
          const posting = result.data;
          const location = [...new Set([
            ...textValues(posting.jobLocation, "name"),
            ...textValues(posting.jobLocation, "addressLocality"),
            ...textValues(posting.jobLocation, "addressCountry"),
            ...textValues(posting.applicantLocationRequirements, "name"),
          ])].join(", ");
          return {
            source,
            sourceJobId: sourceId(posting.identifier, detailUrl),
            company,
            title: posting.title,
            descriptionHtml: posting.description,
            location,
            url: posting.url ? new URL(posting.url, detailUrl).toString() : detailUrl,
            postedAt: posting.datePosted ? new Date(posting.datePosted) : null,
            metadata: { employmentType: posting.employmentType ?? null, structuredData: true },
          } satisfies RawJob;
        }
      } catch { /* Try the next JSON-LD block. */ }
    }
    return null;
  });

  return rows.filter((row): row is RawJob => row !== null);
}
