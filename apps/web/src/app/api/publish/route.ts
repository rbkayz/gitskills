import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as tar from "tar";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/registry";
import { uploadTarball } from "@/lib/storage";
import { embedText } from "@/lib/embeddings";
import { computeTrustScore } from "@/lib/trust";
import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

type PublishManifest = {
  slug: string;
  name: string;
  summary: string;
  version: string;
  publisherHandle: string;
  categories?: string[];
  tags?: string[];
  compatibility?: string[];
  licenseSpdx?: string | null;
  homepageUrl?: string | null;
  repoUrl?: string | null;
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function normalizePath(p: string): string {
  let n = p.replace(/\\/g, "/");
  if (n.startsWith("./")) n = n.slice(2);
  return n;
}

async function inspectTarball(tarPath: string): Promise<{
  hasSkillMd: boolean;
  hasLicenseFile: boolean;
  readmeMd: string;
}> {
  let hasSkillMd = false;
  let hasLicenseFile = false;
  let readmeMd = "";

  await tar.t({
    file: tarPath,
    onReadEntry: (entry: any) => {
      const p = normalizePath(String(entry.path ?? ""));
      const lower = p.toLowerCase();
      if (lower === "license" || lower.endsWith("/license") || lower === "license.md" || lower.endsWith("/license.md")) {
        hasLicenseFile = true;
      }
      if (lower === "skill.md" || lower.endsWith("/skill.md")) {
        hasSkillMd = true;
        if (!readmeMd) {
          const chunks: Buffer[] = [];
          entry.on("data", (d: Buffer) => chunks.push(Buffer.from(d)));
          entry.on("end", () => {
            readmeMd = Buffer.concat(chunks).toString("utf8");
          });
        }
      }
    }
  });

  return { hasSkillMd, hasLicenseFile, readmeMd };
}

function isValidSlug(v: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(v);
}

function isValidSemver(v: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(v);
}

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 30);
}

