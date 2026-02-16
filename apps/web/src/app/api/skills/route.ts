import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";
import { cosineSimilarity, embedText } from "@/lib/embeddings";

function asInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  const n = v.trim().toLowerCase();
  if (n === "1" || n === "true" || n === "yes") return true;
  if (n === "0" || n === "false" || n === "no") return false;
  return undefined;
}

function tokenSet(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((x) => x.length > 1)
  );
}

function hybridScore(s: any, q: string, queryEmbedding: number[] | null): number {
  const qLower = q.toLowerCase();
  const name = String(s.name ?? "").toLowerCase();
  const summary = String(s.summary ?? "").toLowerCase();
  const tags = Array.isArray(s.tags) ? s.tags.map((t: string) => t.toLowerCase()) : [];
  const categories = Array.isArray(s.categories) ? s.categories.map((t: string) => t.toLowerCase()) : [];
  const readme = String(s.readmeMd ?? "").toLowerCase();

  let score = 0;
  if (name === qLower) score += 50;
  if (name.includes(qLower)) score += 25;
  if (summary.includes(qLower)) score += 18;
  if (readme.includes(qLower)) score += 8;
  if (tags.some((t: string) => t.includes(qLower))) score += 15;
  if (categories.some((t: string) => t.includes(qLower))) score += 6;

  const qTokens = tokenSet(qLower);
  const blobTokens = tokenSet(`${name} ${summary} ${tags.join(" ")} ${categories.join(" ")}`);
  let overlap = 0;
  for (const t of qTokens) if (blobTokens.has(t)) overlap += 1;
  score += overlap * 6;

  // Mild prior to prefer established, trustworthy skills.
  score += Math.min(20, Math.floor((s.trustScore ?? 0) / 8));
  score += Math.min(20, Math.floor(Math.log2((s.downloadTotal ?? 0) + 1)));
  if (queryEmbedding && Array.isArray(s.embedding) && s.embedding.length === queryEmbedding.length) {
    const vec = cosineSimilarity(
      queryEmbedding,
      s.embedding.map((x: any) => Number(x))
    );
    score += Math.max(0, vec) * 40;
  }

  return score;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim();
  const category = u.searchParams.get("category") ?? undefined;
  const tag = u.searchParams.get("tag") ?? undefined;
  const compatibility = u.searchParams.get("compatibility") ?? undefined;
  const publisher = u.searchParams.get("publisher") ?? undefined;
  const minTrust = asInt(u.searchParams.get("minTrust"), 0);
  const trusted = asBool(u.searchParams.get("trusted"));
  const mode = (u.searchParams.get("mode") ?? "keyword").trim().toLowerCase();
  const sort = (u.searchParams.get("sort") ?? "downloads") as "downloads" | "trust" | "recent";
  const page = Math.max(1, asInt(u.searchParams.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, asInt(u.searchParams.get("pageSize"), 20)));

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 8);

  const where: any = {
    status: "active",
    trustScore: { gte: minTrust }
  };
  if (category) where.categories = { has: category };
  if (tag) where.tags = { has: tag };
  if (compatibility) where.compatibility = { has: compatibility };
  if (publisher) where.publisher = { handle: publisher };
  if (trusted != null) where.trusted = trusted;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      ...(mode === "hybrid" ? [{ readmeMd: { contains: q, mode: "insensitive" } }] : []),
      ...(tokens.length ? [{ tags: { hasSome: tokens } }] : [])
    ];
  }

  const orderBy =
    sort === "trust"
      ? [{ trustScore: "desc" as const }, { downloadTotal: "desc" as const }]
      : sort === "recent"
        ? [{ updatedAt: "desc" as const }]
        : [{ downloadTotal: "desc" as const }, { trustScore: "desc" as const }];

  let total = 0;
  let rows: any[] = [];

  if (mode === "hybrid" && q) {
    const queryEmbedding = await embedText(q);
    const candidates = await prisma.skill.findMany({
      where,
      include: { publisher: { select: { handle: true, displayName: true } } },
      take: 200
    });
    const ranked = candidates
      .map((s) => ({ s, _score: hybridScore(s, q, queryEmbedding) }))
      .sort((a, b) => b._score - a._score)
      .map((x) => x.s);
    total = ranked.length;
    rows = ranked.slice((page - 1) * pageSize, page * pageSize);
  } else {
    const out = await Promise.all([
      prisma.skill.count({ where }),
      prisma.skill.findMany({
        where,
        include: { publisher: { select: { handle: true, displayName: true } } },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    total = out[0];
    rows = out[1] as any[];
  }

  return NextResponse.json({
    query: q,
    mode,
    page,
    pageSize,
    total,
    skills: rows.map((s: any) => ({
      slug: s.slug,
      name: s.name,
      summary: s.summary,
      status: s.status,
      tags: s.tags,
      categories: s.categories,
      compatibility: s.compatibility,
      licenseSpdx: s.licenseSpdx,
      publisher: s.publisher,
      downloadTotal: s.downloadTotal,
      trustScore: s.trustScore,
      trusted: s.trusted,
      trustTier: s.trustTier,
      updatedAt: s.updatedAt.toISOString()
    }))
  });
}
