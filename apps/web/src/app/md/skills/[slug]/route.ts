import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

export async function GET(req: Request, ctx: any) {
  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = params.slug as string;

  const skill = await prisma.skill.findFirst({
    where: { slug, status: "active" },
    include: {
      publisher: { select: { handle: true, displayName: true } },
      releases: { where: { status: "active" }, orderBy: { createdAt: "desc" } }
    }
  });
  if (!skill) return new NextResponse("Not Found\n", { status: 404, headers: { "content-type": "text/plain" } });

  const origin = new URL(req.url).origin;
  const install = `gitskills install ${skill.slug}`;

  const lines: string[] = [];
  lines.push(`# ${skill.name}`);
  lines.push("");
  lines.push(`- slug: \`${skill.slug}\``);
  lines.push(`- status: ${skill.status}`);
  lines.push(`- summary: ${skill.summary}`);
  lines.push(`- publisher: ${skill.publisher.handle}`);
  lines.push(`- trust: ${skill.trustScore}`);
  lines.push(`- trusted: ${skill.trusted ? `yes (${skill.trustTier ?? "community"})` : "no"}`);
  lines.push(`- downloads: ${skill.downloadTotal}`);
  lines.push(`- tags: ${skill.tags.join(", ") || "(none)"}`);
  lines.push(`- categories: ${skill.categories.join(", ") || "(none)"}`);
  lines.push(`- compatibility: ${skill.compatibility.join(", ") || "(none)"}`);
  lines.push(`- license: ${skill.licenseSpdx ?? "(unknown)"}`);
  if (skill.repoUrl) lines.push(`- repo: ${skill.repoUrl}`);
  if (skill.homepageUrl) lines.push(`- homepage: ${skill.homepageUrl}`);
  lines.push("");
  lines.push(`Install: \`${install}\``);
  lines.push("");
  lines.push(`README: ${origin}/skills/${encodeURIComponent(skill.slug)}/README.md`);
  lines.push("");

  lines.push("## Versions");
  lines.push("");
  for (const r of skill.releases) {
    lines.push(`- ${r.version} status=${r.status} sha256=${r.sha256} size=${r.sizeBytes}B downloads=${r.downloadTotal}`);
    lines.push(`  - download: ${origin}/api/skills/${encodeURIComponent(skill.slug)}/${encodeURIComponent(r.version)}/download`);
  }
  lines.push("");
  lines.push("## Trust Breakdown (JSON)");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(skill.trustBreakdownJson, null, 2));
  lines.push("```");
  lines.push("");

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" }
  });
}
