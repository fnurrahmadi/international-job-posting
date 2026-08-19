import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchText } from "./http";

const descriptionSchema = z.object({
  name: z.coerce.string().optional(),
  value: z.coerce.string().default(""),
}).passthrough();

const positionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.coerce.string(),
  office: z.union([z.string(), z.array(z.string())]).optional(),
  department: z.coerce.string().optional(),
  employmentType: z.coerce.string().optional(),
  seniority: z.coerce.string().optional(),
  schedule: z.coerce.string().optional(),
  createdAt: z.coerce.string().optional(),
  jobDescriptions: z.object({
    jobDescription: z.union([descriptionSchema, z.array(descriptionSchema)]).optional(),
  }).optional(),
}).passthrough();

const feedSchema = z.object({
  "workzag-jobs": z.object({
    position: z.union([positionSchema, z.array(positionSchema)]).optional(),
  }),
});

const parser = new XMLParser({ ignoreAttributes: false, processEntities: true, trimValues: true });

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export async function fetchPersonio(company: CompanyConfig): Promise<RawJob[]> {
  const feedUrl = `https://${encodeURIComponent(company.identifier)}.jobs.personio.de/xml?language=en`;
  const xml = await fetchText(feedUrl, 3, "application/xml,text/xml;q=0.9,*/*;q=0.8");
  const data = feedSchema.parse(parser.parse(xml));

  return asArray(data["workzag-jobs"].position).map((position) => {
    const descriptions = asArray(position.jobDescriptions?.jobDescription);
    const offices = asArray(position.office);
    const sourceJobId = String(position.id);

    return {
      source: "personio",
      sourceJobId,
      company,
      title: position.name,
      descriptionHtml: descriptions.map((description) => description.value).filter(Boolean).join("\n"),
      location: offices.join("; "),
      url: `https://${company.identifier}.jobs.personio.de/job/${encodeURIComponent(sourceJobId)}?language=en`,
      postedAt: position.createdAt ? new Date(position.createdAt) : null,
      metadata: {
        offices,
        department: position.department ?? null,
        employmentType: position.employmentType ?? null,
        seniority: position.seniority ?? null,
        schedule: position.schedule ?? null,
        descriptionSections: descriptions.map((description) => description.name).filter(Boolean),
      },
    };
  });
}
