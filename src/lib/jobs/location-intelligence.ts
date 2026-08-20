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
  const contexts = description.match(/(?:open to|remote (?:in|within|across)|based in|hiring in|work from|candidates? (?:based |located )?in|located in)[^.?!;]{0,180}/gi) ?? [];
  return [...new Set(contexts.flatMap(extractCountryCodes))].sort();
}
