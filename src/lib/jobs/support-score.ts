import type { JobClassification } from "./types";

export interface SupportScoreBreakdown {
  visa: number;
  relocation: number;
  international: number;
  authorization: number;
  evidence: number;
  total: number;
}

export function calculateSupportScore(classification: Omit<JobClassification, "supportScore">): SupportScoreBreakdown {
  const visa = classification.visaSponsorship === "YES" ? 35 : classification.visaSponsorship === "NO" ? -20 : 0;
  const relocation = classification.relocationSupport === "YES" ? 35 : classification.relocationSupport === "NO" ? -10 : 0;
  const international = classification.internationalCandidates === "YES" ? 10 : 0;
  const authorization = classification.existingWorkAuthorizationRequired === "YES" ? -25 : 10;
  const evidence = Math.min(10, classification.evidence.length * 2);
  return { visa, relocation, international, authorization, evidence, total: Math.max(0, Math.min(100, visa + relocation + international + authorization + evidence)) };
}
