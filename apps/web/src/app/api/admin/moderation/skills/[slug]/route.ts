import type { ModerationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/registry";

const ALLOWED: ModerationStatus[] = ["active", "hidden", "blocked"];

export async function PATCH(req: Request, ctx: any) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = String(params.slug ?? "");

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const toStatus = body?.status as ModerationStatus;
  const reason = String(body?.reason ?? "").trim();
  if (!ALLOWED.includes(toStatus)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });

  const existing = await prisma.skill.findUnique({ where: { slug }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ error: "skill not found" }, { status: 404 });

  const updated = await prisma.skill.update({
    where: { id: existing.id },
    data: { status: toStatus },
    select: { slug: true, status: true, updatedAt: true }
  });

  await prisma.moderationEvent.create({
    data: {
      actor: auth.actor,
      reason,
      fromStatus: existing.status,
      toStatus,
      skillId: existing.id
    }
  });

  return NextResponse.json({
    ok: true,
    scope: "skill",
    slug: updated.slug,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString()
  });
}
