import { NextResponse } from "next/server";
import type { PublisherMemberRole } from "@prisma/client";

import { prisma } from "@/lib/registry";
import { requireAdmin } from "@/lib/admin";

const ALLOWED_ROLES: PublisherMemberRole[] = ["owner", "maintainer"];

export async function POST(req: Request, ctx: any) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const handle = String(params.handle ?? "").trim().toLowerCase();

  let body: { githubLogin?: string; role?: PublisherMemberRole };
  try {
    body = (await req.json()) as { githubLogin?: string; role?: PublisherMemberRole };
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const githubLogin = String(body.githubLogin ?? "").trim().toLowerCase();
  const role = body.role ?? "maintainer";
  if (!githubLogin) return NextResponse.json({ error: "githubLogin is required" }, { status: 400 });
  if (!ALLOWED_ROLES.includes(role)) return NextResponse.json({ error: "invalid role" }, { status: 400 });

  const publisher = await prisma.publisher.findUnique({
    where: { handle },
    select: { id: true, handle: true }
  });
  if (!publisher) return NextResponse.json({ error: "publisher not found" }, { status: 404 });

  const user = await prisma.appUser.findUnique({
    where: { githubLogin },
    select: { id: true, githubLogin: true }
  });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const member = await prisma.publisherMember.upsert({
    where: {
      publisherId_userId: {
        publisherId: publisher.id,
        userId: user.id
      }
    },
    update: { role },
    create: {
      publisherId: publisher.id,
      userId: user.id,
      role
    },
    select: {
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return NextResponse.json({
    ok: true,
    publisher: publisher.handle,
    githubLogin: user.githubLogin,
    role: member.role,
    updatedAt: member.updatedAt.toISOString()
  });
}

export async function DELETE(req: Request, ctx: any) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const paramsAny = ctx?.params;
  const params = typeof paramsAny?.then === "function" ? await paramsAny : paramsAny;
  const handle = String(params.handle ?? "").trim().toLowerCase();

  let body: { githubLogin?: string };
  try {
    body = (await req.json()) as { githubLogin?: string };
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const githubLogin = String(body.githubLogin ?? "").trim().toLowerCase();
  if (!githubLogin) return NextResponse.json({ error: "githubLogin is required" }, { status: 400 });

  const publisher = await prisma.publisher.findUnique({
    where: { handle },
    select: { id: true, handle: true }
  });
  if (!publisher) return NextResponse.json({ error: "publisher not found" }, { status: 404 });

  const user = await prisma.appUser.findUnique({
    where: { githubLogin },
    select: { id: true, githubLogin: true }
  });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  await prisma.publisherMember.deleteMany({
    where: {
      publisherId: publisher.id,
      userId: user.id
    }
  });

  return NextResponse.json({
    ok: true,
    publisher: publisher.handle,
    githubLogin: user.githubLogin
  });
}
