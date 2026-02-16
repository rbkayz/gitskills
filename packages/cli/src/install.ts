import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import * as tar from "tar";

import type { SkillDetail } from "@gitskills/sdk";
import { RegistryClient } from "@gitskills/sdk";

function defaultInstallDir(): string {
  const codexHome = process.env.CODEX_HOME;
  if (codexHome) return path.join(codexHome, "skills");
  return path.join(process.cwd(), "skills");
}

function sha256File(p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const s = fs.createReadStream(p);
    s.on("error", reject);
    s.on("data", (d) => h.update(d));
    s.on("end", () => resolve(h.digest("hex")));
  });
}

function pickVersion(skill: SkillDetail, version?: string): { version: string; downloadUrl: string; sha256: string } {
  if (skill.releases.length === 0) throw new Error("no releases available");
  if (!version) {
    // MVP: assume releases are returned sorted newest-first.
    const r = skill.releases[0];
    return { version: r.version, downloadUrl: r.downloadUrl, sha256: r.sha256 };
  }
  const r = skill.releases.find((x) => x.version === version);
  if (!r) throw new Error(`version not found: ${version}`);
  return { version: r.version, downloadUrl: r.downloadUrl, sha256: r.sha256 };
}

export async function installSkill(opts: {
  registryUrl: string;
  slug: string;
  version?: string;
  dir?: string;
  force?: boolean;
}): Promise<{ installedTo: string; version: string }> {
  const client = new RegistryClient(opts.registryUrl);
  const skill = await client.getSkill(opts.slug);
  const v = pickVersion(skill, opts.version);
  if (!v.downloadUrl) throw new Error("registry did not provide download url (API not implemented yet)");

  const installRoot = opts.dir ? path.resolve(opts.dir) : defaultInstallDir();
  const dest = path.join(installRoot, skill.slug);
  if (fs.existsSync(dest)) {
    if (!opts.force) throw new Error(`destination exists: ${dest} (pass --force to overwrite)`);
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitskills-"));
  const tarPath = path.join(tmpDir, `${skill.slug}-${v.version}.tgz`);

  const res = await fetch(v.downloadUrl, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download failed: ${res.status} ${res.statusText}`);

  await pipeline(res.body as any, fs.createWriteStream(tarPath));

  const got = await sha256File(tarPath);
  if (got.toLowerCase() !== v.sha256.toLowerCase()) {
    throw new Error(`sha256 mismatch: expected ${v.sha256} got ${got}`);
  }

  // Defensive extraction: refuse absolute paths and ".." traversal.
  await tar.x({
    file: tarPath,
    cwd: dest,
    filter: (p: string) => {
      const normalized = p.replace(/\\/g, "/");
      if (normalized.startsWith("/") || normalized.includes("..")) return false;
      return true;
    }
  });

  return { installedTo: dest, version: v.version };
}
