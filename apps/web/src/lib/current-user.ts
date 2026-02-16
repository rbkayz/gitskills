import type { AppUser, AppUserRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/registry";

type CurrentUser = Pick<AppUser, "id" | "githubLogin" | "role" | "status">;

function adminLoginSet(): Set<string> {
  const raw = process.env.ADMIN_GITHUB_LOGINS ?? "";
  return new Set(
    raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const sessionUser = session?.user;
  const githubId = sessionUser?.githubId?.trim();
  const githubLogin = sessionUser?.githubLogin?.trim().toLowerCase();
  if (!githubId || !githubLogin) return null;

  const shouldBeAdmin = adminLoginSet().has(githubLogin);
  const roleUpdate: { role?: AppUserRole } = shouldBeAdmin ? { role: "admin" } : {};

  const user = await prisma.appUser.upsert({
    where: { githubId },
    update: {
      githubLogin,
      email: sessionUser?.email ?? null,
      displayName: sessionUser?.name ?? null,
      avatarUrl: sessionUser?.image ?? null,
      ...roleUpdate
    },
    create: {
      githubId,
      githubLogin,
      email: sessionUser?.email ?? null,
      displayName: sessionUser?.name ?? null,
      avatarUrl: sessionUser?.image ?? null,
      role: shouldBeAdmin ? "admin" : "user"
    },
    select: {
      id: true,
      githubLogin: true,
      role: true,
      status: true
    }
  });

  if (user.status !== "active") return null;
  return user;
}
