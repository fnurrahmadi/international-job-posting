import * as cheerio from "cheerio";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchText } from "./http";

interface VintedRecord {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  absolute_url?: unknown;
  first_published?: unknown;
  updated_at?: unknown;
  location?: unknown;
  city?: unknown;
  country?: unknown;
  company_name?: unknown;
  requisition_id?: unknown;
  language?: unknown;
}

function namedValue(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const name = (value as { name?: unknown }).name;
  return typeof name === "string" ? name.trim() : "";
}

function decodeEmbeddedHtml(value: string): string {
  const $ = cheerio.load(`<textarea>${value}</textarea>`);
  return $("textarea").text();
}

export function parseVintedJobs(html: string, company: CompanyConfig): RawJob[] {
  const $ = cheerio.load(html);
  const rawNextData = $("#__NEXT_DATA__").text();
  if (!rawNextData) throw new Error("Vinted Next.js job data was not found");

  const parsed = JSON.parse(rawNextData) as {
    props?: { pageProps?: { jobs?: { dataMap?: Record<string, { jobs?: unknown }> } } };
  };
  const dataMap = parsed.props?.pageProps?.jobs?.dataMap;
  if (!dataMap || typeof dataMap !== "object") throw new Error("Vinted structured job map was not found");

  const records = Object.values(dataMap).flatMap((board) => Array.isArray(board.jobs) ? board.jobs as VintedRecord[] : []);
  const jobs = new Map<string, RawJob>();
  for (const record of records) {
    const id = typeof record.id === "number" || typeof record.id === "string" ? String(record.id) : "";
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const content = typeof record.content === "string" ? record.content : "";
    if (!id || !title || !content) continue;
    if (jobs.has(id)) continue;

    const explicitLocation = namedValue(record.location);
    const city = namedValue(record.city);
    const country = namedValue(record.country);
    const location = explicitLocation || [city, country].filter(Boolean).join(", ");
    const published = typeof record.first_published === "string" ? new Date(record.first_published) : null;
    const canonicalUrl = new URL(`/jobs/j/${id}`, company.careersUrl ?? "https://careers.vinted.com/jobs").toString();

    jobs.set(id, {
      source: "vinted",
      sourceJobId: id,
      company,
      title,
      descriptionHtml: decodeEmbeddedHtml(content),
      location,
      url: canonicalUrl,
      postedAt: published && !Number.isNaN(published.getTime()) ? published : null,
      metadata: {
        greenhouseJobId: id,
        requisitionId: typeof record.requisition_id === "string" ? record.requisition_id : null,
        businessUnit: typeof record.company_name === "string" ? record.company_name.trim() : null,
        language: typeof record.language === "string" ? record.language : null,
        updatedAt: typeof record.updated_at === "string" ? record.updated_at : null,
        sourceUrl: typeof record.absolute_url === "string" ? record.absolute_url : null,
      },
    });
  }
  return [...jobs.values()];
}

export async function fetchVinted(company: CompanyConfig): Promise<RawJob[]> {
  if (!company.careersUrl) throw new Error(`careersUrl is required for Vinted company ${company.name}`);
  const html = await fetchText(company.careersUrl, 3, "text/html,application/xhtml+xml");
  return parseVintedJobs(html, company);
}
