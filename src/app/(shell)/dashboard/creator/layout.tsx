import { redirect } from "next/navigation";

import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export default async function CreatorDashboardSectionLayout({
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

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true },
  });

  if (profile?.role !== "creator") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
