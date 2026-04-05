import { prisma } from "@/lib/prisma";
import { DemoUserForm } from "@/components/demo-user-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export default async function DemoPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  let users: {
    id: string;
    email: string;
    name: string | null;
    wallet: { balancePt: number } | null;
  }[] = [];
  try {
    users = await prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        wallet: { select: { balancePt: true } },
      },
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-24 pt-8 sm:px-6">
      <div className="relative mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-50">デモログイン</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Supabase Auth 接続前の仮セッションです。ユーザーを選ぶと Cookie{" "}
          <code className="rounded bg-white/5 px-1">kabuto_uid</code>{" "}
          が設定されます。
        </p>

        {users.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-500">
            ユーザーがありません。{" "}
            <code className="rounded bg-white/5 px-1">npm run db:seed</code>{" "}
            を実行してください。
          </p>
        ) : (
          <DemoUserForm users={users} />
        )}
      </div>
    </main>
  );
}
