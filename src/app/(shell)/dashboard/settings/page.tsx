import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/app/(shell)/dashboard/settings/profile-settings-form";
import { McpConnectionsPanel } from "@/components/mcp-connections-panel";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { ensureProfileForUser } from "@/lib/auth/profile";

export async function generateMetadata() {
  return { title: "プロフィール設定 — kabuto" };
}

export default async function DashboardSettingsPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?next=%2Fdashboard%2Fsettings");
  }

  await ensureProfileForUser(userId);

  const [row, mcpRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        avatarUrl: true,
        profile: { select: { bio: true, websiteUrl: true, xUrl: true } },
      },
    }),
    prisma.userMcpConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { serverKey: true, label: true, createdAt: true, authType: true, accountEmail: true },
    }),
  ]);

  if (!row) {
    redirect("/login?next=%2Fdashboard%2Fsettings");
  }

  const initialConnections = mcpRows.map((r) => ({
    serverKey: r.serverKey,
    label: r.label,
    connectedAt: r.createdAt,
    authType: (r.authType === "oauth" ? "oauth" : "token") as "token" | "oauth",
    accountEmail: r.accountEmail,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-16 pb-8">

      {/* プロフィール */}
      <section>
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">設定</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
          プロフィール設定
        </h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">表示名・自己紹介・リンク</p>
        <div className="mt-10">
          <ProfileSettingsForm
            userId={userId}
            email={row.email}
            initialName={row.name}
            initialAvatarUrl={row.avatarUrl}
            initialBio={row.profile?.bio ?? null}
            initialWebsiteUrl={row.profile?.websiteUrl ?? null}
            initialXUrl={row.profile?.xUrl ?? null}
          />
        </div>
      </section>

      {/* MCP 外部サービス連携 */}
      <section>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">外部サービス連携</h2>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          接続したサービスは、対応エージェントが利用時に自動で使用します。
          トークンはサーバー上に暗号化して保存されます。
        </p>
        <div className="mt-6">
          <McpConnectionsPanel initialConnections={initialConnections} />
        </div>
      </section>

      <p className="text-[14px] text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          ダッシュボードに戻る
        </Link>
      </p>
    </div>
  );
}
