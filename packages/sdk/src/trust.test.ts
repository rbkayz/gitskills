import assert from "node:assert/strict";
import test from "node:test";

import { computeTrustScore } from "./trust.js";

test("computeTrustScore is deterministic for identical input", () => {
  const input = {
    licenseSpdx: "MIT",
    repoUrl: "https://example.com/repo",
    homepageUrl: "https://example.com",
    publisherVerified: true,
    hasSkillMd: true,
    hasLicenseFile: true,
    signedRelease: false
  };
  const a = computeTrustScore(input);
  const b = computeTrustScore(input);
  assert.deepEqual(a, b);
});

test("computeTrustScore tier mapping and trusted threshold", () => {
  const low = computeTrustScore({
    licenseSpdx: null,
    repoUrl: null,
    homepageUrl: null,
    publisherVerified: false,
    hasSkillMd: true,
    hasLicenseFile: false,
    signedRelease: false
  });
  assert.equal(low.trusted, false);
  assert.equal(low.tier, "community");

  const medium = computeTrustScore({
    licenseSpdx: "MIT",
    repoUrl: "https://example.com/repo",
    homepageUrl: "https://example.com",
    publisherVerified: true,
    hasSkillMd: true,
    hasLicenseFile: false,
    signedRelease: false
  });
  assert.equal(medium.trusted, true);
  assert.ok(["bronze", "silver", "gold"].includes(medium.tier));
});

