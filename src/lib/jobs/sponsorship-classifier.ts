import type { TernarySignal } from "./types";

const VISA_POSITIVE = [
  /(?:visa|immigration|work permit|work authorization) sponsorship (?:is |will be )?(?:available|provided|offered)/i,
  /(?:eligible|open) for (?:visa|immigration|work permit|work authorization) sponsorship/i,
  /(?:we|the company|the employer) (?:can |will )?sponsor (?:an? |your )?(?:visa|work permit|work authorization)/i,
  /sponsor(?:ing|ship)? (?:an? |your )?(?:visa|work permit|work authorization)/i,
  /(?:visa|work permit) (?:transfer|renewal) (?:support|assistance|sponsorship)/i,
  /(?:support|assistance) (?:with|for) (?:your |the )?(?:visa|immigration|work permit)(?: application| process)?/i,
  /(?:immigration|work permit|visa) (?:support|assistance|services)/i,
  /(?:skilled worker|h-?1b|o-?1|eu blue card) visa sponsorship/i,
  /(?:sponsor|support) (?:an? |the )?(?:skilled worker|h-?1b|o-?1|eu blue card) visa/i,
];
const VISA_NEGATIVE = [
  /(?:cannot|can't|unable to|do not|does not|don't|won't|will not) (?:provide |offer )?(?:visa|immigration|work permit|work authorization) sponsorship/i,
  /(?:visa|immigration|work permit|work authorization) sponsorship (?:is |will be )?not (?:available|provided|offered)/i,
  /no (?:current or future )?(?:visa|immigration|work permit|work authorization) sponsorship/i,
  /not eligible for (?:visa|immigration|work permit|work authorization) sponsorship/i,
  /applicants? requiring (?:visa|work permit|work authorization) sponsorship (?:cannot|can't|will not|won't) be considered/i,
];
const AUTH_REQUIRED = [
  /must (?:already )?(?:have|possess) (?:the )?(?:right|authorization) to work/i,
  /existing (?:work authorization|right to work)/i,
  /without (?:the need for )?(?:current or future )?sponsorship/i,
  /must be (?:legally |currently )?authorized to work/i,
  /unrestricted (?:right|authorization) to work/i,
  /(?:right|authorization) to work (?:is )?required/i,
];
const RELOCATION_POSITIVE = [
  /relocation (?:package|assistance|support|benefit|allowance|bonus|reimbursement)(?: is| will be)? (?:available|provided|offered|included|covered)?/i,
  /(?:we|the company|the employer) (?:support|provide|offer|cover) (?:your |international )?relocation/i,
  /(?:support|assistance) (?:with|for) (?:your )?relocation/i,
  /(?:relocation|moving) (?:costs|expenses) (?:are |will be )?(?:covered|reimbursed|paid)/i,
  /(?:we|the company|the employer) (?:can |will )?relocate you/i,
  /visa and relocation assistance/i,
];
const RELOCATION_NEGATIVE = [
  /no relocation (?:assistance|support|package|allowance|reimbursement)/i,
  /relocation (?:is |will be )?not (?:available|provided|offered|covered)/i,
  /(?:cannot|can't|unable to|do not|does not|don't|won't|will not) (?:provide |offer |cover )?relocation/i,
];
const INTERNATIONAL_POSITIVE = [
  /international (?:applicants|candidates|applications)/i,
  /applications? from abroad/i,
  /candidates? (?:from )?(?:around the world|worldwide|globally)/i,
  /relocat(?:e|ing) (?:to|from)/i,
  /global mobility/i,
];

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
