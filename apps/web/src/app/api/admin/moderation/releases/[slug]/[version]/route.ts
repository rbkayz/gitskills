import type { ModerationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/registry";

const ALLOWED: ModerationStatus[] = ["active", "hidden", "blocked"];

export async function PATCH(req: Request, ctx: any) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const slug = String(params.slug ?? "");
  const version = String(params.version ?? "");

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

  const existing = await prisma.release.findFirst({
    where: { version, skill: { slug } },
    select: { id: true, status: true, skill: { select: { slug: true } } }
  });
  if (!existing) return NextResponse.json({ error: "release not found" }, { status: 404 });

  const updated = await prisma.release.update({
    where: { id: existing.id },
    data: { status: toStatus },
    select: { version: true, status: true, skill: { select: { slug: true } }, createdAt: true }
  });

  await prisma.moderationEvent.create({
    data: {
      actor: auth.actor,
      reason,
      fromStatus: existing.status,
      toStatus,
      releaseId: existing.id
    }
  });

  return NextResponse.json({
    ok: true,
    scope: "release",
    slug: updated.skill.slug,
    version: updated.version,
    status: updated.status
  });
}

