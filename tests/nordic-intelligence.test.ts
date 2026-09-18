import assert from "node:assert/strict";
import test from "node:test";
import { classifySponsorship } from "../src/lib/jobs/sponsorship-classifier";
import { assessPermitFeasibility } from "../src/lib/jobs/permit-feasibility";
import { extractSalary } from "../src/lib/jobs/salary-intelligence";
import { assessLanguage } from "../src/lib/jobs/language-intelligence";

test("distinguishes global, EU-only, and country-only relocation", () => {
  assert.equal(classifySponsorship("We provide global relocation support.").relocationScope, "GLOBAL");
  assert.equal(classifySponsorship("Relocation is available only within the EU.").relocationScope, "EU_ONLY");
  assert.equal(classifySponsorship("Applicants must already reside in Finland.").relocationScope, "COUNTRY_ONLY");
});

test("explicit restrictions override theoretical permit feasibility", () => {
  const result = assessPermitFeasibility({ countryCode: "FI", roleFamily: "data_analytics", salary: extractSalary("EUR 6,000 per month"), visaSupport: "NO", authorizationRequired: "YES", relocationScope: "UNKNOWN" });
  assert.equal(result.permitFeasibility, "LOW");
  assert.equal(result.nonEuEligible, "NO");
});

test("uses 2026 Danish and Finnish salary thresholds without claiming sponsorship", () => {
  const dk = assessPermitFeasibility({ countryCode: "DK", roleFamily: "data_analytics", salary: extractSalary("DKK 600,000 per year"), visaSupport: "UNKNOWN", authorizationRequired: "UNKNOWN", relocationScope: "UNKNOWN" });
  const fi = assessPermitFeasibility({ countryCode: "FI", roleFamily: "data_analytics", salary: extractSalary("EUR 4,000 monthly"), visaSupport: "UNKNOWN", authorizationRequired: "UNKNOWN", relocationScope: "UNKNOWN" });
  assert.equal(dk.permitFeasibility, "HIGH"); assert.equal(fi.permitFeasibility, "HIGH");
});

test("detects English and Nordic local-language requirements separately", () => {
  const result = assessLanguage("English is our working language. Fluent Finnish is required.", "FI");
  assert.equal(result.englishSpeaking, "YES"); assert.equal(result.localLanguageRequired, "YES");
});
