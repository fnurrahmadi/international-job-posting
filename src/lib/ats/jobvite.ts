import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchStructuredCareerJobs } from "./structured-careers";

export function fetchJobvite(company: CompanyConfig): Promise<RawJob[]> {
  return fetchStructuredCareerJobs(company, "jobvite", /\/(?:job|jobs)\//i);
}
