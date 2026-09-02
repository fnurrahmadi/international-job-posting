import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchAshby } from "./ashby";
import { fetchBreezy } from "./breezy";
import { fetchComeet } from "./comeet";
import { fetchGreenhouse } from "./greenhouse";
import { fetchJobvite } from "./jobvite";
import { fetchLever } from "./lever";
import { fetchPersonio } from "./personio";
import { fetchPinpoint } from "./pinpoint";
import { fetchRecruitee } from "./recruitee";
import { fetchSmartRecruiters } from "./smartrecruiters";
import { fetchTeamtailor } from "./teamtailor";
import { fetchWorkable } from "./workable";
import { fetchWorkday } from "./workday";
import { fetchArbeitnow } from "./arbeitnow";
import { fetchOracle } from "./oracle";
import { fetchSuccessFactors } from "./successfactors";
import { fetchBolt } from "./bolt";
import { fetchAttrax } from "./attrax";
import { fetchVinted } from "./vinted";

export async function fetchCompanyJobs(company: CompanyConfig): Promise<RawJob[]> {
  switch (company.atsType) {
    case "greenhouse": return fetchGreenhouse(company);
    case "breezy": return fetchBreezy(company);
    case "comeet": return fetchComeet(company);
    case "jobvite": return fetchJobvite(company);
    case "lever": return fetchLever(company);
    case "ashby": return fetchAshby(company);
    case "personio": return fetchPersonio(company);
    case "pinpoint": return fetchPinpoint(company);
    case "recruitee": return fetchRecruitee(company);
    case "smartrecruiters": return fetchSmartRecruiters(company);
    case "teamtailor": return fetchTeamtailor(company);
    case "workable": return fetchWorkable(company);
    case "workday": return fetchWorkday(company);
    case "arbeitnow": return fetchArbeitnow(company);
    case "successfactors": return fetchSuccessFactors(company);
    case "oracle": return fetchOracle(company);
    case "bolt": return fetchBolt(company);
    case "attrax": return fetchAttrax(company);
    case "vinted": return fetchVinted(company);
  }
}
