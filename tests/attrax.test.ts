import assert from "node:assert/strict";
import test from "node:test";
import { fetchAttrax } from "../src/lib/ats/attrax";
import type { CompanyConfig } from "../src/lib/jobs/types";

test("Attrax paginates listings and parses relevant JobPosting data", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/jobs" && url.searchParams.get("page") === "1") {
      return new Response('<a href="/job/senior-data-analyst-jid-1">Senior Data Analyst</a>');
    }
    if (url.pathname === "/jobs") return new Response("<main>No more jobs</main>");
    return new Response(`<script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting", title: "Senior Data Analyst", description: "Relocation package is available.",
      identifier: { value: "wise-1" }, url: url.toString(), datePosted: "2026-08-01",
      jobLocation: { name: "London" },
    })}</script>`);
  };
  const company: CompanyConfig = { name: "Wise", atsType: "attrax", identifier: "wise", careersUrl: "https://wise.jobs/jobs" };
  const jobs = await fetchAttrax(company);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].sourceJobId, "wise-1");
  assert.equal(jobs[0].company.careersUrl, "https://wise.jobs/jobs");
});
