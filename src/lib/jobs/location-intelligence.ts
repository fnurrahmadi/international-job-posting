const COUNTRY_NAMES: Array<[string, string[]]> = [
  ["US", ["United States", "United States of America", "USA"]], ["GB", ["United Kingdom", "Great Britain", "UK"]],
  ["CA", ["Canada"]], ["AU", ["Australia"]], ["NZ", ["New Zealand"]], ["IE", ["Ireland"]],
  ["DE", ["Germany"]], ["FR", ["France"]], ["NL", ["Netherlands", "The Netherlands"]], ["ES", ["Spain"]],
  ["PT", ["Portugal"]], ["IT", ["Italy"]], ["PL", ["Poland"]], ["CZ", ["Czech Republic", "Czechia"]],
  ["AT", ["Austria"]], ["CH", ["Switzerland"]], ["SE", ["Sweden"]], ["NO", ["Norway"]],
  ["DK", ["Denmark"]], ["FI", ["Finland"]], ["EE", ["Estonia"]], ["LV", ["Latvia"]],
  ["LT", ["Lithuania"]], ["RO", ["Romania"]], ["BG", ["Bulgaria"]], ["HU", ["Hungary"]],
  ["GR", ["Greece"]], ["BE", ["Belgium"]], ["LU", ["Luxembourg"]], ["SG", ["Singapore"]],
  ["TH", ["Thailand"]], ["MY", ["Malaysia"]], ["ID", ["Indonesia"]], ["PH", ["Philippines"]],
  ["VN", ["Vietnam"]], ["IN", ["India"]], ["JP", ["Japan"]], ["KR", ["South Korea", "Korea"]],
  ["HK", ["Hong Kong"]], ["TW", ["Taiwan"]], ["AE", ["United Arab Emirates", "UAE"]],
  ["SA", ["Saudi Arabia"]], ["IL", ["Israel"]], ["TR", ["Turkey", "Türkiye"]], ["BR", ["Brazil"]],
  ["MX", ["Mexico"]], ["AR", ["Argentina"]], ["CL", ["Chile"]], ["CO", ["Colombia"]],
  ["PE", ["Peru"]], ["ZA", ["South Africa"]], ["KE", ["Kenya"]], ["NG", ["Nigeria"]],
  ["EG", ["Egypt"]], ["QA", ["Qatar"]],
];

const CITY_COUNTRIES: Record<string, string> = {
  amsterdam: "NL", austin: "US", bangkok: "TH", barcelona: "ES", berlin: "DE", boston: "US",
  bratislava: "SK", brussels: "BE", bucharest: "RO", budapest: "HU", chicago: "US", copenhagen: "DK",
  dublin: "IE", dubai: "AE", helsinki: "FI", hyderabad: "IN", jakarta: "ID", "kuala lumpur": "MY",
  lisbon: "PT", london: "GB", "los angeles": "US", madrid: "ES", melbourne: "AU", munich: "DE", "new york": "US",
  oslo: "NO", paris: "FR", prague: "CZ", riga: "LV", seoul: "KR", singapore: "SG", sofia: "BG",
  "san francisco": "US", seattle: "US", stockholm: "SE", sydney: "AU", tallinn: "EE", tokyo: "JP", toronto: "CA", vienna: "AT",
  vilnius: "LT", warsaw: "PL", zurich: "CH", "são paulo": "BR", "sao paulo": "BR",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractCountryCodes(text: string): string[] {
  const codes = new Set<string>();
  for (const [code, names] of COUNTRY_NAMES) {
    if (names.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(text))) codes.add(code);
  }
  const explicitCodes: Record<string, string> = { US: "US", USA: "US", GB: "GB", UK: "GB", SG: "SG", HK: "HK", UAE: "AE" };
  for (const [alias, code] of Object.entries(explicitCodes)) {
    if (new RegExp(`(?:^|[,;/()\\s-])${alias}(?:$|[,;/()\\s-])`).test(text)) codes.add(code);
  }
  const lower = text.toLowerCase();
  for (const [city, code] of Object.entries(CITY_COUNTRIES)) {
    if (new RegExp(`\\b${escapeRegExp(city)}\\b`, "i").test(lower)) codes.add(code);
  }
  return [...codes].sort();
}

