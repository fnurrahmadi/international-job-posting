import assert from "node:assert/strict";
import test from "node:test";
import { fetchOracle } from "../src/lib/ats/oracle";
import type { CompanyConfig } from "../src/lib/jobs/types";

test("Oracle searches public Candidate Experience jobs and fetches relevant details", async (t) => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push(url);
    assert.equal(new Headers(init?.headers).get("REST-Framework-Version"), "4");
    if (url.includes("recruitingCEJobRequisitionDetails")) return Response.json({
      Id: "42", Title: "Senior Data Analyst", ExternalPostedStartDate: "2026-08-01T10:00:00Z",
      PrimaryLocation: "Singapore", ExternalDescriptionStr: "<p>Analyze product data.</p>",
      ExternalResponsibilitiesStr: "<p>Build dashboards.</p>", ExternalQualificationsStr: "<p>SQL required.</p>",
      CorporateDescriptionStr: "", Category: "Analytics", JobSchedule: "Full time", RequisitionType: "Professional",
    });
    return Response.json({ items: [{ TotalJobsCount: 1, requisitionList: { items: [
      { Id: "42", Title: "Senior Data Analyst", PostedDate: "2026-08-01", PrimaryLocation: "Singapore", PrimaryLocationCountry: "SG" },
      { Id: "99", Title: "Software Engineer", PostedDate: "2026-08-01", PrimaryLocation: "Austin" },
    ] } }] });
  };

  const company: CompanyConfig = {
    name: "Oracle", atsType: "oracle", identifier: "CX_45001",
    careersUrl: "https://careers.oracle.com/en/sites/jobsearch",
    feedUrl: "https://example.oraclecloud.com/hcmRestApi/resources/latest",
  };
  const jobs = await fetchOracle(company);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].sourceJobId, "42");
  assert.equal(jobs[0].url, "https://careers.oracle.com/en/sites/jobsearch/job/42");
  assert.match(jobs[0].descriptionHtml, /Build dashboards/);
  assert.equal(requests.filter((url) => url.includes("recruitingCEJobRequisitionDetails")).length, 1);
});
