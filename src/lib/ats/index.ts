import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchAshby } from "./ashby";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchPersonio } from "./personio";
import { fetchRecruitee } from "./recruitee";
import { fetchSmartRecruiters } from "./smartrecruiters";
import { fetchWorkable } from "./workable";

export async function fetchCompanyJobs(company: CompanyConfig): Promise<RawJob[]> {
  switch (company.atsType) {
    case "greenhouse": return fetchGreenhouse(company);
    case "lever": return fetchLever(company);
    case "ashby": return fetchAshby(company);
    case "personio": return fetchPersonio(company);
    case "recruitee": return fetchRecruitee(company);
    case "smartrecruiters": return fetchSmartRecruiters(company);
    case "workable": return fetchWorkable(company);
  }
}
