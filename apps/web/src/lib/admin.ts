import { NextResponse } from "next/server";

export function requireAdmin(req: Request): { ok: true; actor: string } | { ok: false; response: NextResponse } {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return { ok: false, response: NextResponse.json({ error: "admin token is not configured" }, { status: 501 }) };
  }
  const token = req.headers.get("x-admin-token");
  if (!token || token !== expected) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const actor = req.headers.get("x-admin-actor")?.trim() || "admin";
  return { ok: true, actor };
}

