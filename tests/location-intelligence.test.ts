import assert from "node:assert/strict";
import test from "node:test";
import { extractCountryCodes, extractEligibleCountryCodes, inferCountryCode } from "../src/lib/jobs/location-intelligence";

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
