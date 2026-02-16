import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as tar from "tar";

export type PublishArgs = {
  registryUrl: string;
  publishToken: string;
  dir: string;
  slug: string;
  name: string;
  summary: string;
  version: string;
  publisherHandle: string;
  categories: string[];
  tags: string[];
  compatibility: string[];
  licenseSpdx?: string;
  homepageUrl?: string;
  repoUrl?: string;
};

export type PublishResult = {
  ok: boolean;
  slug: string;
  version: string;
  trustScore: number;
  trustTier: string;
  downloadUrl: string;
};

function ensureSkillMd(dir: string): void {
  const p = path.join(dir, "SKILL.md");
  if (!fs.existsSync(p)) {
    throw new Error(`SKILL.md not found in ${dir}`);
  }
}

export async function publishSkill(args: PublishArgs): Promise<PublishResult> {
  if (!args.publishToken) throw new Error("publish token is required (set with: gitskills auth token set <token>)");
  const dir = path.resolve(args.dir);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`publish dir does not exist: ${dir}`);
  }
  ensureSkillMd(dir);

  const tmpTar = path.join(os.tmpdir(), `gitskills-publish-${Date.now()}-${Math.random().toString(16).slice(2)}.tgz`);
  await tar.c({ gzip: true, file: tmpTar, cwd: dir }, ["."]);

  const buf = fs.readFileSync(tmpTar);
  fs.rmSync(tmpTar, { force: true });

  const manifest = {
    slug: args.slug,
    name: args.name,
    summary: args.summary,
    version: args.version,
    publisherHandle: args.publisherHandle,
    categories: args.categories,
    tags: args.tags,
    compatibility: args.compatibility,
    licenseSpdx: args.licenseSpdx ?? null,
    homepageUrl: args.homepageUrl ?? null,
    repoUrl: args.repoUrl ?? null
  };

  const form = new FormData();
  form.set("manifest", JSON.stringify(manifest));
  form.set("tarball", new Blob([buf], { type: "application/gzip" }), `${args.slug}-${args.version}.tgz`);

  const res = await fetch(args.registryUrl.replace(/\/+$/, "") + "/api/publish", {
    method: "POST",
    headers: { "x-publish-token": args.publishToken },
    body: form
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = (await res.json()) as any;
      if (j?.error) detail = `${detail}: ${j.error}`;
    } catch {
      // ignore parse failures
    }
    throw new Error(`publish failed: ${detail}`);
  }

  return (await res.json()) as PublishResult;
}
