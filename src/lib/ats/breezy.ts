import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchStructuredCareerJobs } from "./structured-careers";

export function fetchBreezy(company: CompanyConfig): Promise<RawJob[]> {
  return fetchStructuredCareerJobs(company, "breezy", /\/p\//i);
}
