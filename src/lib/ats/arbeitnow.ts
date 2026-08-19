import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchJson } from "./http";

const MAX_PAGES = 3;
const stringListSchema = z.union([z.array(z.string()), z.record(z.string(), z.unknown()), z.null()])
  .transform((value) => Array.isArray(value) ? value : []);

const jobSchema = z.object({
  slug: z.string(),
  company_name: z.string(),
  title: z.string(),
  description: z.string().default(""),
  remote: z.boolean().default(false),
  url: z.string().url(),
  tags: stringListSchema.default([]),
  job_types: stringListSchema.default([]),
  location: z.string().default(""),
  created_at: z.number().nullish(),
}).passthrough();

const responseSchema = z.object({
  data: z.array(jobSchema),
  links: z.object({ next: z.string().url().nullish() }).passthrough(),
}).passthrough();

export async function fetchArbeitnow(source: CompanyConfig): Promise<RawJob[]> {
  const jobs = new Map<string, z.infer<typeof jobSchema>>();
  let nextUrl: string | null = source.feedUrl ?? "https://www.arbeitnow.com/api/job-board-api";

  for (let page = 0; page < MAX_PAGES && nextUrl; page += 1) {
    const response = responseSchema.parse(await fetchJson(nextUrl));
    for (const job of response.data) jobs.set(job.slug, job);
    nextUrl = response.links.next ?? null;
  }

  return [...jobs.values()].map((job) => ({
    source: "arbeitnow",
    sourceJobId: job.slug,
    company: {
      name: job.company_name,
      atsType: "arbeitnow",
      identifier: job.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      careersUrl: job.url,
    },
    title: job.title,
    descriptionHtml: job.description,
    location: job.location,
    url: job.url,
    postedAt: job.created_at ? new Date(job.created_at * 1000) : null,
    metadata: { remote: job.remote, tags: job.tags, jobTypes: job.job_types, aggregator: source.name },
  }));
}
