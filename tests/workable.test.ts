import assert from "node:assert/strict";
import test from "node:test";
import { fetchWorkable } from "../src/lib/ats/workable";
import type { CompanyConfig } from "../src/lib/jobs/types";

const source: CompanyConfig = {
  name: "Workable network",
  atsType: "workable",
  identifier: "analytics-search",
};

test("fetchWorkable paginates, deduplicates, and attributes jobs to their employers", async (t) => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    const term = new URL(url).searchParams.get("query");
    const token = new URL(url).searchParams.get("pageToken");
    const jobs = term === "data analyst" ? [{
      id: "job-1",
      title: "Data Analyst",
      description: "<p>Analyze data.</p>",
      requirementsSection: "<p>SQL</p>",
      benefitsSection: "<p>Relocation support is provided.</p>",
      url: "https://jobs.workable.com/view/job-1",
      locations: ["Berlin, Germany"],
      created: "2026-08-01T10:00:00Z",
      workplace: "hybrid",
      company: { id: "company-1", title: "Example GmbH", website: "https://example.com", url: "https://jobs.workable.com/company/example" },
    }] : [];

    return Response.json({ jobs, nextPageToken: term === "data analyst" && !token ? "page-2" : null });
  };

  const jobs = await fetchWorkable(source);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company.name, "Example GmbH");
  assert.equal(jobs[0].company.identifier, "company-1");
  assert.equal(jobs[0].location, "Berlin, Germany");
  assert.match(jobs[0].descriptionHtml, /Relocation support is provided/);
  assert.equal(requests.some((url) => new URL(url).searchParams.get("pageToken") === "page-2"), true);
});
