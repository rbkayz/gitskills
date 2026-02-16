import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

function asInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
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
          summary: true,
          trustScore: true,
          trusted: true,
          trustTier: true,
          downloadTotal: true
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
    const key = r.skillId;
    const cur = bySkill.get(key);
    if (cur) {
      cur.windowDownloads += r.count;
      continue;
    }
    bySkill.set(key, {
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

  const trending = [...bySkill.values()]
    .sort((a, b) => b.windowDownloads - a.windowDownloads || b.trustScore - a.trustScore)
    .slice(0, limit);

  return NextResponse.json({
    days,
    limit,
    total: trending.length,
    skills: trending
  });
}

