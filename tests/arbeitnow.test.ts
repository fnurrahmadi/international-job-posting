import assert from "node:assert/strict";
import test from "node:test";
import { fetchArbeitnow } from "../src/lib/ats/arbeitnow";
import type { CompanyConfig } from "../src/lib/jobs/types";

test("Arbeitnow paginates, deduplicates, and attributes jobs to employers", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let requests = 0;
  globalThis.fetch = async (input) => {
    requests += 1;
    const page = new URL(String(input)).searchParams.get("page");
    return Response.json({
      data: [{
        slug: "data-analyst-1", company_name: "Example GmbH", title: "Data Analyst",
        description: "<p>Relocation support available.</p>", remote: true,
        url: "https://www.arbeitnow.com/jobs/example/data-analyst-1", tags: ["Data"],
        job_types: page ? {} : ["Full Time"], location: "Berlin", created_at: 1785542400,
      }],
      links: { next: page ? null : "https://www.arbeitnow.com/api/job-board-api?page=2" },
    });
  };

  const company: CompanyConfig = { name: "Arbeitnow network", atsType: "arbeitnow", identifier: "public-feed" };
  const jobs = await fetchArbeitnow(company);
  assert.equal(requests, 2);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company.name, "Example GmbH");
  assert.equal(jobs[0].company.identifier, "example-gmbh");
  assert.equal(jobs[0].metadata.remote, true);
});
