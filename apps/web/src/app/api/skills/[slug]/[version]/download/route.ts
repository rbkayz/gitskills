import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

export async function GET(req: Request, ctx: any) {
  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = params.slug as string;
  const version = params.version as string;

  const release = await prisma.release.findFirst({
    where: { version, status: "active", skill: { slug, status: "active" } },
    include: { skill: true }
  });
  if (!release) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  await prisma.$transaction([
    prisma.release.update({ where: { id: release.id }, data: { downloadTotal: { increment: 1 } } }),
    prisma.skill.update({ where: { id: release.skillId }, data: { downloadTotal: { increment: 1 } } }),
    prisma.dailySkillDownload.upsert({
      where: { skillId_day: { skillId: release.skillId, day } },
      update: { count: { increment: 1 } },
      create: { skillId: release.skillId, day, count: 1 }
    })
  ]);

  const target = release.tarballUrl.startsWith("/")
    ? new URL(release.tarballUrl, new URL(req.url).origin).toString()
    : release.tarballUrl;
  return NextResponse.redirect(target, { status: 302 });
}
