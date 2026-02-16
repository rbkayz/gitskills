import { NextResponse } from "next/server";
import type { TrustTier } from "@prisma/client";
import { prisma } from "@/lib/registry";

type Body = { trusted?: boolean; trustTier?: TrustTier | null };

const ALLOWED_TIERS: TrustTier[] = ["community", "bronze", "silver", "gold"];

export async function PATCH(req: Request, ctx: any) {
  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "admin token is not configured" }, { status: 501 });
  }
  const token = req.headers.get("x-admin-token");
  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = String(params.slug ?? "");

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  if (typeof body.trusted !== "boolean") {
    return NextResponse.json({ error: "trusted (boolean) is required" }, { status: 400 });
  }

  const trustTier =
    body.trusted === false ? null : body.trustTier ?? null;

  if (trustTier != null && !ALLOWED_TIERS.includes(trustTier)) {
    return NextResponse.json({ error: "invalid trustTier" }, { status: 400 });
  }

  let updated: { slug: string; trusted: boolean; trustTier: TrustTier | null; updatedAt: Date };
  try {
    updated = await prisma.skill.update({
      where: { slug },
      data: {
        trusted: body.trusted,
        trustTier
      },
      select: { slug: true, trusted: true, trustTier: true, updatedAt: true }
    });
  } catch {
    return NextResponse.json({ error: "skill not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    skill: {
      slug: updated.slug,
      trusted: updated.trusted,
      trustTier: updated.trustTier,
      updatedAt: updated.updatedAt.toISOString()
    }
  });
}
