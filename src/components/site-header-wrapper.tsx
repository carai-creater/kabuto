import { prisma } from "@/lib/prisma";
import { isDemoLoginEnabled } from "@/lib/demo";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getSessionUserId } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";

export async function SiteHeaderWrapper() {
  if (!isDatabaseConfigured()) {
    return (
      <SiteHeader
        email={null}
        displayName={null}
        balancePt={null}
        demoLoginEnabled={isDemoLoginEnabled()}
        showCreatorAdminLink={false}
        showAdminLink={false}
      />
    );
  }

  try {
    const userId = await getSessionUserId();
    const row = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            wallet: { select: { balancePt: true } },
            profile: { select: { role: true } },
          },
        })
      : null;

    const showCreatorAdminLink = !!row;
    const showAdminLink = row?.profile?.role === "admin";

    return (
      <SiteHeader
        email={row?.email ?? null}
        displayName={row?.name ?? row?.email ?? null}
        balancePt={row?.wallet?.balancePt ?? null}
        demoLoginEnabled={isDemoLoginEnabled()}
        showCreatorAdminLink={showCreatorAdminLink}
        showAdminLink={showAdminLink}
      />
    );
  } catch (err) {
    const digest =
      err && typeof err === "object" && "digest" in err
        ? String((err as { digest?: string }).digest)
        : "";
    if (digest === "DYNAMIC_SERVER_USAGE") {
      return (
        <SiteHeader
          email={null}
          displayName={null}
          balancePt={null}
          demoLoginEnabled={isDemoLoginEnabled()}
          showCreatorAdminLink={false}
          showAdminLink={false}
        />
      );
    }
    console.error("[SiteHeaderWrapper] database error:", err);
    return (
      <SiteHeader
        email={null}
        displayName={null}
        balancePt={null}
        demoLoginEnabled={isDemoLoginEnabled()}
        showCreatorAdminLink={false}
        showAdminLink={false}
      />
    );
  }
}
