import assert from "node:assert/strict";
import test from "node:test";
import { fetchSmartRecruiters } from "../src/lib/ats/smartrecruiters";
import type { CompanyConfig } from "../src/lib/jobs/types";

const company: CompanyConfig = {
  name: "Example",
  atsType: "smartrecruiters",
  identifier: "Example",
  website: "https://example.com",
  careersUrl: "https://example.com/careers",
};

test("fetchSmartRecruiters paginates listings and fetches details only for relevant roles", async (t) => {
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async (input) => {
    const url = String(input);
    requested.push(url);

    if (url.includes("/postings?")) {
      return Response.json({
        totalFound: 2,
        content: [
          { id: "analyst-1", name: "Senior Data Analyst", releasedDate: "2026-08-01T00:00:00Z" },
          { id: "engineer-1", name: "Software Engineer", releasedDate: "2026-08-01T00:00:00Z" },
        ],
      });
    }

    if (url.endsWith("/postings/analyst-1")) {
      return Response.json({
        id: "analyst-1",
        name: "Senior Data Analyst",
        releasedDate: "2026-08-01T00:00:00Z",
        postingUrl: "https://jobs.smartrecruiters.com/Example/analyst-1",
        location: { city: "Berlin", country: "Germany", fullLocation: "Berlin, Germany" },
        jobAd: {
          sections: {
            companyDescription: { title: "Company", text: "Example company" },
            jobDescription: { title: "Role", text: "Relocation support is provided." },
            qualifications: { title: "Qualifications", text: "SQL" },
            additionalInformation: null,
          },
        },
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const jobs = await fetchSmartRecruiters(company);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].sourceJobId, "analyst-1");
  assert.equal(jobs[0].location, "Berlin, Germany");
  assert.match(jobs[0].descriptionHtml, /Relocation support is provided/);
  assert.equal(requested.some((url) => url.endsWith("/postings/engineer-1")), false);
});
