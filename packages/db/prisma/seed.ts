import { PrismaClient } from "@prisma/client";
import { computeTrustScore } from "@gitskills/sdk";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.publisher.upsert({
    where: { handle: "demo" },
    update: { displayName: "Demo Publisher", verified: true },
    create: { handle: "demo", displayName: "Demo Publisher", verified: true }
  });

  await prisma.skill.upsert({
    where: { slug: "hello-world" },
    update: {
      trusted: true,
      trustTier: "silver"
    },
    create: {
      slug: "hello-world",
      name: "Hello World",
      summary: "A tiny starter skill that greets and echoes input.",
      readmeMd: (await import("node:fs")).readFileSync(
        new URL("../../../samples/hello-world/SKILL.md", import.meta.url),
        "utf8"
      ),
      categories: ["starter"],
      tags: ["hello", "example"],
      compatibility: ["codex"],
      licenseSpdx: "MIT",
      homepageUrl: "https://example.com/hello-world",
      repoUrl: "https://example.com/hello-world-repo",
      publisherId: demo.id,
      trustScore: computeTrustScore({
        licenseSpdx: "MIT",
        repoUrl: "https://example.com/hello-world-repo",
        homepageUrl: "https://example.com/hello-world",
        publisherVerified: demo.verified,
        hasSkillMd: true,
        hasLicenseFile: false,
        signedRelease: false
      }).score,
      trusted: true,
      trustTier: "silver",
      trustBreakdownJson: computeTrustScore({
        licenseSpdx: "MIT",
        repoUrl: "https://example.com/hello-world-repo",
        homepageUrl: "https://example.com/hello-world",
        publisherVerified: demo.verified,
        hasSkillMd: true,
        hasLicenseFile: false,
        signedRelease: false
      }).breakdown,
      releases: {
        create: {
          version: "0.1.0",
          tarballUrl: "/tarballs/hello-world/0.1.0.tgz",
          sha256: "15BFAA07F11DBCE5C4F496F22F9EA3BED8A9CC6FA1749F0796837384598EC18C".toLowerCase(),
          sizeBytes: 256
        }
      }
    }
  });

  await prisma.skill.upsert({
    where: { slug: "git-commit-helper" },
    update: {
      trusted: false,
      trustTier: null
    },
    create: {
      slug: "git-commit-helper",
      name: "Git Commit Helper",
      summary: "Suggests conventional-commit messages from intent + diff summary.",
      readmeMd: (await import("node:fs")).readFileSync(
        new URL("../../../samples/git-commit-helper/SKILL.md", import.meta.url),
        "utf8"
      ),
      categories: ["developer-tools"],
      tags: ["git", "commit", "conventional-commits"],
      compatibility: ["codex"],
      licenseSpdx: "Apache-2.0",
      homepageUrl: "https://example.com/git-commit-helper",
      repoUrl: "https://example.com/git-commit-helper-repo",
      publisherId: demo.id,
      trustScore: computeTrustScore({
        licenseSpdx: "Apache-2.0",
        repoUrl: "https://example.com/git-commit-helper-repo",
        homepageUrl: "https://example.com/git-commit-helper",
        publisherVerified: demo.verified,
        hasSkillMd: true,
        hasLicenseFile: false,
        signedRelease: false
      }).score,
      trusted: false,
      trustTier: null,
      trustBreakdownJson: computeTrustScore({
        licenseSpdx: "Apache-2.0",
        repoUrl: "https://example.com/git-commit-helper-repo",
        homepageUrl: "https://example.com/git-commit-helper",
        publisherVerified: demo.verified,
        hasSkillMd: true,
        hasLicenseFile: false,
        signedRelease: false
      }).breakdown,
      releases: {
        create: {
          version: "0.1.0",
          tarballUrl: "/tarballs/git-commit-helper/0.1.0.tgz",
          sha256: "60ad36b9ce206dcb8fcb398aa902fc16d3318f387a914c675969aa0e5264f492",
          sizeBytes: 282
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
