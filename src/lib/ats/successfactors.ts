import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchText } from "./http";

const SEARCH_TERMS = [
  "data analyst", "product analyst", "business analyst", "marketing analyst", "pricing analyst",
  "revenue analyst", "operations analyst", "BI analyst", "analytics manager", "strategy analyst",
];

const itemSchema = z.object({
  title: z.string(),
  description: z.string().default(""),
  link: z.string().url(),
  guid: z.union([
    z.string(), z.number(),
    z.object({ "#text": z.union([z.string(), z.number()]) }).passthrough(),
  ]),
  pubDate: z.string().nullish(),
}).passthrough();

const rssSchema = z.object({
  rss: z.object({ channel: z.object({ item: z.union([itemSchema, z.array(itemSchema)]).optional() }).passthrough() }).passthrough(),
}).passthrough();

function asItems(value: z.infer<typeof itemSchema> | z.infer<typeof itemSchema>[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function fetchSuccessFactors(company: CompanyConfig): Promise<RawJob[]> {
  if (!company.feedUrl) throw new Error(`feedUrl is required for SuccessFactors company ${company.name}`);
  const parser = new XMLParser({ ignoreAttributes: false, processEntities: true, trimValues: true });
  const jobs = new Map<string, z.infer<typeof itemSchema>>();

  for (const term of SEARCH_TERMS) {
    const url = new URL(company.feedUrl);
    url.searchParams.set("keywords", `(${term})`);
    const data = rssSchema.parse(parser.parse(await fetchText(url.toString(), 3, "application/rss+xml,application/xml,text/xml")));
    for (const item of asItems(data.rss.channel.item)) {
      const id = typeof item.guid === "object" ? String(item.guid["#text"]) : String(item.guid);
      jobs.set(id, item);
    }
  }

  return [...jobs.entries()].map(([id, job]) => ({
    source: "successfactors",
    sourceJobId: id,
    company,
    title: job.title.replace(/\s+\([^()]*(?:,\s*[^()]*){2,}\)$/, ""),
    descriptionHtml: job.description,
    location: job.title.match(/\(([^()]*)\)$/)?.[1] ?? "",
    url: job.link,
    postedAt: job.pubDate ? new Date(job.pubDate) : null,
    metadata: { rss: true },
  }));
}
