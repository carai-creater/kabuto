import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/**
 * マイページ系: サイドナビ共有（/dashboard, /wallet など）
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
    redirect("/demo");
  }

  try {
    await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
  } catch {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
