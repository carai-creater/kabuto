import Link from "next/link";
import { Shield } from "lucide-react";

import { AdminRoleForm } from "@/app/(shell)/dashboard/admin/admin-role-form";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export async function generateMetadata() {
  return { title: "管理者 — ロール設定 — kabuto" };
}

export default async function AdminDashboardPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  const me = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
    : null;

  let recentRows: { email: string; role: string }[] = [];
  try {
    const rows = await prisma.user.findMany({
      take: 30,
      orderBy: { updatedAt: "desc" },
      select: {
        email: true,
        profile: { select: { role: true } },
      },
    });
    recentRows = rows.map((r) => ({
      email: r.email,
      role: r.profile?.role ?? "—",
    }));
  } catch {
    recentRows = [];
  }

  return (
    <div className="w-full">
      <header className="border-b border-slate-200/80 pb-8 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-slate-800">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Admin
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              ユーザーロール管理
            </h1>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          登録済みユーザー（Prisma{" "}
          <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">User</code> に存在するメール）の{" "}
          <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">profiles.role</code> を変更します。対象は少なくとも一度ログインし、アカウントが作成されている必要があります。
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          メールでロールを変更
        </h2>
        <div className="mt-6">
          <AdminRoleForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          最近更新されたユーザー（参考）
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  メール
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  ロール
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRows.map((r) => (
                <tr key={r.email}>
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                    {r.email}
                    {me?.email && r.email === me.email ? (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">（あなた）</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {r.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500 dark:text-slate-500">
        <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">
          マイページに戻る
        </Link>
      </p>
    </div>
  );
}
