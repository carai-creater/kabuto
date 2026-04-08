import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export default async function AdminSectionLayout({
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

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
