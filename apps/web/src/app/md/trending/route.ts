import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

function asInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = u.origin;
  const days = Math.min(90, Math.max(1, asInt(u.searchParams.get("days"), 7)));
  const limit = Math.min(100, Math.max(1, asInt(u.searchParams.get("limit"), 20)));

  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));

  const rows = await prisma.dailySkillDownload.findMany({
    where: {
      day: { gte: cutoff },
      skill: { status: "active" }
    },
    include: {
      skill: {
        select: {
          slug: true,
          name: true,
          trustScore: true,
          trusted: true,
          trustTier: true,
          downloadTotal: true,
          summary: true
        }
      }
    }
  });

  const bySkill = new Map<
    string,
    {
      slug: string;
      name: string;
      summary: string;
      trustScore: number;
      trusted: boolean;
      trustTier: string | null;
      downloadTotal: number;
      windowDownloads: number;
    }
  >();
  for (const r of rows) {
    const cur = bySkill.get(r.skillId);
    if (cur) {
      cur.windowDownloads += r.count;
      continue;
    }
    bySkill.set(r.skillId, {
      slug: r.skill.slug,
      name: r.skill.name,
      summary: r.skill.summary,
      trustScore: r.skill.trustScore,
      trusted: r.skill.trusted,
      trustTier: r.skill.trustTier,
      downloadTotal: r.skill.downloadTotal,
      windowDownloads: r.count
    });
  }

  const top = [...bySkill.values()]
    .sort((a, b) => b.windowDownloads - a.windowDownloads || b.trustScore - a.trustScore)
    .slice(0, limit);

  const lines: string[] = [];
  lines.push(`# Trending Skills (${days}d)`);
  lines.push("");
  lines.push(`Total: ${top.length}`);
  lines.push("");
  for (const s of top) {
    lines.push(`## ${s.slug}`);
    lines.push("");
    lines.push(`- name: ${s.name}`);
    lines.push(`- downloads_${days}d: ${s.windowDownloads}`);
    lines.push(`- downloads_total: ${s.downloadTotal}`);
    lines.push(`- trust: ${s.trustScore}`);
    lines.push(`- trusted: ${s.trusted ? `yes (${s.trustTier ?? "community"})` : "no"}`);
    lines.push(`- summary: ${s.summary}`);
    lines.push(`- markdown: ${origin}/md/skills/${encodeURIComponent(s.slug)}.md`);
    lines.push(`- install: \`gitskills install ${s.slug}\``);
    lines.push("");
  }

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" }
  });
}

