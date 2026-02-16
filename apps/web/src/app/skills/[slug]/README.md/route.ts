import { NextResponse } from "next/server";
import { prisma } from "@/lib/registry";

export async function GET(_req: Request, ctx: any) {
  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = params.slug as string;

  const skill = await prisma.skill.findUnique({ where: { slug }, select: { readmeMd: true } });
  if (!skill) return new NextResponse("Not Found\n", { status: 404, headers: { "content-type": "text/plain" } });

  return new NextResponse(skill.readmeMd, {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" }
  });
}

