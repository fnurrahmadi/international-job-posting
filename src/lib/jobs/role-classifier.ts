import type { JobClassification, RoleFamily } from "./types";

const FAMILY_RULES: Array<[RoleFamily, RegExp[]]> = [
  ["business_operations", [
    /\b(?:business|commercial|company|corporate) operations (?:manager|lead|director|head)\b/i,
    /\b(?:manager|lead|director|head) of (?:business|commercial) operations\b/i,
    /\bstrategy\s*(?:&|and)\s*operations (?:manager|lead|director|head)\b/i,
    /\bchief of staff\b/i,
    /\b(?:strategic initiatives|business transformation) (?:manager|lead|director|head)\b/i,
  ]],
  ["strategy_management", [
    /\b(?:corporate|business|commercial|company|group) strategy (?:manager|lead|director|head)\b/i,
    /\b(?:senior |principal )?strategy manager\b/i,
    /\b(?:director|head|vp|vice president) of (?:(?:corporate|business|commercial|company|group) )?strategy\b/i,
  ]],
  ["product_management", [
    /\b(?:technical |senior |lead |principal |group |staff )?product manager\b/i,
    /\bproduct management (?:lead|manager|director|head)\b/i,
    /\bproduct owner\b/i,
  ]],
  ["machine_learning", [
    /\b(?:machine learning|ml|ai) engineer\b/i,
    /\b(?:applied|research) scientist\b/i,
    /\bmachine learning scientist\b/i,
  ]],
  ["data_engineering", [
    /\b(?:senior |lead |principal |staff )?(?:data|analytics) engineer\b/i,
    /\bdata (?:platform|infrastructure) engineer\b/i,
    /\b(?:etl|data warehouse) (?:developer|engineer)\b/i,
    /\bdata architect\b/i,
  ]],
  ["data_science", [
    /\b(?:senior |lead |principal |staff )?data scientist\b/i,
    /\bdata science (?:lead|manager|director|head)\b/i,
  ]],
  ["pricing_revenue", [/\bpricing\b/i, /\brevenue (?:management|analyst|analytics)\b/i, /\bcommercial (?:data |insights? |analytics? )?(?:analyst|partner|specialist|consultant)\b/i, /\bstrategic finance analyst\b/i, /\brevenue management specialist\b/i]],
  ["product_analytics", [/\bproduct (?:data |insights? )?analyst\b/i, /\bproduct analytics\b/i, /\bproduct insights?\b/i, /\bexperimentation analyst\b/i]],
  ["business_analytics", [/\bbusiness (?:intelligence )?analyst\b/i, /\bbi analyst\b/i]],
  ["growth_analytics", [/\bgrowth analyst\b/i, /\bmarketing (?:data )?analyst\b/i, /\bcustomer (?:insights?|intelligence)(?: (?:partner|consultant|specialist))?\b/i, /\bgrowth intelligence\b/i]],
  ["operations_analytics", [/\boperations? analyst\b/i, /\bstrategy\s*(?:&|and)\s*operations\b/i, /\bsupply chain analyst\b/i, /\bworkforce planning analyst\b/i, /\bmarketplace (?:analyst|performance specialist)\b/i]],
  ["bi_reporting", [/\b(?:power )?bi developer\b/i, /\breporting analyst\b/i, /\bbusiness intelligence developer\b/i]],
  ["strategy", [/\bstrateg(?:y|ic) analyst\b/i, /\bbusiness strategy\b/i]],
  ["analytics_leadership", [/\banalytics (?:lead|manager|director|head)\b/i, /\bbi manager\b/i, /\bdata insights? manager\b/i]],
  ["data_analytics", [/\bdata analyst\b/i, /\banalytics? (?:analyst|specialist|consultant)\b/i, /\binsights? analyst\b/i, /\bdecision scientist\b/i, /\bperformance analyst\b/i, /\b(?:fraud|risk) analytics\b/i]],
];

const POTENTIAL_TITLE = /\b(?:analyst|analytics|insights?|intelligence|pricing|revenue management|performance|strategy|workforce planning|decision scientist|commercial|marketplace|data scientist|data engineer|machine learning|ml engineer|ai engineer|product manager|product owner|product management|business operations|chief of staff|strategic initiatives|business transformation)\b/i;
const EXCLUDED_TITLE = /\b(?:software|backend|frontend|full[ -]?stack|mobile|security|network|infrastructure|systems?) engineer\b/i;
const DESCRIPTION_SIGNALS = [
  /\b(?:sql|tableau|power bi|looker|snowflake|databricks)\b/i,
  /\b(?:dashboard|reporting|visuali[sz]ation|business intelligence)\b/i,
  /\b(?:analyse|analyze|analysis|analytics|insights?|metrics|forecasting)\b/i,
  /\b(?:experimentation|a\/b test|statistical|quantitative|data-driven)\b/i,
  /\b(?:pricing|revenue|commercial|product|growth|operations|marketplace|customer) (?:performance|strategy|data|decisions?|insights?|analytics)\b/i,
];

export function roleCategoryForFamily(roleFamily: RoleFamily): "analytics" | "data_ml" | "product" | "strategy_ops" {
  if (["data_science", "data_engineering", "machine_learning"].includes(roleFamily)) return "data_ml";
  if (roleFamily === "product_management") return "product";
  if (["strategy_management", "business_operations"].includes(roleFamily)) return "strategy_ops";
  return "analytics";
}

export function isPotentialRoleTitle(title: string) {
  return POTENTIAL_TITLE.test(title) && !EXCLUDED_TITLE.test(title);
}

export function classifyRole(title: string, description = ""): { roleFamily: RoleFamily; score: number } | null {
  for (const [roleFamily, patterns] of FAMILY_RULES) {
    if (patterns.some((pattern) => pattern.test(title))) return { roleFamily, score: 0.94 };
  }
  if (!isPotentialRoleTitle(title)) return null;
  const descriptionSignalCount = DESCRIPTION_SIGNALS.filter((pattern) => pattern.test(description)).length;
  if (descriptionSignalCount < 2) return null;
  for (const [roleFamily, patterns] of FAMILY_RULES) {
    if (patterns.some((pattern) => pattern.test(`${title} ${description.slice(0, 8_000)}`))) {
      return { roleFamily, score: Math.min(0.9, 0.7 + descriptionSignalCount * 0.05) };
    }
  }
  return { roleFamily: "data_analytics", score: Math.min(0.86, 0.68 + descriptionSignalCount * 0.05) };
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
