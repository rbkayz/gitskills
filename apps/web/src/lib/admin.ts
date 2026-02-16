import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function requireAdmin(req: Request): Promise<{ ok: true; actor: string } | { ok: false; response: NextResponse }> {
  const user = await getCurrentUser();
  if (user?.role === "admin") {
    return { ok: true, actor: user.githubLogin };
  }

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
