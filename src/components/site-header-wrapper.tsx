import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";

export async function SiteHeaderWrapper() {
  const userId = await getSessionUserId();
  const [user, balance] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        })
      : null,
    userId
      ? prisma.wallet.findUnique({
          where: { userId },
          select: { balancePt: true },
        })
      : null,
  ]);

  return (
    <SiteHeader
      email={user?.email ?? null}
      displayName={user?.name ?? user?.email ?? null}
      balancePt={balance?.balancePt ?? null}
    />
  );
}
