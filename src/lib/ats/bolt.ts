import * as cheerio from "cheerio";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { classifyRole } from "@/lib/jobs/role-classifier";
import { fetchText } from "./http";

const MAX_PAGES = 20;

interface BoltSummary { id: string; title: string; department: string; location: string; url: string }

async function mapWithLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function consume() { while (cursor < items.length) { const index = cursor++; results[index] = await worker(items[index]); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
  return results;
}

function decodeNextPayload(html: string): string {
  const $ = cheerio.load(html);
  const chunks: string[] = [];
  $("script").each((_index, element) => {
    const script = $(element).html() ?? "";
    const matches = script.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g);
    for (const match of matches) {
      try { chunks.push(JSON.parse(match[1]) as string); } catch { /* Ignore unrelated script chunks. */ }
    }
  });
  return chunks.join("\n");
}

export function parseBoltListing(html: string, careersUrl: string): BoltSummary[] {
  const $ = cheerio.load(html);
  return $('[data-testid="AccordionItem"]').toArray().flatMap((element) => {
    const item = $(element);
    const columns = item.find("h3 button > div > div");
    const title = columns.eq(0).text().replace(/\s+/g, " ").trim();
    const href = item.find('a[href*="/careers/positions/"]').filter((_i, link) => !($(link).attr("href") ?? "").includes("tab=apply")).attr("href");
    if (!href || !classifyRole(title)) return [];
    const url = new URL(href, careersUrl).toString();
    const id = new URL(url).pathname.split("/").filter(Boolean).at(-1);
    if (!id) return [];
    return [{
      id, title,
      department: columns.eq(1).text().replace(/\s+/g, " ").trim(),
      location: columns.eq(2).text().replace(/\s+/g, " ").trim(),
      url,
    }];
  });
}

export function parseBoltDetail(html: string): string {
  const payload = decodeNextPayload(html);
  const normalized = payload.replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&");
  const marker = normalized.search(/(?:About the role|Main tasks and responsibilities|Your daily adventures)/i);
  if (marker < 0) return normalized.slice(-20_000);
  return normalized.slice(Math.max(0, marker - 6_000), marker + 20_000);
}

export async function fetchBolt(company: CompanyConfig): Promise<RawJob[]> {
  if (!company.careersUrl) throw new Error(`careersUrl is required for Bolt company ${company.name}`);
  const summaries = new Map<string, BoltSummary>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(company.careersUrl);
    url.searchParams.set("page", String(page));
    const pageHtml = await fetchText(url.toString(), 3, "text/html,application/xhtml+xml");
    const rows = parseBoltListing(pageHtml, company.careersUrl);
    let added = 0;
    for (const row of rows) { if (!summaries.has(row.id)) added += 1; summaries.set(row.id, row); }
    if ($pageJobCount(pageHtml) === 0) break;
    if (page > 1 && added === 0 && rows.length > 0) break;
  }

  const rows = await mapWithLimit([...summaries.values()], 5, async (summary): Promise<RawJob | null> => {
    try {
      return {
        source: "bolt",
        sourceJobId: summary.id,
        company,
        title: summary.title,
        descriptionHtml: parseBoltDetail(await fetchText(summary.url, 3, "text/html,application/xhtml+xml")),
        location: summary.location,
        url: summary.url,
        postedAt: null,
        metadata: { department: summary.department, nextServerPayload: true },
      };
    } catch (error) {
      console.warn(`Bolt skipped stale job ${summary.id}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  });
  const jobs = rows.filter((row): row is RawJob => row !== null);
  if (summaries.size > 0 && jobs.length === 0) throw new Error("All relevant Bolt job detail requests failed");
  return jobs;
}

function $pageJobCount(html: string) {
  return cheerio.load(html)('[data-testid="AccordionItem"]').length;
}
