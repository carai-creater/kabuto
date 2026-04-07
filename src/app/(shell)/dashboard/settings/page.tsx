import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/app/(shell)/dashboard/settings/profile-settings-form";
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
    redirect("/demo");
  }

  await ensureProfileForUser(userId);

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      avatarUrl: true,
      profile: {
        select: {
          bio: true,
          websiteUrl: true,
          xUrl: true,
        },
      },
    },
  });

  if (!row) {
    redirect("/demo");
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-8">
      <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
        設定
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
        プロフィール設定
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        表示名・自己紹介・リンクを更新します。表示名・アバター URL は{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 text-[13px]">User</code>{" "}
        、自己紹介・SNS は{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 text-[13px]">profiles</code>{" "}
        に保存されます（いずれも Supabase Postgres）。
      </p>

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

      <p className="mt-12 text-[14px] text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          ダッシュボードに戻る
        </Link>
      </p>
    </div>
  );
}
