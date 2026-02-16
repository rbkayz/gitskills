import type { TrustTier } from "./types.js";

export type TrustComputationInput = {
  licenseSpdx?: string | null;
  repoUrl?: string | null;
  homepageUrl?: string | null;
  publisherVerified?: boolean;
  hasSkillMd?: boolean;
  hasLicenseFile?: boolean;
  signedRelease?: boolean;
};

export type TrustComputation = {
  score: number;
  tier: TrustTier;
  trusted: boolean;
  breakdown: {
    rules: Record<string, number>;
    total: number;
    tier: TrustTier;
    trusted: boolean;
  };
};

function tierFromScore(score: number): TrustTier {
  if (score >= 80) return "gold";
  if (score >= 65) return "silver";
  if (score >= 50) return "bronze";
  return "community";
}

export function computeTrustScore(input: TrustComputationInput): TrustComputation {
  const rules: Record<string, number> = {
    hasLicenseSpdx: input.licenseSpdx ? 10 : 0,
    hasRepoUrl: input.repoUrl ? 10 : 0,
    hasHomepageUrl: input.homepageUrl ? 10 : 0,
    publisherVerified: input.publisherVerified ? 20 : 0,
    hasSkillMd: input.hasSkillMd ? 15 : 0,
    hasLicenseFile: input.hasLicenseFile ? 15 : 0,
    signedRelease: input.signedRelease ? 20 : 0
  };

  const raw = Object.values(rules).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, raw));
  const tier = tierFromScore(score);
  const trusted = score >= 50;

  return {
    score,
    tier,
    trusted,
    breakdown: {
      rules,
      total: score,
      tier,
      trusted
    }
  };
}

