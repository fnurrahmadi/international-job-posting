import assert from "node:assert/strict";
import test from "node:test";
import { parseVintedJobs } from "../src/lib/ats/vinted";
import { normalizeJob } from "../src/lib/jobs/normalize";
import { classifySponsorship } from "../src/lib/jobs/sponsorship-classifier";
import type { CompanyConfig } from "../src/lib/jobs/types";

const company: CompanyConfig = {
  name: "Vinted", atsType: "vinted", identifier: "vinteden",
  website: "https://www.vinted.com", careersUrl: "https://careers.vinted.com/jobs",
};

test("Vinted parser reads embedded Greenhouse jobs and decodes descriptions", () => {
  const nextData = {
    props: { pageProps: { jobs: { dataMap: {
      vinteden: { jobs: [{
        id: 4938533101,
        title: "Analytics Engineer (Limited-time Relocation Bonus)",
        content: "&lt;p&gt;Build trusted analytics products.&lt;/p&gt;",
        first_published: "2026-07-31T19:18:25+07:00",
        location: null,
        city: { name: "Vilnius" },
        country: { name: "Lithuania" },
        company_name: "Vinted Marketplace",
        requisition_id: "EVG-1370",
      }] },
      duplicateBoard: { jobs: [{ id: 4938533101, title: "Analytics Engineer (Limited-time Relocation Bonus)", content: "&lt;p&gt;Build trusted analytics products.&lt;/p&gt;" }] },
    } } } },
  };
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script>`;
  const jobs = parseVintedJobs(html, company);

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].sourceJobId, "4938533101");
  assert.equal(jobs[0].location, "Vilnius, Lithuania");
  assert.equal(jobs[0].descriptionHtml, "<p>Build trusted analytics products.</p>");
  assert.equal(jobs[0].url, "https://careers.vinted.com/jobs/j/4938533101");
  assert.equal(jobs[0].postedAt?.toISOString(), "2026-07-31T12:18:25.000Z");

  const normalized = normalizeJob(jobs[0]);
  const support = classifySponsorship(`${normalized.title}. ${normalized.descriptionText}`);
  assert.equal(support.relocationSupport, "YES");
});

test("Vinted parser fails safely when its structured job map changes", () => {
  const html = '<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{}}}</script>';
  assert.throws(() => parseVintedJobs(html, company), /structured job map/);
});
