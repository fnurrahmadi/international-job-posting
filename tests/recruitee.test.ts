import assert from "node:assert/strict";
import test from "node:test";
import { fetchRecruitee } from "../src/lib/ats/recruitee";
import { classifySponsorship } from "../src/lib/jobs/sponsorship-classifier";
import type { CompanyConfig } from "../src/lib/jobs/types";

const company: CompanyConfig = {
  name: "Example",
  atsType: "recruitee",
  identifier: "example",
  website: "https://example.com",
  careersUrl: "https://example.recruitee.com",
};

test("fetchRecruitee preserves application questions used for sponsorship classification", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async () => Response.json({
    offers: [{
      id: 42,
      title: "Senior Data Analyst",
      description: "<p>Build analytics products.</p>",
      requirements: "<p>Advanced SQL.</p>",
      careers_url: "https://example.recruitee.com/o/senior-data-analyst",
      published_at: "2026-08-01 10:00:00 UTC",
      location: "Amsterdam, Netherlands",
      country_code: "NL",
      remote: false,
      hybrid: true,
      on_site: false,
      locations: [{ name: "Amsterdam", city: "Amsterdam", country: "Netherlands", country_code: "NL" }],
      open_questions: [{
        kind: "infobox",
        body: "<p>We are not sponsoring visas at the moment.</p>",
      }],
    }],
  });

  const [job] = await fetchRecruitee(company);
  assert.equal(job.sourceJobId, "42");
  assert.equal(job.location, "Amsterdam, Netherlands");
  assert.match(job.descriptionHtml, /not sponsoring visas/);
  assert.equal(job.metadata.applicationQuestionCount, 1);
  assert.equal(classifySponsorship(job.descriptionHtml).visaSponsorship, "NO");
});
