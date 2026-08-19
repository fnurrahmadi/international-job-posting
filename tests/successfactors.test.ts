import assert from "node:assert/strict";
import test from "node:test";
import { fetchSuccessFactors } from "../src/lib/ats/successfactors";
import type { CompanyConfig } from "../src/lib/jobs/types";

test("SuccessFactors reads and deduplicates its public job RSS feeds", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(`<?xml version="1.0"?><rss><channel><item>
    <title><![CDATA[Senior Data Analyst (Berlin, BE, DE)]]></title>
    <description><![CDATA[<p>Visa sponsorship is available.</p>]]></description>
    <link>https://jobs.example.com/job/123</link><guid isPermaLink="false">123</guid>
    <pubDate>Sat, 01 Aug 2026 10:00:00 GMT</pubDate>
  </item></channel></rss>`);

  const company: CompanyConfig = {
    name: "Example", atsType: "successfactors", identifier: "example",
    feedUrl: "https://jobs.example.com/services/rss/job/?locale=en_US",
  };
  const jobs = await fetchSuccessFactors(company);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].sourceJobId, "123");
  assert.equal(jobs[0].title, "Senior Data Analyst");
  assert.equal(jobs[0].location, "Berlin, BE, DE");
});
