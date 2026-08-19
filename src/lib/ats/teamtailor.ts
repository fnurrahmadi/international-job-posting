import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchStructuredCareerJobs } from "./structured-careers";

export function fetchTeamtailor(company: CompanyConfig): Promise<RawJob[]> {
  return fetchStructuredCareerJobs(company, "teamtailor", /\/jobs\//i);
}
