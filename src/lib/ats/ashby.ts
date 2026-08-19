import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchJson } from "./http";

const responseSchema = z.object({ jobs: z.array(z.object({
  id: z.string(), title: z.string(), location: z.string().default(""),
  descriptionHtml: z.string().default(""), jobUrl: z.string().url(),
  publishedAt: z.string().nullish(), isRemote: z.boolean().nullish(),
  department: z.string().nullish(), team: z.string().nullish(),
})) });

export async function fetchAshby(company: CompanyConfig): Promise<RawJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company.identifier)}?includeCompensation=true`;
  const data = responseSchema.parse(await fetchJson(url));
  return data.jobs.map((job) => ({
    source: "ashby", sourceJobId: job.id, company, title: job.title,
    descriptionHtml: job.descriptionHtml, location: job.location, url: job.jobUrl,
    postedAt: job.publishedAt ? new Date(job.publishedAt) : null,
    metadata: { isRemote: job.isRemote ?? null, department: job.department ?? null, team: job.team ?? null },
  }));
}
