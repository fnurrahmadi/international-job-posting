import assert from "node:assert/strict";
import test from "node:test";
import { fetchBreezy } from "../src/lib/ats/breezy";
import { fetchComeet } from "../src/lib/ats/comeet";
import { fetchJobvite } from "../src/lib/ats/jobvite";
import { fetchPinpoint } from "../src/lib/ats/pinpoint";
import { fetchTeamtailor } from "../src/lib/ats/teamtailor";
import type { AtsType, CompanyConfig } from "../src/lib/jobs/types";

const cases: Array<[AtsType, string, (company: CompanyConfig) => ReturnType<typeof fetchComeet>]> = [
  ["comeet", "/jobs/analyst", fetchComeet],
  ["breezy", "/p/analyst", fetchBreezy],
  ["teamtailor", "/jobs/analyst", fetchTeamtailor],
  ["pinpoint", "/postings/analyst", fetchPinpoint],
  ["jobvite", "/job/analyst", fetchJobvite],
];

test("structured career adapters discover links and parse JobPosting JSON-LD", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  for (const [source, path, fetcher] of cases) {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/careers") return new Response(`<a href="${path}">Senior Data Analyst</a>`);
      return new Response(`<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org", "@type": "JobPosting", title: "Senior Data Analyst",
        description: "<p>Visa sponsorship is available.</p>", datePosted: "2026-08-01",
        identifier: { value: `${source}-1` }, url: url.toString(),
        jobLocation: { name: "Berlin", address: { addressCountry: "Germany" } },
      })}</script>`);
    };
    const company: CompanyConfig = { name: "Example", atsType: source, identifier: "example", careersUrl: "https://example.com/careers" };
    const [job] = await fetcher(company);
    assert.equal(job.source, source);
    assert.equal(job.sourceJobId, `${source}-1`);
    assert.match(job.descriptionHtml, /Visa sponsorship is available/);
  }
});
