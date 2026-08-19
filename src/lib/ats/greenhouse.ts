import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchJson } from "./http";

const responseSchema = z.object({
  jobs: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    content: z.string().default(""),
    absolute_url: z.string().url(),
    updated_at: z.string().optional(),
    location: z.object({ name: z.string().default("") }).default({ name: "" }),
    metadata: z.unknown().optional(),
  })),
});

export async function fetchGreenhouse(company: CompanyConfig): Promise<RawJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.identifier)}/jobs?content=true`;
  const data = responseSchema.parse(await fetchJson(url));
  return data.jobs.map((job) => ({
    source: "greenhouse", sourceJobId: String(job.id), company, title: job.title,
    descriptionHtml: job.content, location: job.location.name, url: job.absolute_url,
    postedAt: job.updated_at ? new Date(job.updated_at) : null,
    metadata: { greenhouseMetadata: job.metadata ?? null },
  }));
}
