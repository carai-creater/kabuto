import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isDemoLoginEnabled } from "@/lib/demo";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getSessionUserId } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { grantWalletPromoIfNeeded } from "@/lib/wallet-promo";

/**
 * ヘッダー表示用ユーザーデータを 5 分キャッシュ。
 * ウォレット/ロール更新時は revalidateTag(`user-header-${userId}`) で即時無効化する想定。
 * （ページ遷移ごとに DB を叩かないため 30s → 300s に延長）
 */
function getCachedHeaderUser(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          wallet: { select: { balancePt: true } },
          profile: { select: { role: true } },
        },
      });
    },
    [`user-header-${userId}`],
    { revalidate: 300, tags: [`user-header-${userId}`] },
  )();
}

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

    // プロモ付与（非同期、結果を待たずに並列実行）
    if (userId) {
      void grantWalletPromoIfNeeded(userId);
    }

    const row = userId ? await getCachedHeaderUser(userId) : null;

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
