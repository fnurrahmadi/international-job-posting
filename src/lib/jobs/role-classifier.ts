import type { JobClassification, RoleFamily } from "./types";

const FAMILY_RULES: Array<[RoleFamily, RegExp[]]> = [
  ["pricing_revenue", [/\bpricing\b/i, /\brevenue (?:management|analyst|analytics)\b/i, /\bcommercial analyst\b/i]],
  ["product_analytics", [/\bproduct (?:data )?analyst\b/i, /\bproduct analytics\b/i]],
  ["business_analytics", [/\bbusiness (?:intelligence )?analyst\b/i, /\bbi analyst\b/i]],
  ["growth_analytics", [/\bgrowth analyst\b/i, /\bmarketing analyst\b/i, /\bcustomer insights?\b/i]],
  ["operations_analytics", [/\boperations? analyst\b/i, /\bstrategy\s*(?:&|and)\s*operations\b/i, /\bsupply chain analyst\b/i]],
  ["bi_reporting", [/\b(?:power )?bi developer\b/i, /\breporting analyst\b/i, /\bbusiness intelligence developer\b/i]],
  ["strategy", [/\bstrateg(?:y|ic) analyst\b/i, /\bbusiness strategy\b/i]],
  ["analytics_leadership", [/\banalytics (?:lead|manager|director|head)\b/i, /\bbi manager\b/i]],
  ["data_analytics", [/\bdata analyst\b/i, /\banalytics? (?:analyst|specialist|consultant)\b/i]],
];

export function classifyRole(title: string): { roleFamily: RoleFamily; score: number } | null {
  for (const [roleFamily, patterns] of FAMILY_RULES) {
    if (patterns.some((pattern) => pattern.test(title))) return { roleFamily, score: 0.94 };
  }
  return null;
}

export function classifySeniority(title: string): JobClassification["seniority"] {
  if (/\b(?:intern|internship|working student)\b/i.test(title)) return "INTERN";
  if (/\b(?:junior|jr\.?|graduate|entry.level|associate)\b/i.test(title)) return "JUNIOR";
  if (/\b(?:director|head|vp|vice president)\b/i.test(title)) return "DIRECTOR";
  if (/\bmanager\b/i.test(title)) return "MANAGER";
  if (/\b(?:lead|principal|staff)\b/i.test(title)) return "LEAD";
  if (/\b(?:senior|sr\.?)\b/i.test(title)) return "SENIOR";
  return "MID";
}
