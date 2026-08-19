export const ATS_TYPES = ["greenhouse", "lever", "ashby"] as const;
export type AtsType = (typeof ATS_TYPES)[number];

export const ROLE_FAMILIES = [
  "data_analytics", "business_analytics", "product_analytics", "pricing_revenue",
  "growth_analytics", "operations_analytics", "bi_reporting", "strategy", "analytics_leadership",
] as const;
export type RoleFamily = (typeof ROLE_FAMILIES)[number];

export type TernarySignal = "YES" | "NO" | "UNKNOWN";
export type RemoteType = "REMOTE" | "HYBRID" | "ONSITE" | "UNKNOWN";

export interface CompanyConfig {
  name: string;
  atsType: AtsType;
  identifier: string;
  website?: string;
  careersUrl?: string;
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
}
