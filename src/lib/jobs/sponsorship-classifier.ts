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
  /(?:this (?:role|position)|successful (?:candidate|applicant)s?) (?:is|are) eligible for (?:visa|work permit|work authorization) sponsorship/i,
  /(?:we|the company|the employer) (?:will |can )?(?:arrange|obtain|process) (?:your |a )?(?:visa|work permit|work authorization)/i,
  /(?:visa|immigration|work permit) (?:application |legal |processing )?(?:fees|costs|expenses) (?:are |will be )?(?:covered|paid|reimbursed)/i,
  /(?:company-provided|employer-provided) immigration (?:counsel|lawyer|legal services)/i,
  /(?:immigration counsel|immigration lawyer) (?:is |will be )?(?:provided|available|covered)/i,
  /(?:new[ -]hire|employee) immigration assistance/i,
  /(?:global mobility|immigration) (?:team|partner|provider|vendor) (?:will |can )?(?:manage|handle|support|assist with) (?:your |the )?(?:visa|immigration|work permit|residence permit)/i,
  /(?:work|residence) permit (?:application|renewal|process(?:ing)?) (?:is |will be )?(?:handled|managed|supported|submitted) by (?:us|the company|our immigration team)/i,
  /(?:certificate of sponsorship|\bcos\b) (?:is |will be )?(?:provided|available|assigned|issued)/i,
  /(?:skilled worker|global business mobility|scale-up worker) (?:route |visa )?(?:sponsorship|support) (?:is |will be )?(?:available|provided|offered)/i,
  /(?:highly skilled migrant|knowledge migrant|kennismigrant) (?:visa |permit |scheme )?(?:sponsorship|support|application) (?:is |will be )?(?:available|provided|handled|offered)/i,
  /(?:we|the employer|the company) (?:are |is )?(?:an? )?(?:ind )?(?:recognised|recognized) sponsor.*(?:support|handle|submit) (?:your )?(?:highly skilled migrant|knowledge migrant|kennismigrant) application/i,
  /(?:eu blue card|blaue karte) (?:application|support|sponsorship) (?:is |will be )?(?:available|provided|handled|offered)/i,
  /(?:employment pass|s pass) (?:application|renewal|sponsorship|support) (?:is |will be )?(?:available|provided|handled|submitted|offered)/i,
  /(?:certificate of eligibility|coe) (?:application|support) (?:is |will be )?(?:provided|handled|submitted)/i,
  /(?:lmia|labour market impact assessment) (?:support|application) (?:is |will be )?(?:provided|handled|submitted)/i,
  /(?:temporary skill shortage|subclass 482|skills in demand) visa (?:sponsorship|support) (?:is |will be )?(?:available|provided|offered)/i,
  /(?:uae |emirates )?(?:employment|work|residence) visa (?:is |will be )?(?:provided|arranged|processed|sponsored)/i,
  /(?:employer of record|eor) (?:arrangement|employment|support) (?:is |will be )?(?:available|provided|used)/i,
];
const COMBINED_SUPPORT_NEGATIVE = [
  /(?:visa|immigration|work permit)(?: sponsorship)?\s*(?:and|or|&|\/)\s*relocation (?:support|assistance|sponsorship)?\s*(?:(?:is|are|will be)\s+not|will\s+not\s+be)\s+(?:available|provided|offered|covered)/i,
  /(?:visa|relocation)\s*(?:and|or|&|\/)\s*(?:visa|relocation) support\s*(?:(?:is|are|will be)\s+not|will\s+not\s+be)\s+(?:available|provided|offered|covered)/i,
  /(?:cannot|can't|unable to|do not|does not|don't|won't|will not) (?:provide|offer|cover) (?:any )?(?:visa|immigration|work permit)(?: sponsorship| support| assistance)?\s*(?:and|or|&|\/)\s*relocation (?:support|assistance)?/i,
];
const VISA_NEGATIVE = [
  ...COMBINED_SUPPORT_NEGATIVE,
  /(?:cannot|can't|unable to|do not|does not|don't|won't|will not) (?:provide |offer )?(?:visa|immigration|work permit|work authorization) sponsorship/i,
  /(?:cannot|can't|unable to|not able to|won't|will not) sponsor visas?/i,
  /(?:cannot|can't|unable to|not able to|won't|will not) (?:provide|offer) (?:any )?(?:visa|immigration|work permit|work authorization)(?: related)? (?:support|assistance|services)/i,
  /(?:visa|immigration|work permit|work authorization) sponsorship (?:is |will be )?not (?:available|provided|offered)/i,
  /no (?:current or future )?(?:visa|immigration|work permit|work authorization) sponsorship/i,
  /not eligible for (?:visa|immigration|work permit|work authorization) sponsorship/i,
  /(?:we|the company|the employer) (?:are |is )?not sponsoring (?:visas?|work permits?|work authorization)/i,
  /applicants? requiring (?:visa|work permit|work authorization) sponsorship (?:cannot|can't|will not|won't) be considered/i,
  /(?:this (?:role|position)|the successful candidate) (?:is |will be )?not eligible for (?:visa|work permit|work authorization) sponsorship/i,
  /(?:must|should) not require (?:current or future )?(?:visa|work permit|work authorization) sponsorship/i,
  /(?:do not|does not|don't|doesn't|cannot|can't|won't|will not) sponsor (?:employment-based )?immigration/i,
  /no (?:visa|immigration|work permit) (?:support|assistance) (?:is |will be )?(?:available|provided|offered)/i,
  /not (?:a |an )?(?:licensed|recognised|recognized) sponsor/i,
  /(?:certificate of sponsorship|employment pass|s pass|eu blue card|highly skilled migrant|lmia) (?:is |will be )?not (?:available|provided|supported)/i,
];
const AUTH_REQUIRED = [
  /must (?:already )?(?:have|possess) (?:the )?(?:right|authorization) to work/i,
  /existing (?:work authorization|right to work)/i,
  /without (?:the need for )?(?:current or future )?sponsorship/i,
  /must be (?:legally |currently )?authorized to work/i,
  /unrestricted (?:right|authorization) to work/i,
  /(?:right|authorization) to work (?:is )?required/i,
  /must have (?:valid |current )?(?:work authorization|working rights|permission to work) (?:before|by) (?:your )?(?:start date|employment)/i,
  /(?:must|need to) be eligible to work (?:in|within) (?:the )?[A-Z][A-Za-z .-]+ without sponsorship/i,
];
const RELOCATION_POSITIVE = [
  /relocation (?:package|assistance|support|benefit|allowance|bonus|reimbursement)(?: is| will be)? (?:available|provided|offered|included|covered)?/i,
  /(?:we|the company|the employer) (?:support|provide|offer|cover) (?:your |international )?relocation/i,
  /(?:support|assistance) (?:with|for) (?:your )?relocation/i,
  /(?:relocation|moving) (?:costs|expenses) (?:are |will be )?(?:covered|reimbursed|paid)/i,
  /(?:we|the company|the employer) (?:can |will )?relocate you/i,
  /visa and relocation assistance/i,
  /(?:settling[ -]in|relocation) (?:payment|stipend)/i,
  /(?:temporary|initial) accommodation (?:is |will be )?(?:provided|covered|paid for) (?:as part of|for) (?:your |the )?(?:move|relocation)/i,
  /(?:one-way |initial )?(?:flight|airfare|travel) (?:to [A-Za-z ,.-]+ )?(?:is |will be )?(?:covered|paid|reimbursed) (?:as part of|for) (?:your |the )?(?:move|relocation)/i,
  /(?:household goods|personal belongings|shipping) (?:costs|expenses) (?:are |will be )?(?:covered|paid|reimbursed)/i,
  /(?:housing|home) search assistance (?:is |will be )?(?:provided|included|available)/i,
  /(?:destination services|relocation agent) (?:are |is |will be )?(?:provided|included|available)/i,
  /(?:partner|spouse|dependent|family) relocation (?:support|assistance|package)/i,
  /(?:settling[ -]in|destination) (?:services|support|assistance)/i,
  /(?:relocation|mobility) vendor (?:is |will be )?(?:provided|available|assigned)/i,
  /(?:home finding|school search|area orientation) (?:support|assistance|services)/i,
];
const RELOCATION_NEGATIVE = [
  ...COMBINED_SUPPORT_NEGATIVE,
  /no relocation (?:assistance|support|package|allowance|reimbursement)/i,
  /relocation(?: (?:support|assistance|package|allowance|reimbursement))? (?:(?:is|are|will be) not|will not be) (?:available|provided|offered|covered)/i,
  /(?:cannot|can't|unable to|do not|does not|don't|won't|will not) (?:provide |offer |cover )?relocation/i,
  /(?:moving|travel|accommodation) (?:costs|expenses) (?:are |will be )?not (?:covered|paid|reimbursed)/i,
];
const INTERNATIONAL_POSITIVE = [
  /international (?:applicants|candidates|applications)/i,
  /applications? from abroad/i,
  /candidates? (?:from )?(?:around the world|worldwide|globally)/i,
  /relocat(?:e|ing) (?:to|from)/i,
  /global mobility/i,
  /applications? (?:are )?(?:welcome|accepted|encouraged) from (?:outside|overseas|abroad)/i,
  /open to (?:applicants|candidates) (?:based )?(?:outside|overseas|worldwide|globally)/i,
  /(?:international|global) relocation/i,
];
const POSSIBLE_SUPPORT = [
  /(?:all )?qualified applicants? (?:are |will be )?considered.*without regard to.*nationality/i,
  /equal opportunity employer.*without regard to.*nationality/i,
  /(?:applications?|applicants?|candidates?) (?:of|from) all nationalities (?:are )?(?:welcome|considered|accepted)/i,
  /(?:regardless|irrespective) of (?:their |your )?nationality/i,
  /no discrimination (?:on the basis of|based on).*(?:nationality|citizenship)/i,
];

const CONDITIONAL = /\b(?:may|might|could|potentially|case[- ]by[- ]case|depending on|subject to|where possible|where applicable|at (?:our|the company's) discretion|for exceptional candidates?)\b/i;
const SCREENING_QUESTION = /(?:\?|^(?:do|does|will|would|are|can|have) you\b).*(?:visa|sponsor|immigration|work permit|work authorization|right to work|relocat)/i;

function evidenceSegments(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|[\r\n]+|\s*[•·]\s*/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !SCREENING_QUESTION.test(segment));
}

function matchesAny(segment: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(segment));
}

function signal(segments: string[], positive: RegExp[], negative: RegExp[]): TernarySignal {
  if (segments.some((segment) => matchesAny(segment, negative))) return "NO";
  if (segments.some((segment) => !CONDITIONAL.test(segment) && matchesAny(segment, positive))) return "YES";
  return "UNKNOWN";
}

function evidenceFor(segments: string[], patterns: RegExp[]): string[] {
  return segments.filter((segment) => matchesAny(segment, patterns)).map((segment) => segment.slice(0, 240)).slice(0, 5);
}

export function classifySponsorship(text: string) {
  const segments = evidenceSegments(text);
  const authRequired = segments.some((segment) => matchesAny(segment, AUTH_REQUIRED));
  const visaSponsorship = authRequired ? "NO" : signal(segments, VISA_POSITIVE, VISA_NEGATIVE);
  const relocationSupport = signal(segments, RELOCATION_POSITIVE, RELOCATION_NEGATIVE);
  const internationalCandidates = signal(segments, INTERNATIONAL_POSITIVE, [...AUTH_REQUIRED, ...VISA_NEGATIVE]);
  const possibleEvidence = visaSponsorship === "UNKNOWN" && relocationSupport === "UNKNOWN" && !authRequired
    ? evidenceFor(segments, POSSIBLE_SUPPORT)
    : [];
  const allPatterns = [...VISA_POSITIVE, ...VISA_NEGATIVE, ...AUTH_REQUIRED, ...RELOCATION_POSITIVE, ...RELOCATION_NEGATIVE, ...INTERNATIONAL_POSITIVE];
  const evidence = evidenceFor(segments, allPatterns);

  return {
    visaSponsorship,
    relocationSupport,
    internationalCandidates,
    existingWorkAuthorizationRequired: authRequired ? "YES" as const : "UNKNOWN" as const,
    evidence,
    possibleSupport: possibleEvidence.length > 0,
    possibleEvidence,
    confidence: evidence.length ? 0.9 : 0.5,
  };
}
