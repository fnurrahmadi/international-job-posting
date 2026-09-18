import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { isPotentialRoleTitle } from "@/lib/jobs/role-classifier";
import { fetchJson } from "./http";

const listingSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
}).passthrough();
const listSchema = z.object({ jobs: z.object({ docs: z.array(listingSchema), pages: z.number().default(1) }).passthrough() }).passthrough();
const detailSchema = z.object({ doc: z.object({
  id: z.union([z.string(), z.number()]).transform(String), title: z.string(), description: z.string().default(""),
  company: z.object({ id: z.union([z.string(), z.number()]).optional(), name: z.string(), website: z.string().nullish() }).passthrough(),
  location: z.object({ address: z.string().nullish(), locality: z.string().nullish(), country: z.string().nullish() }).nullish(),
  countryCode: z.string().nullish(), absoluteJobUrl: z.string().url().nullish(), publishedAt: z.string().nullish(), createdAt: z.string().nullish(),
  salary: z.unknown().optional(), salaryRange: z.unknown().optional(), monthlySalaryRange: z.unknown().optional(), hourlyRateRange: z.unknown().optional(),
}).passthrough() }).passthrough();

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const output: R[] = []; let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) { const index = cursor++; output[index] = await fn(items[index]); }
  }));
  return output;
}

export async function fetchTheHub(source: CompanyConfig): Promise<RawJob[]> {
  const countries = source.identifier.split(",").map((value) => value.trim()).filter(Boolean);
  const listings = new Map<string, z.infer<typeof listingSchema>>();
  for (const country of countries) {
    const first = listSchema.parse(await fetchJson(`https://thehub.io/api/v2/jobsandfeatured?page=1&countryCode=${country}`));
    for (const job of first.jobs.docs) if (isPotentialRoleTitle(job.title)) listings.set(job.id, job);
    for (let page = 2; page <= Math.min(first.jobs.pages, 50); page += 1) {
      const result = listSchema.parse(await fetchJson(`https://thehub.io/api/v2/jobsandfeatured?page=${page}&countryCode=${country}`));
      for (const job of result.jobs.docs) if (isPotentialRoleTitle(job.title)) listings.set(job.id, job);
    }
  }
  const details = await mapLimit([...listings.values()], 5, (job) => fetchJson(`https://thehub.io/api/jobs/${job.id}`).then((value) => detailSchema.parse(value).doc));
  return details.map((job) => {
    const location = [job.location?.address, job.location?.locality, job.location?.country].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(", ");
    const identifier = String(job.company.id ?? job.company.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return {
      source: "thehub", sourceJobId: job.id,
      company: { name: job.company.name, atsType: "thehub", identifier, website: job.company.website ?? undefined, careersUrl: job.absoluteJobUrl ?? undefined },
      title: job.title, descriptionHtml: job.description, location,
      url: job.absoluteJobUrl ?? `https://thehub.io/jobs/${job.id}`,
      postedAt: job.publishedAt || job.createdAt ? new Date(job.publishedAt ?? job.createdAt!) : null,
      metadata: { countryCode: job.countryCode, salary: job.salary, salaryRange: job.salaryRange, monthlySalaryRange: job.monthlySalaryRange, hourlyRateRange: job.hourlyRateRange, aggregator: source.name },
    };
  });
}
