import { prisma } from "@/lib/prisma";
import { DemoUserForm } from "@/components/demo-user-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

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
    <main className={`relative flex flex-1 flex-col pb-28 pt-12 ${PAGE_SHELL}`}>
      <div className="relative mx-auto w-full max-w-lg">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          デモログイン
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
          Supabase Auth 接続前の仮セッションです。ユーザーを選ぶと Cookie{" "}
          <code className="rounded-lg bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
            kabuto_uid
          </code>{" "}
          が設定されます。
        </p>

        {users.length === 0 ? (
          <p className="surface-card mt-10 p-8 text-[15px] text-[var(--muted)]">
            ユーザーがありません。{" "}
            <code className="rounded-md bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
              npm run db:seed
            </code>{" "}
            を実行してください。
          </p>
        ) : (
          <DemoUserForm users={users} />
        )}
      </div>
    </main>
  );
}
