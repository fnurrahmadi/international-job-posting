import type { PermitFeasibility, RelocationScope, RoleFamily, TernarySignal } from "./types";
import type { SalaryData } from "./salary-intelligence";

export const PERMIT_RULE_VERSION = "2026.1";
const SKILLED_ROLES = new Set<RoleFamily>(["data_analytics", "business_analytics", "product_analytics", "pricing_revenue", "growth_analytics", "operations_analytics", "bi_reporting", "strategy", "analytics_leadership", "data_science", "data_engineering", "machine_learning", "product_management", "strategy_management", "business_operations"]);

export function assessPermitFeasibility(input: { countryCode: string | null; roleFamily: RoleFamily; salary: SalaryData; visaSupport: TernarySignal; authorizationRequired: TernarySignal; relocationScope: RelocationScope; }): { permitFeasibility: PermitFeasibility; permitPathway: string | null; permitReason: string | null; nonEuEligible: TernarySignal } {
  if (input.visaSupport === "NO" || input.authorizationRequired === "YES" || ["EU_ONLY", "EEA_ONLY", "COUNTRY_ONLY"].includes(input.relocationScope)) {
    return { permitFeasibility: "LOW", permitPathway: null, permitReason: "The listing restricts work authorization or relocation in a way that excludes a new non-EU applicant.", nonEuEligible: "NO" };
  }
  if (input.visaSupport === "YES") return { permitFeasibility: "HIGH", permitPathway: "Employer-supported work permit", permitReason: "The employer explicitly offers visa or work-permit support.", nonEuEligible: "YES" };
  if (!SKILLED_ROLES.has(input.roleFamily)) return { permitFeasibility: "UNKNOWN", permitPathway: null, permitReason: null, nonEuEligible: "UNKNOWN" };
  const annual = input.salary.salaryPeriod === "YEAR" ? input.salary.salaryMax : input.salary.salaryPeriod === "MONTH" && input.salary.salaryMax ? input.salary.salaryMax * 12 : null;
  if (input.countryCode === "DK") {
    if (input.salary.salaryCurrency === "DKK" && annual && annual >= 552_000) return { permitFeasibility: "HIGH", permitPathway: "Denmark Pay Limit Scheme", permitReason: "Advertised maximum salary meets the 2026 Pay Limit Scheme threshold; eligibility is not guaranteed.", nonEuEligible: "YES" };
    if (input.salary.salaryCurrency === "DKK" && annual && annual >= 446_000) return { permitFeasibility: "POSSIBLE", permitPathway: "Denmark Supplementary Pay Limit Scheme", permitReason: "Advertised maximum salary meets the 2026 supplementary threshold; other conditions still apply.", nonEuEligible: "UNKNOWN" };
    return { permitFeasibility: "POSSIBLE", permitPathway: "Positive List / Pay Limit / Fast-Track may apply", permitReason: "This skilled role may fit a Danish work-permit pathway, but salary and employer eligibility are not confirmed.", nonEuEligible: "UNKNOWN" };
  }
  if (input.countryCode === "FI") {
    if (input.salary.salaryCurrency === "EUR" && annual && annual >= 47_244) return { permitFeasibility: "HIGH", permitPathway: "Finland specialist permit / EU Blue Card", permitReason: "Advertised maximum salary meets the 2026 specialist income threshold; eligibility is not guaranteed.", nonEuEligible: "YES" };
    return { permitFeasibility: "POSSIBLE", permitPathway: "Finland specialist permit", permitReason: "This skilled role may fit Finland's specialist pathway, but salary and qualification requirements are not confirmed.", nonEuEligible: "UNKNOWN" };
  }
  return { permitFeasibility: "UNKNOWN", permitPathway: null, permitReason: null, nonEuEligible: "UNKNOWN" };
}
