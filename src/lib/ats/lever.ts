import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchJson } from "./http";

const responseSchema = z.array(z.object({
  id: z.string(), text: z.string(), hostedUrl: z.string().url(),
  descriptionPlain: z.string().default(""), description: z.string().default(""),
  createdAt: z.number().optional(),
  categories: z.object({ location: z.string().optional() }).passthrough().default({}),
  workplaceType: z.string().optional(),
}));

export async function fetchLever(company: CompanyConfig): Promise<RawJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company.identifier)}?mode=json`;
  const data = responseSchema.parse(await fetchJson(url));
  return data.map((job) => ({
    source: "lever", sourceJobId: job.id, company, title: job.text,
    descriptionHtml: job.description || job.descriptionPlain,
    location: job.categories.location ?? "", url: job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt) : null,
    metadata: { workplaceType: job.workplaceType ?? null, categories: job.categories },
  }));
}
