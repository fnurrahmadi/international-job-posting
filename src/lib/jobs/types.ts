export const ATS_TYPES = [
  "greenhouse", "lever", "ashby", "smartrecruiters", "recruitee", "personio", "workable", "workday",
  "comeet", "breezy", "teamtailor", "pinpoint", "jobvite", "arbeitnow", "successfactors", "oracle",
  "bolt", "attrax", "vinted", "thehub",
] as const;
export type AtsType = (typeof ATS_TYPES)[number];

export const ROLE_FAMILIES = [
  "data_analytics", "business_analytics", "product_analytics", "pricing_revenue",
  "growth_analytics", "operations_analytics", "bi_reporting", "strategy", "analytics_leadership",
  "data_science", "data_engineering", "machine_learning", "product_management",
  "strategy_management", "business_operations",
] as const;
export type RoleFamily = (typeof ROLE_FAMILIES)[number];
export type RoleCategory = "analytics" | "data_ml" | "product" | "strategy_ops";

export type TernarySignal = "YES" | "NO" | "UNKNOWN";
export type RelocationScope = "GLOBAL" | "EU_ONLY" | "EEA_ONLY" | "COUNTRY_ONLY" | "UNKNOWN";
export type PermitFeasibility = "HIGH" | "POSSIBLE" | "LOW" | "UNKNOWN";
export type RemoteType = "REMOTE" | "HYBRID" | "ONSITE" | "UNKNOWN";

export interface CompanyConfig {
  name: string;
  atsType: AtsType;
  identifier: string;
  website?: string;
  careersUrl?: string;
  feedUrl?: string;
  enabled?: boolean;
}

export interface RawJob {
  source: AtsType;
  sourceJobId: string;
  company: CompanyConfig;
  title: string;
  descriptionHtml: string;
  location: string;
  url: string;
  postedAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface NormalizedJob extends RawJob {
  descriptionText: string;
  countryCode: string | null;
  remoteType: RemoteType;
  contentHash: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: "YEAR" | "MONTH" | "HOUR" | null;
}

export interface JobClassification {
  roleFamily: RoleFamily;
  seniority: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "MANAGER" | "DIRECTOR" | "UNKNOWN";
  visaSponsorship: TernarySignal;
  relocationSupport: TernarySignal;
  internationalCandidates: TernarySignal;
  existingWorkAuthorizationRequired: TernarySignal;
  confidence: number;
  evidence: string[];
  possibleSupport: boolean;
  possibleEvidence: string[];
  supportScore: number;
  roleMatchScore: number;
  relocationConfidence: number;
  visaConfidence: number;
  relocationScope: RelocationScope;
  permitFeasibility: PermitFeasibility;
  permitPathway: string | null;
  permitReason: string | null;
  nonEuEligible: TernarySignal;
  relocationEvidence: string[];
  visaEvidence: string[];
  englishSpeaking: TernarySignal;
  localLanguageRequired: TernarySignal;
  languageRequirements: string[];
}
