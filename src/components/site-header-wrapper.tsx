import { prisma } from "@/lib/prisma";
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
        configWarning="DATABASE_URL が未設定です（Vercel の Environment Variables を確認）"
      />
    );
  }

  try {
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
  } catch (err) {
    console.error("[SiteHeaderWrapper] database error:", err);
    return (
      <SiteHeader
        email={null}
        displayName={null}
        balancePt={null}
        configWarning="データベースに接続できません（接続文字列・マイグレーション・ファイアウォールを確認）"
      />
    );
  }
}
