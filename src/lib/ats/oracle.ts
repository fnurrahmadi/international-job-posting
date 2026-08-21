import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { isPotentialRoleTitle } from "@/lib/jobs/role-classifier";
import { fetchJson } from "./http";

const SEARCH_TERMS = [
  "data analyst", "product analyst", "business analyst", "marketing analyst", "pricing analyst",
  "revenue analyst", "operations analyst", "BI analyst", "analytics manager", "strategy analyst",
];
const PAGE_SIZE = 25;
const MAX_PAGES_PER_TERM = 2;

const summarySchema = z.object({
  Id: z.union([z.string(), z.number()]), Title: z.string(), PostedDate: z.string().nullish(),
  PrimaryLocation: z.string().default(""), PrimaryLocationCountry: z.string().nullish(),
}).passthrough();

const searchSchema = z.object({ items: z.array(z.object({
  TotalJobsCount: z.number(),
  requisitionList: z.object({ items: z.array(summarySchema).default([]) }).passthrough(),
}).passthrough()) }).passthrough();

const detailSchema = z.object({
  Id: z.union([z.string(), z.number()]), Title: z.string(),
  ExternalPostedStartDate: z.string().nullish(), PrimaryLocation: z.string().default(""),
  ExternalDescriptionStr: z.string().default(""), ExternalResponsibilitiesStr: z.string().default(""),
  ExternalQualificationsStr: z.string().default(""), CorporateDescriptionStr: z.string().default(""),
  Category: z.string().nullish(), JobSchedule: z.string().nullish(), RequisitionType: z.string().nullish(),
}).passthrough();

async function mapWithLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function consume() { while (cursor < items.length) { const index = cursor++; results[index] = await worker(items[index]); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
  return results;
}

function jobUrl(company: CompanyConfig, id: string) {
  const base = new URL(company.careersUrl!);
  return `${base.origin}${base.pathname.replace(/\/$/, "")}/job/${encodeURIComponent(id)}`;
}

export async function fetchOracle(company: CompanyConfig): Promise<RawJob[]> {
  if (!company.feedUrl || !company.careersUrl) throw new Error(`feedUrl and careersUrl are required for Oracle company ${company.name}`);
  const base = company.feedUrl.replace(/\/$/, "");
  const summaries = new Map<string, z.infer<typeof summarySchema>>();

  for (const term of SEARCH_TERMS) {
    for (let page = 0; page < MAX_PAGES_PER_TERM; page += 1) {
      const finder = `findReqs;siteNumber=${company.identifier},limit=${PAGE_SIZE},offset=${page * PAGE_SIZE},keyword=${term},sortBy=POSTING_DATES_DESC`;
      const params = new URLSearchParams({ onlyData: "true", expand: "requisitionList", finder });
      const root = searchSchema.parse(await fetchJson(`${base}/recruitingCEJobRequisitions?${params}`, 3, {
        headers: { "REST-Framework-Version": "4" },
      })).items[0];
      if (!root) break;
      for (const summary of root.requisitionList.items) {
        if (isPotentialRoleTitle(summary.Title)) summaries.set(String(summary.Id), summary);
      }
      if ((page + 1) * PAGE_SIZE >= root.TotalJobsCount || root.requisitionList.items.length === 0) break;
    }
  }

  return mapWithLimit([...summaries.entries()], 5, async ([id, summary]) => {
    const detail = detailSchema.parse(await fetchJson(`${base}/recruitingCEJobRequisitionDetails/${encodeURIComponent(id)}?onlyData=true`, 3, {
      headers: { "REST-Framework-Version": "4" },
    }));
    return {
      source: "oracle",
      sourceJobId: id,
      company,
      title: detail.Title,
      descriptionHtml: [detail.ExternalDescriptionStr, detail.ExternalResponsibilitiesStr, detail.ExternalQualificationsStr, detail.CorporateDescriptionStr].filter(Boolean).join("\n"),
      location: detail.PrimaryLocation || summary.PrimaryLocation,
      url: jobUrl(company, id),
      postedAt: detail.ExternalPostedStartDate ? new Date(detail.ExternalPostedStartDate) : summary.PostedDate ? new Date(summary.PostedDate) : null,
      metadata: { category: detail.Category ?? null, schedule: detail.JobSchedule ?? null, requisitionType: detail.RequisitionType ?? null },
    } satisfies RawJob;
  });
}
