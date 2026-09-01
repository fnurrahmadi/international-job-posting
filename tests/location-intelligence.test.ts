import assert from "node:assert/strict";
import test from "node:test";
import { assessInternationalEligibility, extractCountryCodes, extractEligibleCountryCodes, inferCountryCode } from "../src/lib/jobs/location-intelligence";

test("infers countries from country names, codes, and major cities", () => {
  assert.equal(inferCountryCode("Berlin, Germany"), "DE");
  assert.equal(inferCountryCode("London"), "GB");
  assert.equal(inferCountryCode("Austin, TX, US"), "US");
  assert.equal(inferCountryCode("San Francisco, CA"), "US");
  assert.equal(extractCountryCodes("Ontario, CA").includes("CA"), false);
  assert.deepEqual(extractCountryCodes("London; Tallinn"), ["EE", "GB"]);
  assert.equal(inferCountryCode("London; Tallinn"), null);
});

test("extracts countries only from eligibility contexts", () => {
  assert.deepEqual(
    extractEligibleCountryCodes("Our headquarters is in the US. This role is remote within Germany, France, or Spain."),
    ["DE", "ES", "FR"],
  );
});

test("recognizes worldwide and multi-country eligibility", () => {
  const worldwide = assessInternationalEligibility("Applications are welcome from anywhere in the world.");
  assert.equal(worldwide.internationalCandidates, "YES");

  const regional = assessInternationalEligibility("This role is remote within Germany, France, or Spain.");
  assert.equal(regional.internationalCandidates, "YES");
  assert.deepEqual(regional.eligibleCountryCodes, ["DE", "ES", "FR"]);
});

test("local residence and work authorization requirements override broad language", () => {
  const local = assessInternationalEligibility("We are a global company. Candidates must currently reside in Germany and already have the right to work there.");
  assert.equal(local.internationalCandidates, "NO");
  assert.equal(local.existingWorkAuthorizationRequired, "YES");
});
