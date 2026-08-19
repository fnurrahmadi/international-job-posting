import assert from "node:assert/strict";
import test from "node:test";
import { classifySponsorship } from "../src/lib/jobs/sponsorship-classifier";

test("detects positive visa and relocation language", () => {
  const result = classifySponsorship("Visa sponsorship is available. We provide international relocation support.");
  assert.equal(result.visaSponsorship, "YES");
  assert.equal(result.relocationSupport, "YES");
});

test("negative language overrides ambiguous sponsorship words", () => {
  const result = classifySponsorship("You must already have the right to work. Visa sponsorship is not available.");
  assert.equal(result.visaSponsorship, "NO");
  assert.equal(result.existingWorkAuthorizationRequired, "YES");
});

test("absence of evidence stays unknown", () => {
  const result = classifySponsorship("Join our analytics team and build dashboards.");
  assert.equal(result.visaSponsorship, "UNKNOWN");
  assert.equal(result.relocationSupport, "UNKNOWN");
});
