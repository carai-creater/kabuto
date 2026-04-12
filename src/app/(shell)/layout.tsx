import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/**
 * マイページ系: サイドナビ共有（/dashboard, /wallet など）
 * DB の余計なヘルスチェックは省略し、ヘッダー・各ページと getSessionUserId を cache で共有する。
 */
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

  let isAdmin = false;
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { role: true },
    });
    isAdmin = profile?.role === "admin";
  } catch {
    isAdmin = false;
  }

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
