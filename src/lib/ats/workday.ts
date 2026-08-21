import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { isPotentialRoleTitle } from "@/lib/jobs/role-classifier";
import { fetchJson, postJson } from "./http";

const SEARCH_TERMS = [
  "data analyst", "product analyst", "business analyst", "marketing analyst", "pricing analyst",
  "revenue analyst", "operations analyst", "BI analyst", "analytics manager", "strategy analyst",
];
const PAGE_SIZE = 20;
const MAX_PAGES_PER_TERM = 2;

const summarySchema = z.object({
  title: z.string(),
  externalPath: z.string(),
  locationsText: z.string().default(""),
  postedOn: z.string().nullish(),
}).passthrough();

const summaryListSchema = z.array(z.unknown()).transform((items) => items.flatMap((item) => {
  const result = summarySchema.safeParse(item);
  return result.success ? [result.data] : [];
}));

const searchSchema = z.object({
  total: z.number(),
  jobPostings: summaryListSchema.default([]),
}).passthrough();

const detailSchema = z.object({
  jobPostingInfo: z.object({
    title: z.string(),
    jobReqId: z.union([z.string(), z.number()]),
    location: z.string().default(""),
    additionalLocations: z.union([z.string(), z.array(z.string())]).nullish(),
    startDate: z.string().nullish(),
    postedOn: z.string().nullish(),
    externalUrl: z.string().url(),
    jobDescription: z.string().default(""),
  }).passthrough(),
}).passthrough();

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
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

export function inferWorkdayFeedUrl(careersUrl: string): string {
  const url = new URL(careersUrl);
  const tenant = url.hostname.split(".")[0];
  const segments = url.pathname.split("/").filter(Boolean);
  const site = segments.findLast((segment) => !/^[a-z]{2}-[A-Z]{2}$/.test(segment));
  if (!tenant || !site) throw new Error(`Cannot infer Workday tenant/site from ${careersUrl}`);
  return `${url.origin}/wday/cxs/${tenant}/${site}`;
}

export async function validateWorkdayFeed(feedUrl: string) {
  const base = feedUrl.replace(/\/$/, "");
  return searchSchema.parse(await postJson(`${base}/jobs`, {
    appliedFacets: {}, limit: 1, offset: 0, searchText: "data analyst",
  }));
}

export async function fetchWorkday(company: CompanyConfig): Promise<RawJob[]> {
  if (!company.feedUrl) throw new Error(`feedUrl is required for Workday company ${company.name}`);
  const base = company.feedUrl.replace(/\/$/, "");
  const summaries = new Map<string, z.infer<typeof summarySchema>>();

  for (const term of SEARCH_TERMS) {
    for (let page = 0; page < MAX_PAGES_PER_TERM; page += 1) {
      const data = searchSchema.parse(await postJson(`${base}/jobs`, {
        appliedFacets: {}, limit: PAGE_SIZE, offset: page * PAGE_SIZE, searchText: term,
      }));
      for (const summary of data.jobPostings) {
        if (isPotentialRoleTitle(summary.title)) summaries.set(summary.externalPath, summary);
      }
      if ((page + 1) * PAGE_SIZE >= data.total || data.jobPostings.length === 0) break;
    }
  }

  return mapWithLimit([...summaries.values()], 5, async (summary) => {
    const detail = detailSchema.parse(await fetchJson(`${base}${summary.externalPath}`)).jobPostingInfo;
    const locations = [detail.location, ...asArray(detail.additionalLocations)].filter(Boolean);
    return {
      source: "workday",
      sourceJobId: String(detail.jobReqId),
      company,
      title: detail.title,
      descriptionHtml: detail.jobDescription,
      location: locations.join("; ") || summary.locationsText,
      url: detail.externalUrl,
      postedAt: detail.startDate ? new Date(detail.startDate) : null,
      metadata: { externalPath: summary.externalPath, postedOn: detail.postedOn ?? summary.postedOn ?? null, locations },
    };
  });
}
