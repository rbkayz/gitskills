import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

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

export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = u.origin;
  const q = (u.searchParams.get("q") ?? "").trim();
  const category = u.searchParams.get("category") ?? undefined;
  const tag = u.searchParams.get("tag") ?? undefined;
  const compatibility = u.searchParams.get("compatibility") ?? undefined;
  const publisher = u.searchParams.get("publisher") ?? undefined;
  const minTrust = asInt(u.searchParams.get("minTrust"), 0);
  const trusted = asBool(u.searchParams.get("trusted"));
  const sort = (u.searchParams.get("sort") ?? "downloads") as "downloads" | "trust" | "recent";
  const page = Math.max(1, asInt(u.searchParams.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, asInt(u.searchParams.get("pageSize"), 20)));

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 8);
  const where: any = { trustScore: { gte: minTrust } };
  if (category) where.categories = { has: category };
  if (tag) where.tags = { has: tag };
  if (compatibility) where.compatibility = { has: compatibility };
  if (publisher) where.publisher = { handle: publisher };
  if (trusted != null) where.trusted = trusted;
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

  const lines: string[] = [];
  lines.push(`# Search: ${q || "(all)"}`);
  lines.push("");
  lines.push(`- total: ${total}`);
  lines.push(`- page: ${page}`);
  lines.push(`- pageSize: ${pageSize}`);
  lines.push(`- sort: ${sort}`);
  lines.push(`- trusted: ${trusted == null ? "(any)" : String(trusted)}`);
  lines.push("");

  for (const s of rows) {
    lines.push(`## ${s.slug}`);
    lines.push("");
    lines.push(`- name: ${s.name}`);
    lines.push(`- summary: ${s.summary}`);
    lines.push(`- trust: ${s.trustScore}`);
    lines.push(`- trusted: ${s.trusted ? `yes (${s.trustTier ?? "community"})` : "no"}`);
    lines.push(`- downloads: ${s.downloadTotal}`);
    lines.push(`- publisher: ${s.publisher.handle}`);
    lines.push(`- tags: ${s.tags.join(", ") || "(none)"}`);
    lines.push(`- categories: ${s.categories.join(", ") || "(none)"}`);
    lines.push(`- compatibility: ${s.compatibility.join(", ") || "(none)"}`);
    lines.push(`- markdown: ${origin}/md/skills/${encodeURIComponent(s.slug)}.md`);
    lines.push(`- install: \`gitskills install ${s.slug}\``);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`JSON: ${origin}/api/skills?q=${encodeURIComponent(q)}`);
  lines.push("");

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" }
  });
}
