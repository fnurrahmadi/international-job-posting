import assert from "node:assert/strict";
import test from "node:test";
import { fetchWorkday, inferWorkdayFeedUrl } from "../src/lib/ats/workday";
import type { CompanyConfig } from "../src/lib/jobs/types";

const company: CompanyConfig = {
  name: "Example",
  atsType: "workday",
  identifier: "example",
  feedUrl: "https://example.wd1.myworkdayjobs.com/wday/cxs/example/External",
};

test("inferWorkdayFeedUrl derives the tenant and career site", () => {
  assert.equal(
    inferWorkdayFeedUrl("https://example.wd1.myworkdayjobs.com/en-US/External"),
    "https://example.wd1.myworkdayjobs.com/wday/cxs/example/External",
  );
});

test("fetchWorkday filters summaries before fetching details", async (t) => {
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requested.push(url);
    if (init?.method === "POST") {
      return Response.json({ total: 2, jobPostings: [
        { title: "Senior Data Analyst", externalPath: "/job/Berlin/Senior-Data-Analyst_R1", locationsText: "Berlin" },
        { title: "Software Engineer", externalPath: "/job/Berlin/Software-Engineer_R2", locationsText: "Berlin" },
        { bulletFields: ["malformed placeholder"] },
      ] });
    }
    if (url.endsWith("/job/Berlin/Senior-Data-Analyst_R1")) {
      return Response.json({ jobPostingInfo: {
        title: "Senior Data Analyst", jobReqId: "R1", location: "Berlin", additionalLocations: ["London"],
        startDate: "2026-08-01", externalUrl: "https://example.wd1.myworkdayjobs.com/job/R1",
        jobDescription: "<p>Relocation support is provided.</p>",
      } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const jobs = await fetchWorkday(company);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].sourceJobId, "R1");
  assert.equal(jobs[0].location, "Berlin; London");
  assert.equal(requested.some((url) => url.includes("Software-Engineer")), false);
});
