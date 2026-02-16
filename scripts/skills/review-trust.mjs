#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const ROOT = process.cwd();
const REGISTRY_DIR = path.join(ROOT, "skills", "registry");

function tierFromScore(score) {
  if (score >= 80) return "gold";
  if (score >= 65) return "silver";
  if (score >= 50) return "bronze";
  return "community";
}

function computeTrustScore(input) {
  const rules = {
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

function parseArgs(argv) {
  const args = { write: false, check: false, reportFile: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write") args.write = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--report-file") {
      args.reportFile = argv[i + 1] ?? "";
      i += 1;
    }
  }
  if (!args.write && !args.check) args.check = true;
  return args;
}

async function findManifestFiles(dir) {
  const out = [];
  async function walk(cur) {
    const entries = await fs.readdir(cur, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name === "skill.yaml") {
        out.push(full);
      }
    }
  }
  try {
    await walk(dir);
  } catch {
    return [];
  }
  return out.sort();
}

function asNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mkReport(rows, failures, mode) {
  const lines = [];
  lines.push(`# Skill Trust Review (${mode})`);
  lines.push("");
  lines.push("| slug | score | threshold | trusted | status |");
  lines.push("|---|---:|---:|---|---|");
  for (const r of rows) {
    lines.push(`| ${r.slug} | ${r.score} | ${r.threshold} | ${r.trusted ? "yes" : "no"} | ${r.status} |`);
  }
  lines.push("");
  if (failures.length) {
    lines.push("## Failures");
    for (const failure of failures) lines.push(`- ${failure}`);
  } else {
    lines.push("All skill manifests passed trust validation.");
  }
  lines.push("");
  lines.push("To refresh computed trust fields locally:");
  lines.push("`npm run skills:trust`");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const manifestFiles = await findManifestFiles(REGISTRY_DIR);
  if (manifestFiles.length === 0) {
    console.error("No skill manifests found under skills/registry.");
    process.exit(1);
  }

  const failures = [];
  const rows = [];
  const nowIso = new Date().toISOString();

  for (const file of manifestFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const folderSlug = path.basename(path.dirname(file));
    let manifest;

    try {
      const raw = await fs.readFile(file, "utf8");
      manifest = YAML.parse(raw) ?? {};
    } catch (err) {
      failures.push(`${rel}: invalid YAML (${err instanceof Error ? err.message : String(err)})`);
      continue;
    }

    const slug = manifest.slug;
    const threshold = Number(manifest.review?.min_trust_required ?? 50);
    const statusPrefix = `${rel} (${slug ?? "unknown"})`;

    if (manifest.schema_version !== 1) failures.push(`${statusPrefix}: schema_version must be 1`);
    if (!asNonEmptyString(slug)) failures.push(`${statusPrefix}: slug is required`);
    if (slug !== folderSlug) failures.push(`${statusPrefix}: slug must match folder name (${folderSlug})`);
    if (!asNonEmptyString(manifest.name)) failures.push(`${statusPrefix}: name is required`);
    if (!asNonEmptyString(manifest.summary)) failures.push(`${statusPrefix}: summary is required`);
    if (!asNonEmptyString(manifest.repo_url)) failures.push(`${statusPrefix}: repo_url is required`);
    if (!asNonEmptyString(manifest.publisher?.handle)) failures.push(`${statusPrefix}: publisher.handle is required`);
    if (typeof manifest.publisher?.verified !== "boolean") {
      failures.push(`${statusPrefix}: publisher.verified must be boolean`);
    }

    const skillMdRel = manifest.artifacts?.skill_md ?? "SKILL.md";
    const skillMdPath = path.resolve(path.dirname(file), skillMdRel);
    let skillMdExists = false;
    try {
      await fs.access(skillMdPath);
      skillMdExists = true;
    } catch {
      skillMdExists = false;
    }
    if (!skillMdExists) failures.push(`${statusPrefix}: missing artifacts.skill_md file (${skillMdRel})`);

    const trustInputs = manifest.trust_inputs ?? {};
    const computed = computeTrustScore({
      licenseSpdx: manifest.license_spdx ?? null,
      repoUrl: manifest.repo_url ?? null,
      homepageUrl: manifest.homepage_url ?? null,
      publisherVerified: Boolean(manifest.publisher?.verified),
      hasSkillMd: typeof trustInputs.has_skill_md === "boolean" ? trustInputs.has_skill_md : skillMdExists,
      hasLicenseFile: Boolean(trustInputs.has_license_file),
      signedRelease: Boolean(trustInputs.signed_release)
    });

    const expectedComputed = {
      trust_score: computed.score,
      trust_tier: computed.tier,
      trusted: computed.trusted,
      breakdown: computed.breakdown
    };

    const existingComputed = manifest.computed ?? {};
    const existingComparable = {
      trust_score: existingComputed.trust_score,
      trust_tier: existingComputed.trust_tier,
      trusted: existingComputed.trusted,
      breakdown: existingComputed.breakdown
    };

    if (args.check && !deepEqual(existingComparable, expectedComputed)) {
      failures.push(`${statusPrefix}: computed trust fields are outdated. Run npm run skills:trust`);
    }
    if (computed.score < threshold) {
      failures.push(`${statusPrefix}: trust_score ${computed.score} below min_trust_required ${threshold}`);
    }

    if (args.write) {
      manifest.computed = {
        ...expectedComputed,
        reviewed_at: nowIso
      };
      manifest.review = {
        min_trust_required: threshold
      };
      manifest.trust_inputs = {
        ...trustInputs,
        has_skill_md: skillMdExists
      };
      const next = YAML.stringify(manifest, {
        lineWidth: 120
      });
      await fs.writeFile(file, next, "utf8");
    }

    rows.push({
      slug: asNonEmptyString(slug) ? slug : folderSlug,
      score: computed.score,
      threshold,
      trusted: computed.trusted,
      status: computed.score >= threshold ? "pass" : "fail"
    });
  }

  const mode = args.write ? "write" : "check";
  const report = mkReport(rows, failures, mode);
  if (args.reportFile) {
    const reportPath = path.resolve(ROOT, args.reportFile);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report, "utf8");
  }
  process.stdout.write(report + "\n");

  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
