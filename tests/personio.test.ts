import assert from "node:assert/strict";
import test from "node:test";
import { fetchPersonio } from "../src/lib/ats/personio";
import type { CompanyConfig } from "../src/lib/jobs/types";

const company: CompanyConfig = {
  name: "Example",
  atsType: "personio",
  identifier: "example",
};

test("fetchPersonio parses XML descriptions and multiple offices", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async () => new Response(`<?xml version="1.0" encoding="UTF-8"?>
    <workzag-jobs><position>
      <id>123</id><name>Senior Data Analyst</name>
      <office>Berlin</office><office>Remote Germany</office>
      <department>Data</department><employmentType>permanent</employmentType>
      <createdAt>2026-08-01T10:00:00+00:00</createdAt>
      <jobDescriptions>
        <jobDescription><name>About the role</name><value><![CDATA[<p>Build dashboards.</p>]]></value></jobDescription>
        <jobDescription><name>Benefits</name><value><![CDATA[<p>Relocation support is provided.</p>]]></value></jobDescription>
      </jobDescriptions>
    </position></workzag-jobs>`, { headers: { "Content-Type": "application/xml" } });

  const [job] = await fetchPersonio(company);
  assert.equal(job.sourceJobId, "123");
  assert.equal(job.location, "Berlin; Remote Germany");
  assert.match(job.descriptionHtml, /Relocation support is provided/);
  assert.equal(job.url, "https://example.jobs.personio.de/job/123?language=en");
});
