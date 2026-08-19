import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchJson } from "./http";

const SEARCH_TERMS = [
  "data analyst",
  "product analyst",
  "business analyst",
  "marketing analyst",
  "pricing analyst",
  "revenue analyst",
  "operations analyst",
  "BI analyst",
  "analytics manager",
  "strategy analyst",
];
const MAX_PAGES_PER_TERM = 3;

const companySchema = z.object({
  id: z.string(),
  title: z.string(),
  website: z.string().nullish(),
  url: z.string().nullish(),
}).passthrough();

const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  requirementsSection: z.string().default(""),
  benefitsSection: z.string().default(""),
  url: z.string().url(),
  locations: z.array(z.string()).default([]),
  location: z.object({
    city: z.string().nullish(),
    subregion: z.string().nullish(),
    countryName: z.string().nullish(),
  }).nullish(),
  created: z.string().nullish(),
  updated: z.string().nullish(),
  department: z.string().nullish(),
  employmentType: z.string().nullish(),
  workplace: z.string().nullish(),
  language: z.string().nullish(),
  company: companySchema,
}).passthrough();

const responseSchema = z.object({
  jobs: z.array(jobSchema),
  nextPageToken: z.string().nullish(),
}).passthrough();

async function fetchTerm(term: string) {
  const jobs: z.infer<typeof jobSchema>[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES_PER_TERM; page += 1) {
    const params = new URLSearchParams({ query: term });
    if (pageToken) params.set("pageToken", pageToken);
    const data = responseSchema.parse(await fetchJson(`https://jobs.workable.com/api/v1/jobs?${params}`));
    jobs.push(...data.jobs);
    pageToken = data.nextPageToken ?? undefined;
    if (!pageToken || data.jobs.length === 0) break;
  }

  return jobs;
}

export async function fetchWorkable(company: CompanyConfig): Promise<RawJob[]> {
  void company;
  const pages = await Promise.all(SEARCH_TERMS.map(fetchTerm));
  const uniqueJobs = new Map(pages.flat().map((job) => [job.id, job]));

  return [...uniqueJobs.values()].map((job) => {
    const company: CompanyConfig = {
      name: job.company.title,
      atsType: "workable",
      identifier: job.company.id,
      website: job.company.website || undefined,
      careersUrl: job.company.url || undefined,
    };
    const location = job.locations.join("; ")
      || [job.location?.city, job.location?.subregion, job.location?.countryName].filter(Boolean).join(", ");

    return {
      source: "workable",
      sourceJobId: job.id,
      company,
      title: job.title,
      descriptionHtml: [job.description, job.requirementsSection, job.benefitsSection].filter(Boolean).join("\n"),
      location,
      url: job.url,
      postedAt: job.created || job.updated ? new Date(job.created ?? job.updated!) : null,
      metadata: {
        department: job.department ?? null,
        employmentType: job.employmentType ?? null,
        workplace: job.workplace ?? null,
        language: job.language ?? null,
        locations: job.locations,
      },
    };
  });
}
