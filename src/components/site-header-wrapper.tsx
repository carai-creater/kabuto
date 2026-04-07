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
        configWarning="DATABASE_URL が未設定です（Vercel の Environment Variables を確認）"
      />
    );
  }

  try {
    const userId = await getSessionUserId();
    const [user, balance, profile] = await Promise.all([
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
      userId
        ? prisma.profile.findUnique({
            where: { userId },
            select: { role: true },
          })
        : null,
    ]);

    const showCreatorAdminLink = profile?.role === "creator";

    return (
      <SiteHeader
        email={user?.email ?? null}
        displayName={user?.name ?? user?.email ?? null}
        balancePt={balance?.balancePt ?? null}
        demoLoginEnabled={isDemoLoginEnabled()}
        showCreatorAdminLink={showCreatorAdminLink}
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
        configWarning="データベースに接続できません（接続文字列・マイグレーション・ファイアウォールを確認）"
      />
    );
  }
}
