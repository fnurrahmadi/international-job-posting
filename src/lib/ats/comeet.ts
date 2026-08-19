import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchStructuredCareerJobs } from "./structured-careers";

export function fetchComeet(company: CompanyConfig): Promise<RawJob[]> {
  return fetchStructuredCareerJobs(company, "comeet", /\/(?:jobs?|position)\//i);
}
