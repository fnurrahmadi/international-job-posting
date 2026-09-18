import type { JobClassification } from "./types";

export interface SupportScoreBreakdown {
  baseline: number;
  visa: number;
  relocation: number;
  international: number;
  authorization: number;
  evidence: number;
  possible: number;
  total: number;
}

type ScoreInput = Pick<JobClassification, "visaSponsorship" | "relocationSupport" | "internationalCandidates" | "existingWorkAuthorizationRequired" | "evidence" | "possibleSupport" | "possibleEvidence">;

export function calculateSupportScore(classification: ScoreInput): SupportScoreBreakdown {
  const baseline = 10;
  const visa = classification.visaSponsorship === "YES" ? 40 : classification.visaSponsorship === "NO" ? -30 : 0;
  const relocation = classification.relocationSupport === "YES" ? 35 : classification.relocationSupport === "NO" ? -15 : 0;
  const international = classification.internationalCandidates === "YES" ? 12 : classification.internationalCandidates === "NO" ? -15 : 0;
  const authorization = classification.existingWorkAuthorizationRequired === "YES" ? -35 : 0;
  const evidence = Math.min(10, classification.evidence.length * 2);
  const confirmed = classification.visaSponsorship === "YES" || classification.relocationSupport === "YES";
  const possible = classification.possibleSupport && !confirmed ? 6 : 0;
  return { baseline, visa, relocation, international, authorization, evidence, possible, total: Math.max(0, Math.min(100, baseline + visa + relocation + international + authorization + evidence + possible)) };
}