async function authorizePublish(req: Request, publisherHandle: string) {
  const user = await getCurrentUser();
  if (user) {
    const existingPublisher = await prisma.publisher.findUnique({
      where: { handle: publisherHandle },
      select: { id: true, handle: true, verified: true }
    });

    if (!existingPublisher) {
      const createdPublisher = await prisma.publisher.create({
        data: {
          handle: publisherHandle,
          displayName: publisherHandle,
          members: {
            create: {
              userId: user.id,
              role: "owner"
            }
          }
        },
        select: { id: true, handle: true, verified: true }
      });
      return { publisher: createdPublisher, actor: user.githubLogin, mode: "session" as const };
    }

    const membership = await prisma.publisherMember.findUnique({
      where: {
        publisherId_userId: {
          publisherId: existingPublisher.id,
          userId: user.id
        }
      },
      select: { role: true }
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "maintainer")) {
      throw new Error("forbidden_publisher_membership");
    }

    return { publisher: existingPublisher, actor: user.githubLogin, mode: "session" as const };
  }

  const expected = process.env.PUBLISH_TOKEN;
  const token = req.headers.get("x-publish-token");
  if (!expected) throw new Error("publish_token_not_configured");
  if (!token || token !== expected) throw new Error("unauthorized");

  const publisher = await prisma.publisher.upsert({
    where: { handle: publisherHandle },
    update: {},
    create: { handle: publisherHandle, displayName: publisherHandle }
  });

  return { publisher, actor: "token", mode: "token" as const };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const manifestText = form.get("manifest");
  const tarball = form.get("tarball");

  if (typeof manifestText !== "string") return bad("manifest form field is required");
  if (!(tarball instanceof File)) return bad("tarball file is required");
  if (tarball.size <= 0) return bad("tarball is empty");
  if (tarball.size > 20 * 1024 * 1024) return bad("tarball is too large (max 20MB)");

  let manifest: PublishManifest;
  try {
    manifest = JSON.parse(manifestText) as PublishManifest;
  } catch {
    return bad("manifest is invalid json");
  }

  const slug = String(manifest.slug ?? "").trim().toLowerCase();
  const name = String(manifest.name ?? "").trim();
  const summary = String(manifest.summary ?? "").trim();
  const version = String(manifest.version ?? "").trim();
  const publisherHandle = String(manifest.publisherHandle ?? "").trim().toLowerCase();

  if (!isValidSlug(slug)) return bad("invalid slug");
  if (!name) return bad("name is required");
  if (!summary) return bad("summary is required");
  if (!publisherHandle || !/^[a-z0-9-]{2,40}$/.test(publisherHandle)) return bad("invalid publisherHandle");
  if (!isValidSemver(version)) return bad("invalid semver version");

  const categories = asArray(manifest.categories);
  const tags = asArray(manifest.tags);
  const compatibility = asArray(manifest.compatibility);

  let publisher: { id: string; handle: string; verified: boolean };
  try {
    const authz = await authorizePublish(req, publisherHandle);
    publisher = authz.publisher;
  } catch (err: any) {
    const code = String(err?.message ?? "");
    if (code === "publish_token_not_configured") return bad("publish token is not configured", 501);
    if (code === "forbidden_publisher_membership") return bad("you do not have publisher access for this handle", 403);
    return bad("unauthorized", 401);
  }

  const tarBuf = Buffer.from(await tarball.arrayBuffer());
  const hash = sha256(tarBuf);
  const tmpFile = path.join(os.tmpdir(), `gitskills-publish-${Date.now()}-${Math.random().toString(16).slice(2)}.tgz`);
  fs.writeFileSync(tmpFile, tarBuf);

  const evidence = await inspectTarball(tmpFile);
  fs.unlinkSync(tmpFile);

  if (!evidence.hasSkillMd || !evidence.readmeMd.trim()) {
    return bad("tarball must include a non-empty SKILL.md");
  }

  const existing = await prisma.skill.findUnique({
    where: { slug },
    include: {
      publisher: { select: { handle: true } },
      releases: { where: { version }, select: { id: true } }
    }
  });

  if (existing && existing.publisher.handle !== publisherHandle) {
    return bad("slug already exists under another publisher", 403);
  }
  if (existing?.status === "blocked") return bad("skill is blocked from publishing", 403);
  if (existing?.releases.length) return bad("version already exists for this skill", 409);

  const trust = computeTrustScore({
    licenseSpdx: manifest.licenseSpdx,
    repoUrl: manifest.repoUrl,
    homepageUrl: manifest.homepageUrl,
    publisherVerified: publisher.verified,
    hasSkillMd: evidence.hasSkillMd,
    hasLicenseFile: evidence.hasLicenseFile,
    signedRelease: false
  });
  const embedding = await embedText(`${name}\n${summary}\n${tags.join(" ")}\n${evidence.readmeMd.slice(0, 3000)}`);

  const uploaded = await uploadTarball({ slug, version, bytes: tarBuf });
  const tarballUrl = uploaded.tarballUrl;

  let skillId = existing?.id;
  if (!skillId) {
    const created = await prisma.skill.create({
      data: {
        slug,
        name,
        summary,
        readmeMd: evidence.readmeMd,
        categories,
        tags,
        compatibility,
        licenseSpdx: manifest.licenseSpdx ?? null,
        homepageUrl: manifest.homepageUrl ?? null,
        repoUrl: manifest.repoUrl ?? null,
        publisherId: publisher.id,
        trustScore: trust.score,
        trustBreakdownJson: trust.breakdown,
        embedding: embedding ?? []
      },
      select: { id: true }
    });
    skillId = created.id;
  } else {
    await prisma.skill.update({
      where: { id: skillId },
      data: {
        name,
        summary,
        readmeMd: evidence.readmeMd,
        categories,
        tags,
        compatibility,
        licenseSpdx: manifest.licenseSpdx ?? null,
        homepageUrl: manifest.homepageUrl ?? null,
        repoUrl: manifest.repoUrl ?? null,
        trustScore: trust.score,
        trustBreakdownJson: trust.breakdown,
        ...(embedding ? { embedding } : {})
      }
    });
  }

  await prisma.release.create({
    data: {
      skillId,
      version,
      tarballUrl,
      sha256: hash,
      sizeBytes: tarBuf.length
    }
  });

  return NextResponse.json({
    ok: true,
    slug,
    version,
    trustScore: trust.score,
    trustTier: trust.tier,
    storageBackend: uploaded.backend,
    downloadUrl: `/api/skills/${encodeURIComponent(slug)}/${encodeURIComponent(version)}/download`
  });
}
