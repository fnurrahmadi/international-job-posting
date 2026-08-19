import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { ATS_TYPES, type CompanyConfig } from "@/lib/jobs/types";

const companySchema = z.object({
  name: z.string().min(1),
  atsType: z.enum(ATS_TYPES),
  identifier: z.string().min(1),
  website: z.string().url().optional(),
  careersUrl: z.string().url().optional(),
  feedUrl: z.string().url().optional(),
  enabled: z.boolean().optional(),
});

export async function loadCompanies(path = process.env.COMPANIES_CONFIG ?? "config/companies.json"): Promise<CompanyConfig[]> {
  const contents = await readFile(resolve(path), "utf8");
  return z.array(companySchema).parse(JSON.parse(contents)).filter((company) => company.enabled !== false);
}
