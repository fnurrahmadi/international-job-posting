import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { classifyRole } from "@/lib/jobs/role-classifier";
import { fetchJson } from "./http";

const locationSchema = z.object({
  city: z.string().nullish(),
  region: z.string().nullish(),
  country: z.string().nullish(),
  fullLocation: z.string().nullish(),
  remote: z.boolean().nullish(),
  hybrid: z.boolean().nullish(),
}).passthrough();

const listSchema = z.object({
  totalFound: z.number(),
  content: z.array(z.object({
    id: z.string(),
    name: z.string(),
    releasedDate: z.string().nullish(),
    location: locationSchema.nullish(),
  }).passthrough()),
});

const sectionSchema = z.object({ title: z.string().nullish(), text: z.string().default("") }).nullish();
const detailSchema = z.object({
  id: z.string(),
  name: z.string(),
  releasedDate: z.string().nullish(),
  postingUrl: z.string().url(),
  location: locationSchema.nullish(),
  jobAd: z.object({
    sections: z.object({
      companyDescription: sectionSchema,
      jobDescription: sectionSchema,
      qualifications: sectionSchema,
      additionalInformation: sectionSchema,
    }).passthrough(),
  }),
  customField: z.array(z.unknown()).optional(),
  function: z.unknown().optional(),
  experienceLevel: z.unknown().optional(),
  typeOfEmployment: z.unknown().optional(),
}).passthrough();

async function fetchRelevantSummaries(company: CompanyConfig) {
  const summaries: z.infer<typeof listSchema>["content"] = [];
  const limit = 100;
  let offset = 0;
  let total = 0;

  do {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company.identifier)}/postings?limit=${limit}&offset=${offset}`;
    const page = listSchema.parse(await fetchJson(url));
    total = page.totalFound;
    summaries.push(...page.content.filter((posting) => classifyRole(posting.name)));
    offset += page.content.length;
    if (page.content.length === 0) break;
  } while (offset < total);

  return summaries;
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

export async function fetchSmartRecruiters(company: CompanyConfig): Promise<RawJob[]> {
  const summaries = await fetchRelevantSummaries(company);
  return mapWithLimit(summaries, 5, async (summary) => {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company.identifier)}/postings/${encodeURIComponent(summary.id)}`;
    const detail = detailSchema.parse(await fetchJson(url));
    const sections = detail.jobAd.sections;
    const descriptionHtml = [
      sections.companyDescription?.text,
      sections.jobDescription?.text,
      sections.qualifications?.text,
      sections.additionalInformation?.text,
    ].filter(Boolean).join("\n");
    const location = detail.location?.fullLocation
      ?? [detail.location?.city, detail.location?.region, detail.location?.country].filter(Boolean).join(", ");

    return {
      source: "smartrecruiters",
      sourceJobId: detail.id,
      company,
      title: detail.name,
      descriptionHtml,
      location,
      url: detail.postingUrl,
      postedAt: detail.releasedDate ? new Date(detail.releasedDate) : null,
      metadata: {
        country: detail.location?.country ?? null,
        remote: detail.location?.remote ?? null,
        hybrid: detail.location?.hybrid ?? null,
        customFields: detail.customField ?? [],
        function: detail.function ?? null,
        experienceLevel: detail.experienceLevel ?? null,
        typeOfEmployment: detail.typeOfEmployment ?? null,
      },
    };
  });
}