export function inferCountryCode(location: string): string | null {
  const codes = extractCountryCodes(location);
  return codes.length === 1 ? codes[0] : null;
}

export function extractEligibleCountryCodes(description: string): string[] {
  const contexts = description.match(/(?:open to|available to|remote (?:in|within|across|from)|work from|work anywhere in|hiring (?:in|across)|candidates? (?:based |located |living )?in|applications? from)[^.?!;]{0,180}/gi) ?? [];
  return [...new Set(contexts.flatMap(extractCountryCodes))].sort();
}

export interface InternationalEligibility {
  internationalCandidates: "YES" | "NO" | "UNKNOWN";
  existingWorkAuthorizationRequired: "YES" | "UNKNOWN";
  eligibleCountryCodes: string[];
  evidence: string[];
}

const INTERNATIONAL_OPEN = [
  /(?:applications?|applicants?|candidates?) (?:are )?(?:welcome|accepted|considered) from (?:anywhere|all countries|around the world|abroad|outside (?:the )?country)/i,
  /(?:open to|hiring|available to) (?:candidates?|applicants?|talent) (?:worldwide|globally|internationally|from abroad)/i,
  /(?:work|remote) from anywhere(?: in the world)?/i,
  /(?:global|worldwide|international) (?:remote|hiring|talent pool|candidate search)/i,
  /(?:multiple|several) (?:countries|locations)|across (?:the )?(?:world|globe|europe|eu|emea|apac|americas)/i,
];

const LOCAL_RESTRICTION = [
  /(?:must|required to|need to) (?:currently |already )?(?:live|reside|be resident|be based|be located) (?:in|within)/i,
  /(?:only|exclusively) (?:open|available) to (?:candidates?|applicants?) (?:currently )?(?:in|based in|located in|residing in)/i,
  /(?:candidates?|applicants?) (?:must|need to) be (?:currently )?(?:based|located|resident) (?:in|within)/i,
  /remote (?:work|role|position)? ?(?:is )?(?:limited|restricted) to/i,
  /we (?:cannot|can't|do not|don't) employ (?:outside|from outside)/i,
];

const WORK_AUTHORIZATION_REQUIRED = [
  /(?:must|required to|need to) (?:already )?(?:have|possess|hold) (?:the )?(?:right|authorization|permission) to work/i,
  /(?:must|required to|need to) be (?:legally )?(?:authorized|eligible|entitled) to work/i,
  /(?:and |, )?(?:must |should |already )?(?:have|possess|hold) (?:the )?(?:right|authorization|permission) to work/i,
  /without (?:current or future )?(?:visa |work permit |work authorization )?sponsorship/i,
  /unrestricted (?:right|authorization|permission) to work/i,
];

function matchingEvidence(text: string, patterns: RegExp[]): string[] {
  const segments = text.split(/(?<=[.!?])\s+|[\r\n]+/).map((part) => part.trim()).filter(Boolean);
  return segments.filter((segment) => patterns.some((pattern) => pattern.test(segment))).map((segment) => segment.slice(0, 240)).slice(0, 5);
}

export function assessInternationalEligibility(description: string): InternationalEligibility {
  const eligibleCountryCodes = extractEligibleCountryCodes(description);
  const restrictionEvidence = matchingEvidence(description, [...LOCAL_RESTRICTION, ...WORK_AUTHORIZATION_REQUIRED]);
  const authorizationEvidence = matchingEvidence(description, WORK_AUTHORIZATION_REQUIRED);
  const openEvidence = matchingEvidence(description, INTERNATIONAL_OPEN);
  const multiCountryEvidence = eligibleCountryCodes.length > 1
    ? matchingEvidence(description, [/(?:open to|available to|remote (?:in|within|across|from)|work from|hiring (?:in|across)|applications? from)/i])
    : [];

  return {
    internationalCandidates: restrictionEvidence.length > 0 ? "NO" : openEvidence.length > 0 || multiCountryEvidence.length > 0 ? "YES" : "UNKNOWN",
    existingWorkAuthorizationRequired: authorizationEvidence.length > 0 ? "YES" : "UNKNOWN",
    eligibleCountryCodes,
    evidence: [...new Set([...restrictionEvidence, ...openEvidence, ...multiCountryEvidence])].slice(0, 5),
  };
}
