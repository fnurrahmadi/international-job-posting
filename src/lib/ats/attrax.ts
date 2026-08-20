import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchStructuredCareerJobs } from "./structured-careers";

const PAGE_SIZE = 48;
const MAX_PAGES = 12;

export async function fetchAttrax(company: CompanyConfig): Promise<RawJob[]> {
  if (!company.careersUrl) throw new Error(`careersUrl is required for Attrax company ${company.name}`);
  const jobs = new Map<string, RawJob>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(company.careersUrl);
    url.searchParams.set("size", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));
    const pageCompany = { ...company, careersUrl: url.toString() };
    const rows = await fetchStructuredCareerJobs(pageCompany, "attrax", /\/job\//i);
    let added = 0;
    for (const row of rows) {
      if (!jobs.has(row.sourceJobId)) added += 1;
      jobs.set(row.sourceJobId, { ...row, company });
    }
    if (added === 0) break;
  }

  return [...jobs.values()];
}
