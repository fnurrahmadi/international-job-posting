import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchStructuredCareerJobs } from "./structured-careers";

export function fetchPinpoint(company: CompanyConfig): Promise<RawJob[]> {
  return fetchStructuredCareerJobs(company, "pinpoint", /\/(?:postings?|jobs?)\//i);
}
