import assert from "node:assert/strict";
import test from "node:test";
import { htmlToText, normalizeJob } from "../src/lib/jobs/normalize";

test("converts job HTML into normalized text", () => {
  assert.equal(htmlToText("<p>Visa &amp; <strong>relocation</strong></p>"), "Visa & relocation");
});

test("creates stable hashes", () => {
  const raw = { source: "ashby" as const, sourceJobId: "1", company: { name: "A", atsType: "ashby" as const, identifier: "a" }, title: "Data Analyst", descriptionHtml: "<p>SQL</p>", location: "Remote", url: "https://example.com/job", postedAt: null, metadata: {} };
  assert.equal(normalizeJob(raw).contentHash, normalizeJob(raw).contentHash);
  assert.equal(normalizeJob(raw).remoteType, "REMOTE");
});

test("adds country and remote eligibility metadata", () => {
  const raw = { source: "ashby" as const, sourceJobId: "2", company: { name: "A", atsType: "ashby" as const, identifier: "a" }, title: "Data Analyst", descriptionHtml: "<p>This role is remote within Germany or France.</p>", location: "Berlin, Germany", url: "https://example.com/job/2", postedAt: null, metadata: {} };
  const job = normalizeJob(raw);
  assert.equal(job.countryCode, "DE");
  assert.equal(job.remoteType, "REMOTE");
  assert.deepEqual(job.metadata.eligibleCountryCodes, ["DE", "FR"]);
});
