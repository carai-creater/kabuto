import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/**
 * ユーザーのロールを 5 分キャッシュ（管理者チェック）。
 * ロール変更時は revalidateTag(`user-role-${userId}`) で無効化。
 */
function getCachedUserRole(userId: string) {
  return unstable_cache(
    async () => {
      try {
        const profile = await prisma.profile.findUnique({
          where: { userId },
          select: { role: true },
        });
        return profile?.role ?? "user";
      } catch {
        return "user";
      }
    },
    [`user-role-${userId}`],
    { revalidate: 300, tags: [`user-role-${userId}`] },
  )();
}

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isDatabaseConfigured()) {
    return <>{children}</>;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?login_error=no_app_user");
  }

  const role = await getCachedUserRole(userId);
  const isAdmin = role === "admin";

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
