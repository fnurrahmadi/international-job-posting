import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchAshby } from "./ashby";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchSmartRecruiters } from "./smartrecruiters";

export async function fetchCompanyJobs(company: CompanyConfig): Promise<RawJob[]> {
  switch (company.atsType) {
    case "greenhouse": return fetchGreenhouse(company);
    case "lever": return fetchLever(company);
    case "ashby": return fetchAshby(company);
    case "smartrecruiters": return fetchSmartRecruiters(company);
  }
}
