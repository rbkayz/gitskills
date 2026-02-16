import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const top = await prisma.skill.findMany({
    orderBy: [{ downloadTotal: "desc" }, { trustScore: "desc" }],
    take: 20,
    include: { publisher: { select: { handle: true, displayName: true } } }
  });

  const lines: string[] = [];
  lines.push("# gitskills index");
  lines.push("");
  lines.push("This is the agent-readable index for the gitskills registry.");
  lines.push("");
  lines.push("## Top Skills");
  lines.push("");
  for (const s of top) {
    const mdUrl = `${origin}/md/skills/${encodeURIComponent(s.slug)}.md`;
    const install = `gitskills install ${s.slug}`;
    const trustMark = s.trusted ? ` trusted=${s.trustTier ?? "community"}` : "";
    lines.push(
      `- \`${s.slug}\` (${s.name}) trust=${s.trustScore}${trustMark} downloads=${s.downloadTotal} publisher=${s.publisher.handle}`
    );
    lines.push(`  - ${s.summary}`);
    lines.push(`  - Markdown: ${mdUrl}`);
    lines.push(`  - Install: \`${install}\``);
  }
  lines.push("");
  lines.push("## Search");
  lines.push("");
  lines.push(`- Markdown search: \`${origin}/md/search.md?q=<query>\``);
  lines.push(`- JSON search: \`${origin}/api/skills?q=<query>\``);
  lines.push(`- Trusted skills (MD): \`${origin}/md/trusted.md\``);
  lines.push("");

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" }
  });
}
