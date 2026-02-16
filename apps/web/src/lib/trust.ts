export type TrustComputationInput = {
  licenseSpdx?: string | null;
  repoUrl?: string | null;
  homepageUrl?: string | null;
  publisherVerified?: boolean;
  hasSkillMd?: boolean;
  hasLicenseFile?: boolean;
  signedRelease?: boolean;
};

export function computeTrustScore(input: TrustComputationInput): {
  score: number;
  tier: "community" | "bronze" | "silver" | "gold";
  trusted: boolean;
  breakdown: {
    rules: Record<string, number>;
    total: number;
    tier: "community" | "bronze" | "silver" | "gold";
    trusted: boolean;
  };
} {
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
  const tier = score >= 80 ? "gold" : score >= 65 ? "silver" : score >= 50 ? "bronze" : "community";
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

