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

test("detects visa transfers and country-specific sponsorship", () => {
  const transfer = classifySponsorship("We offer visa transfer support and work permit renewal assistance.");
  assert.equal(transfer.visaSponsorship, "YES");

  const skilledWorker = classifySponsorship("Skilled Worker visa sponsorship is provided for this position.");
  assert.equal(skilledWorker.visaSponsorship, "YES");

  const blueCard = classifySponsorship("We support an EU Blue Card visa for successful applicants.");
  assert.equal(blueCard.visaSponsorship, "YES");
});

test("detects immigration and work permit application assistance", () => {
  const immigration = classifySponsorship("Our global mobility team provides assistance with your immigration process.");
  assert.equal(immigration.visaSponsorship, "YES");
  assert.equal(immigration.internationalCandidates, "YES");

  const permit = classifySponsorship("Support for your work permit application is included.");
  assert.equal(permit.visaSponsorship, "YES");
});

test("detects relocation allowances, expenses, and direct relocation support", () => {
  const allowance = classifySponsorship("A relocation allowance is provided for your move to Berlin.");
  assert.equal(allowance.relocationSupport, "YES");

  const expenses = classifySponsorship("Your moving expenses will be covered by the company.");
  assert.equal(expenses.relocationSupport, "YES");

  const direct = classifySponsorship("The employer will relocate you to Amsterdam.");
  assert.equal(direct.relocationSupport, "YES");
});

test("detects broader negative sponsorship and relocation language", () => {
  const sponsorship = classifySponsorship("Applicants requiring work authorization sponsorship will not be considered.");
  assert.equal(sponsorship.visaSponsorship, "NO");

  const authorization = classifySponsorship("Candidates must be legally authorized to work in the United States.");
  assert.equal(authorization.visaSponsorship, "NO");
  assert.equal(authorization.existingWorkAuthorizationRequired, "YES");

  const relocation = classifySponsorship("We are unable to offer relocation for this role.");
  assert.equal(relocation.relocationSupport, "NO");
});

test("does not promote conditional sponsorship to confirmed support", () => {
  const result = classifySponsorship("Visa sponsorship may be considered for exceptional candidates on a case-by-case basis.");
  assert.equal(result.visaSponsorship, "UNKNOWN");
});

test("negative support wording overrides embedded positive phrases", () => {
  const immigration = classifySponsorship("We are unable to provide any immigration related support for this position.");
  assert.equal(immigration.visaSponsorship, "NO");

  const visas = classifySponsorship("We are not able to sponsor visas for this role.");
  assert.equal(visas.visaSponsorship, "NO");
});

test("detects broader immigration benefits without promoting conditional wording", () => {
  assert.equal(classifySponsorship("The company will arrange your work permit.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("Employer-provided immigration counsel will guide successful applicants.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("Visa application costs will be covered.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("Immigration counsel may be provided depending on location.").visaSponsorship, "UNKNOWN");
});

test("detects relocation package components only with move context", () => {
  assert.equal(classifySponsorship("Temporary accommodation is provided as part of your relocation.").relocationSupport, "YES");
  assert.equal(classifySponsorship("Household goods shipping costs will be covered.").relocationSupport, "YES");
  assert.equal(classifySponsorship("Family relocation assistance is included.").relocationSupport, "YES");
  assert.equal(classifySponsorship("Business travel and hotels are reimbursed.").relocationSupport, "UNKNOWN");
});

test("role-specific exclusions override generic benefits", () => {
  const result = classifySponsorship("Our global benefits include relocation support. However, relocation is not available for this role.");
  assert.equal(result.relocationSupport, "NO");
});

test("screening questions are not treated as support evidence", () => {
  const questionOnly = classifySponsorship("Do you require visa and relocation assistance?");
  assert.equal(questionOnly.visaSponsorship, "UNKNOWN");
  assert.equal(questionOnly.relocationSupport, "UNKNOWN");
  assert.deepEqual(questionOnly.evidence, []);

  const followedByOffer = classifySponsorship("Will you require visa sponsorship? Visa sponsorship is available for this role.");
  assert.equal(followedByOffer.visaSponsorship, "YES");
});

test("detects country-specific employer sponsorship programs", () => {
  assert.equal(classifySponsorship("A Certificate of Sponsorship will be assigned under the Skilled Worker route.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("We are an IND recognised sponsor and support highly skilled migrant applications.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("Your Employment Pass application will be submitted by the company.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("LMIA support is provided for the successful candidate.").visaSponsorship, "YES");
  assert.equal(classifySponsorship("We mention the EU Blue Card, but support may be considered case-by-case.").visaSponsorship, "UNKNOWN");
});
