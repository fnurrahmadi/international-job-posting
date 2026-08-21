import assert from "node:assert/strict";
import test from "node:test";
import { calculateSupportScore } from "../src/lib/jobs/support-score";

const base = {
  roleFamily: "data_analytics" as const, seniority: "MID" as const,
  visaSponsorship: "UNKNOWN" as const, relocationSupport: "UNKNOWN" as const,
  internationalCandidates: "UNKNOWN" as const, existingWorkAuthorizationRequired: "UNKNOWN" as const,
  confidence: 0.8, evidence: [] as string[],
};

test("ranks explicit visa and relocation evidence above unknown support", () => {
  const unknown = calculateSupportScore(base).total;
  const supported = calculateSupportScore({ ...base, visaSponsorship: "YES", relocationSupport: "YES", internationalCandidates: "YES", evidence: ["Visa provided", "Relocation provided"] }).total;
  const restricted = calculateSupportScore({ ...base, existingWorkAuthorizationRequired: "YES", visaSponsorship: "NO" }).total;
  assert.ok(supported > unknown);
  assert.ok(unknown > restricted);
  assert.equal(supported, 94);
});
