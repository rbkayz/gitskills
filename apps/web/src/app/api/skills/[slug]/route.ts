import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

export async function GET(req: Request, ctx: { params: { slug: string } } | { params: Promise<{ slug: string }> }) {
  const paramsAny = (ctx as any).params as any;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = params.slug as string;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      publisher: { select: { handle: true, displayName: true } },
      releases: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!skill) return NextResponse.json({ error: "not found" }, { status: 404 });

  const origin = new URL(req.url).origin;

  return NextResponse.json({
    slug: skill.slug,
    name: skill.name,
    summary: skill.summary,
    readmeMd: skill.readmeMd,
    tags: skill.tags,
    categories: skill.categories,
    compatibility: skill.compatibility,
    licenseSpdx: skill.licenseSpdx,
    homepageUrl: skill.homepageUrl,
    repoUrl: skill.repoUrl,
    publisher: skill.publisher,
    downloadTotal: skill.downloadTotal,
    trustScore: skill.trustScore,
    trusted: skill.trusted,
    trustTier: skill.trustTier,
    trustBreakdown: skill.trustBreakdownJson,
    updatedAt: skill.updatedAt.toISOString(),
    releases: skill.releases.map((r: any) => ({
      version: r.version,
      downloadUrl: `${origin}/api/skills/${encodeURIComponent(skill.slug)}/${encodeURIComponent(r.version)}/download`,
      sha256: r.sha256,
      sizeBytes: r.sizeBytes,
      downloadTotal: r.downloadTotal,
      createdAt: r.createdAt.toISOString()
    }))
  });
}
