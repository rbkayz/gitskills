import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const rows = await prisma.skill.findMany({
    where: { trusted: true },
    include: { publisher: { select: { handle: true } } },
    orderBy: [{ trustScore: "desc" }, { downloadTotal: "desc" }, { updatedAt: "desc" }],
    take: 100
  });

  const lines: string[] = [];
  lines.push("# Trusted Skills");
  lines.push("");
  lines.push("Curated trusted skills in this registry.");
  lines.push("");
  lines.push(`Total: ${rows.length}`);
  lines.push("");

  for (const s of rows) {
    lines.push(`## ${s.slug}`);
    lines.push("");
    lines.push(`- name: ${s.name}`);
    lines.push(`- trust tier: ${s.trustTier ?? "community"}`);
    lines.push(`- trust score: ${s.trustScore}`);
    lines.push(`- downloads: ${s.downloadTotal}`);
    lines.push(`- publisher: ${s.publisher.handle}`);
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

