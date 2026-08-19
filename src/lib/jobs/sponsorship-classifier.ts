import type { TernarySignal } from "./types";

const VISA_POSITIVE = [
  /(?:visa|immigration|work permit) sponsorship (?:is )?(?:available|provided|offered)/i,
  /(?:we|company) (?:can |will )?sponsor (?:a )?(?:visa|work permit)/i,
  /immigration support/i,
];
const VISA_NEGATIVE = [
  /(?:cannot|can't|unable to|do not|don't|won't|will not) (?:provide )?(?:visa|immigration|work permit) sponsorship/i,
  /(?:visa|work permit) sponsorship (?:is )?not (?:available|provided|offered)/i,
  /no (?:visa|immigration|work permit) sponsorship/i,
];
const AUTH_REQUIRED = [
  /must (?:already )?(?:have|possess) (?:the )?(?:right|authorization) to work/i,
  /existing (?:work authorization|right to work)/i,
  /without (?:the need for )?(?:current or future )?sponsorship/i,
];
const RELOCATION_POSITIVE = [
  /relocation (?:package|assistance|support|benefit)(?: is)? (?:available|provided|offered|included)?/i,
  /(?:we|company) (?:support|provide|offer) (?:international )?relocation/i,
  /visa and relocation assistance/i,
];
const RELOCATION_NEGATIVE = [/no relocation (?:assistance|support|package)/i, /relocation (?:is )?not (?:available|provided|offered)/i];
const INTERNATIONAL_POSITIVE = [/international (?:applicants|candidates)/i, /relocat(?:e|ing) (?:to|from)/i, /global mobility/i];

function signal(text: string, positive: RegExp[], negative: RegExp[]): TernarySignal {
  if (negative.some((pattern) => pattern.test(text))) return "NO";
  if (positive.some((pattern) => pattern.test(text))) return "YES";
  return "UNKNOWN";
}

function evidenceFor(text: string, patterns: RegExp[]): string[] {
  return patterns.flatMap((pattern) => {
    const match = text.match(pattern);
    return match ? [match[0].slice(0, 240)] : [];
  }).slice(0, 5);
}

export function classifySponsorship(text: string) {
  const authRequired = AUTH_REQUIRED.some((pattern) => pattern.test(text));
  const visaSponsorship = authRequired ? "NO" : signal(text, VISA_POSITIVE, VISA_NEGATIVE);
  const relocationSupport = signal(text, RELOCATION_POSITIVE, RELOCATION_NEGATIVE);
  const internationalCandidates = signal(text, INTERNATIONAL_POSITIVE, [...AUTH_REQUIRED, ...VISA_NEGATIVE]);
  const allPatterns = [...VISA_POSITIVE, ...VISA_NEGATIVE, ...AUTH_REQUIRED, ...RELOCATION_POSITIVE, ...RELOCATION_NEGATIVE, ...INTERNATIONAL_POSITIVE];
  const evidence = evidenceFor(text, allPatterns);

  return {
    visaSponsorship,
    relocationSupport,
    internationalCandidates,
    existingWorkAuthorizationRequired: authRequired ? "YES" as const : "UNKNOWN" as const,
    evidence,
    confidence: evidence.length ? 0.9 : 0.5,
  };
}
