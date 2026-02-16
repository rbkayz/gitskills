import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

function asInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim();
  const category = u.searchParams.get("category") ?? undefined;
  const tag = u.searchParams.get("tag") ?? undefined;
  const compatibility = u.searchParams.get("compatibility") ?? undefined;
  const publisher = u.searchParams.get("publisher") ?? undefined;
  const minTrust = asInt(u.searchParams.get("minTrust"), 0);
  const sort = (u.searchParams.get("sort") ?? "downloads") as "downloads" | "trust" | "recent";
  const page = Math.max(1, asInt(u.searchParams.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, asInt(u.searchParams.get("pageSize"), 20)));

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 8);

  const where: any = {
    trustScore: { gte: minTrust }
  };
  if (category) where.categories = { has: category };
  if (tag) where.tags = { has: tag };
  if (compatibility) where.compatibility = { has: compatibility };
  if (publisher) where.publisher = { handle: publisher };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      ...(tokens.length ? [{ tags: { hasSome: tokens } }] : [])
    ];
  }

  const orderBy =
    sort === "trust"
      ? [{ trustScore: "desc" as const }, { downloadTotal: "desc" as const }]
      : sort === "recent"
        ? [{ updatedAt: "desc" as const }]
        : [{ downloadTotal: "desc" as const }, { trustScore: "desc" as const }];

  const [total, rows] = await Promise.all([
    prisma.skill.count({ where }),
    prisma.skill.findMany({
      where,
      include: { publisher: { select: { handle: true, displayName: true } } },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  return NextResponse.json({
    query: q,
    page,
    pageSize,
    total,
    skills: rows.map((s: any) => ({
      slug: s.slug,
      name: s.name,
      summary: s.summary,
      tags: s.tags,
      categories: s.categories,
      compatibility: s.compatibility,
      licenseSpdx: s.licenseSpdx,
      publisher: s.publisher,
      downloadTotal: s.downloadTotal,
      trustScore: s.trustScore,
      updatedAt: s.updatedAt.toISOString()
    }))
  });
}
