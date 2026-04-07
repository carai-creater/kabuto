import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export default async function DashboardLayout({
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

  let isCreator = false;
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { role: true },
    });
    isCreator = profile?.role === "creator";
  } catch {
    return <>{children}</>;
  }

  return <DashboardShell isCreator={isCreator}>{children}</DashboardShell>;
}
